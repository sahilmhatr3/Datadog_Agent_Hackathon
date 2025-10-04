import OpenAI from "openai";

type Role = "user" | "assistant" | "system";

export interface ChatMessage {
  role: Role;
  content: string;
  timestamp?: string;
}

type Stage = "collecting" | "searching" | "finalizing";

interface AnalysisResult {
  stage: Stage;
  summary: string;
  missing_information: string[];
  follow_up_question?: string;
  search_queries: string[];
  should_call_linkup: boolean;
  should_call_scout: boolean;
  scout_prompt?: string;
  confidence?: number;
}

interface LinkupPayload {
  q: string;
  depth: string;
  outputType: string;
  includeSources: boolean;
  includeInlineCitations: boolean;
  includeImages: boolean;
  fromDate?: string;
  toDate?: string;
  excludeDomains?: string[];
  includeDomains?: string[];
  structuredOutputSchema?: unknown;
}

interface LinkupResult {
  query: string;
  ok: boolean;
  data?: unknown;
  error?: string;
  took_ms?: number;
  payload: LinkupPayload;
}

interface ScoutProcessorResponse {
  session_id?: string | null;
  prompt: string;
  parameters: Record<string, unknown>;
  meta: Record<string, unknown>;
}

export interface OrchestratorResult {
  sessionId: string;
  stage: Stage;
  assistantMessage: string;
  missingInformation: string[];
  analysis: AnalysisResult;
  parameters: Record<string, unknown>;
  linkup: {
    attempted: boolean;
    queries: string[];
    results: LinkupResult[];
  };
  scout?: ScoutProcessorResponse | null;
  meta: Record<string, unknown>;
}

interface OrchestratorConfig {
  openaiApiKey: string;
  model?: string;
  scoutApiUrl: string;
  linkupApiKey?: string;
  linkupApiUrl?: string;
  linkupDepth?: string;
  linkupOutputType?: string;
  linkupIncludeSources?: boolean;
  linkupIncludeInlineCitations?: boolean;
  linkupIncludeImages?: boolean;
  linkupFromDate?: string;
  linkupToDate?: string;
  linkupIncludeDomains?: string[];
  linkupExcludeDomains?: string[];
  linkupStructuredOutputSchema?: unknown;
}

interface RunOptions {
  sessionId?: string;
  messages: ChatMessage[];
  useFullHistory: boolean;
}

const ANALYSIS_SYSTEM_PROMPT = `You are the planning strategist for the Scout travel assistant.
Review the conversation snippet and decide what should happen next.

Return JSON that strictly follows the provided schema. Guidance:
- stage = 
  • collecting — More user input is required before any tool usage.
  • searching — You can call Linkup to gather web context but defer final Scout processing until results are reviewed.
  • finalizing — You have enough details to run Linkup and then finalize through the Scout processor.
- Always list missing_information (empty array if nothing).
- follow_up_question should be concise, actionable, and only present when stage === "collecting".
- search_queries should include concrete web search phrases when calling Linkup.
- scout_prompt should be a clean, single prompt summarizing the user's intent for the Scout processor.
- should_call_linkup and should_call_scout must never be null; set them to true when you believe we have enough info to invoke those services.
- confidence is a float between 0 and 1 representing how confident you are that the chosen stage is correct.`;

const FINAL_RESPONSE_SYSTEM_PROMPT = `You are Scout, an itinerary co-pilot.
Craft a concise, friendly reply that references any useful Linkup search results and the structured parameters from the Scout processor.
- Answer in natural language (no JSON) with clear next steps.
- Offer 2-4 bullet points of actionable suggestions when helpful.
- Invite the user to share anything that is still missing.`;

function pruneConversation(messages: ChatMessage[], limit = 6): ChatMessage[] {
  if (messages.length <= limit) {
    return messages;
  }
  return messages.slice(-limit);
}

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export class ScoutAssistantOrchestrator {
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly scoutApiUrl: string;
  private readonly linkupApiKey?: string;
  private readonly linkupApiUrl?: string;
  private readonly linkupDepth: string;
  private readonly linkupOutputType: string;
  private readonly linkupIncludeSources: boolean;
  private readonly linkupIncludeInlineCitations: boolean;
  private readonly linkupIncludeImages: boolean;
  private readonly linkupFromDate?: string;
  private readonly linkupToDate?: string;
  private readonly linkupIncludeDomains?: string[];
  private readonly linkupExcludeDomains?: string[];
  private readonly linkupStructuredOutputSchema?: unknown;

  constructor(private readonly config: OrchestratorConfig) {
    this.client = new OpenAI({ apiKey: config.openaiApiKey });
    this.model = config.model ?? "gpt-4.1-mini";
    this.scoutApiUrl = config.scoutApiUrl;
    this.linkupApiKey = config.linkupApiKey;
    this.linkupApiUrl =
      config.linkupApiUrl ?? "https://api.linkup.so/v1/search";
    this.linkupDepth = config.linkupDepth ?? "standard";
    this.linkupOutputType = config.linkupOutputType ?? "sourcedAnswer";
    this.linkupIncludeSources = config.linkupIncludeSources ?? true;
    this.linkupIncludeInlineCitations =
      config.linkupIncludeInlineCitations ?? false;
    this.linkupIncludeImages = config.linkupIncludeImages ?? false;
    this.linkupFromDate = config.linkupFromDate;
    this.linkupToDate = config.linkupToDate;
    this.linkupIncludeDomains = config.linkupIncludeDomains;
    this.linkupExcludeDomains = config.linkupExcludeDomains;
    this.linkupStructuredOutputSchema = config.linkupStructuredOutputSchema;
  }

  async run({ messages, sessionId, useFullHistory }: RunOptions): Promise<OrchestratorResult> {
    const resolvedSessionId = sessionId ?? `session-${Date.now()}`;

    const analysis = await this.analyzeConversation(messages);

    if (!analysis) {
      throw new Error("OpenAI analysis failed to return a valid directive");
    }

    if (analysis.stage === "collecting") {
      return {
        sessionId: resolvedSessionId,
        stage: analysis.stage,
        assistantMessage:
          analysis.follow_up_question ??
          "I need a bit more detail to keep planning. Could you clarify what you have in mind?",
        missingInformation: analysis.missing_information,
        analysis,
        parameters: {},
        linkup: {
          attempted: false,
          queries: analysis.search_queries,
          results: [],
        },
        scout: null,
        meta: {
          reason: "information_gathering",
          model: this.model,
        },
      };
    }

    const linkupResults = analysis.should_call_linkup
      ? await this.callLinkup(analysis.search_queries)
      : [];

    const scoutResponse = analysis.should_call_scout
      ? await this.callScoutProcessor({
          sessionId: resolvedSessionId,
          messages,
          useFullHistory,
          promptOverride: analysis.scout_prompt ?? analysis.summary,
        })
      : null;

    const parameters = scoutResponse?.parameters ?? {};

    const assistantMessage = await this.generateFinalMessage({
      messages,
      analysis,
      linkupResults,
      parameters,
    });

    return {
      sessionId: resolvedSessionId,
      stage: analysis.stage,
      assistantMessage,
      missingInformation: analysis.missing_information,
      analysis,
      parameters,
      linkup: {
        attempted: analysis.should_call_linkup,
        queries: analysis.search_queries,
        results: linkupResults,
      },
      scout: scoutResponse,
      meta: {
        model: this.model,
        linkupAttempted: analysis.should_call_linkup,
        scoutAttempted: analysis.should_call_scout,
      },
    };
  }

  private async analyzeConversation(messages: ChatMessage[]): Promise<AnalysisResult | null> {
    const trimmedMessages = pruneConversation(messages).map((message) => ({
      role: message.role,
      content: message.content,
      timestamp: message.timestamp,
    }));

    const response = await this.client.responses.create({
      model: this.model,
      input: [
        { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
        {
          role: "user",
          content: JSON.stringify({
            conversation: trimmedMessages,
          }),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "ScoutPlanningDirective",
          schema: {
            type: "object",
            required: [
              "stage",
              "summary",
              "missing_information",
              "search_queries",
              "should_call_linkup",
              "should_call_scout",
            ],
            properties: {
              stage: {
                type: "string",
                enum: ["collecting", "searching", "finalizing"],
              },
              summary: { type: "string" },
              missing_information: {
                type: "array",
                items: { type: "string" },
              },
              follow_up_question: { type: "string" },
              search_queries: {
                type: "array",
                items: { type: "string" },
                default: [],
              },
              should_call_linkup: { type: "boolean" },
              should_call_scout: { type: "boolean" },
              scout_prompt: { type: "string" },
              confidence: { type: "number" },
            },
            additionalProperties: false,
          },
        },
      },
    });

    const parsed = safeJsonParse<AnalysisResult>(response.output_text ?? "");

    return parsed;
  }

  private buildLinkupPayload(query: string): LinkupPayload {
    const payload: LinkupPayload = {
      q: query,
      depth: this.linkupDepth,
      outputType: this.linkupOutputType,
      includeSources: this.linkupIncludeSources,
      includeInlineCitations: this.linkupIncludeInlineCitations,
      includeImages: this.linkupIncludeImages,
    };

    if (this.linkupFromDate) {
      payload.fromDate = this.linkupFromDate;
    }

    if (this.linkupToDate) {
      payload.toDate = this.linkupToDate;
    }

    if (this.linkupIncludeDomains?.length) {
      payload.includeDomains = this.linkupIncludeDomains;
    }

    if (this.linkupExcludeDomains?.length) {
      payload.excludeDomains = this.linkupExcludeDomains;
    }

    if (this.linkupStructuredOutputSchema !== undefined) {
      payload.structuredOutputSchema = this.linkupStructuredOutputSchema;
    }

    return payload;
  }

  private async callLinkup(queries: string[]): Promise<LinkupResult[]> {
    if (!this.linkupApiUrl || !this.linkupApiKey || queries.length === 0) {
      return queries.map((query) => ({
        query,
        ok: false,
        payload: this.buildLinkupPayload(query),
        error: this.linkupApiUrl
          ? "Linkup API key missing"
          : "Linkup API not configured",
      }));
    }

    const results: LinkupResult[] = [];

    for (const query of queries) {
      const payload = this.buildLinkupPayload(query);
      const startedAt = Date.now();
      try {
        const response = await fetch(this.linkupApiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.linkupApiKey}`,
          },
          body: JSON.stringify(payload),
        });

        const took_ms = Date.now() - startedAt;

        if (!response.ok) {
          const errorText = await response.text();
          results.push({
            query,
            ok: false,
            payload,
            error: `Linkup returned ${response.status}: ${errorText}`,
            took_ms,
          });
          continue;
        }

        const data = await response.json();
        results.push({ query, ok: true, data, took_ms, payload });
      } catch (error) {
        results.push({
          query,
          ok: false,
          payload,
          error: error instanceof Error ? error.message : "Unknown Linkup error",
        });
      }
    }

    return results;
  }

  private async callScoutProcessor({
    sessionId,
    messages,
    useFullHistory,
    promptOverride,
  }: {
    sessionId: string;
    messages: ChatMessage[];
    useFullHistory: boolean;
    promptOverride: string;
  }): Promise<ScoutProcessorResponse | null> {
    const response = await fetch(this.scoutApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session_id: sessionId,
        use_full_history: useFullHistory,
        messages,
        prompt_override: promptOverride,
      }),
    });

    if (!response.ok) {
      return {
        session_id: sessionId,
        prompt: promptOverride,
        parameters: {},
        meta: {
          error: `Scout processor returned ${response.status}`,
        },
      };
    }

    const data = (await response.json()) as ScoutProcessorResponse;

    return data;
  }

  private async generateFinalMessage({
    messages,
    analysis,
    linkupResults,
    parameters,
  }: {
    messages: ChatMessage[];
    analysis: AnalysisResult;
    linkupResults: LinkupResult[];
    parameters: Record<string, unknown>;
  }): Promise<string> {
    const trimmedMessages = pruneConversation(messages);

    const response = await this.client.responses.create({
      model: this.model,
      input: [
        { role: "system", content: FINAL_RESPONSE_SYSTEM_PROMPT },
        {
          role: "user",
          content: JSON.stringify({
            conversation: trimmedMessages,
            analysis,
            linkupResults,
            parameters,
          }),
        },
      ],
    });

    return (response.output_text ?? "Here's what I found for you.").trim();
  }
}

let orchestratorInstance: ScoutAssistantOrchestrator | null = null;

function parseBooleanEnv(value: string | undefined): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "y"].includes(normalized)) {
    return true;
  }
  if (["false", "0", "no", "n"].includes(normalized)) {
    return false;
  }

  return undefined;
}

function parseCsvEnv(value: string | undefined): string[] | undefined {
  if (!value) {
    return undefined;
  }

  const entries = value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  return entries.length > 0 ? entries : undefined;
}

function parseJsonEnv(value: string | undefined): unknown | undefined {
  if (!value) {
    return undefined;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export function getOrchestrator(): ScoutAssistantOrchestrator {
  if (orchestratorInstance) {
    return orchestratorInstance;
  }

  const openaiApiKey = process.env.OPENAI_API_KEY;
  const scoutApiUrl =
    process.env.SCOUT_API_URL ?? process.env.NEXT_PUBLIC_SCOUT_API_URL;

  if (!openaiApiKey) {
    throw new Error(
      "OPENAI_API_KEY must be set to use the Scout assistant orchestrator",
    );
  }

  if (!scoutApiUrl) {
    throw new Error(
      "SCOUT_API_URL or NEXT_PUBLIC_SCOUT_API_URL must be configured",
    );
  }

  orchestratorInstance = new ScoutAssistantOrchestrator({
    openaiApiKey,
    scoutApiUrl,
    model: process.env.SCOUT_OPENAI_MODEL,
    linkupApiKey: process.env.LINKUP_API_KEY,
    linkupApiUrl:
      process.env.LINKUP_API_URL ??
      process.env.NEXT_PUBLIC_LINKUP_API_URL ??
      undefined,
    linkupDepth: process.env.LINKUP_DEPTH,
    linkupOutputType: process.env.LINKUP_OUTPUT_TYPE,
    linkupIncludeSources: parseBooleanEnv(process.env.LINKUP_INCLUDE_SOURCES),
    linkupIncludeInlineCitations: parseBooleanEnv(
      process.env.LINKUP_INCLUDE_INLINE_CITATIONS,
    ),
    linkupIncludeImages: parseBooleanEnv(process.env.LINKUP_INCLUDE_IMAGES),
    linkupFromDate: process.env.LINKUP_FROM_DATE,
    linkupToDate: process.env.LINKUP_TO_DATE,
    linkupIncludeDomains: parseCsvEnv(process.env.LINKUP_INCLUDE_DOMAINS),
    linkupExcludeDomains: parseCsvEnv(process.env.LINKUP_EXCLUDE_DOMAINS),
    linkupStructuredOutputSchema: parseJsonEnv(
      process.env.LINKUP_STRUCTURED_OUTPUT_SCHEMA,
    ),
  });

  return orchestratorInstance;
}
