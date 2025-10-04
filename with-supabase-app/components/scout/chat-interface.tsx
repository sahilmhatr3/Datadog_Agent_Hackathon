"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  initialQuery?: string;
  sessionId?: string;
}

export function ChatInterface({
  initialQuery,
  sessionId,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize with the initial search query and AI greeting
    if (initialQuery) {
      setMessages([
        {
          id: "1",
          role: "user",
          content: initialQuery,
          timestamp: new Date(),
        },
        {
          id: "2",
          role: "assistant",
          content: `Great! I'm excited to help you with "${initialQuery}". To create the perfect itinerary for you, I'd love to know a bit more:\n\n• What dates are you planning to visit?\n• How many people will be in your group?\n• What's your preferred vibe? (e.g., romantic, adventurous, foodie, luxury)\n• Any specific budget in mind?`,
          timestamp: new Date(),
        },
      ]);
    }
  }, [initialQuery]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response (mock for now)
    setTimeout(() => {
      const responses = [
        "Perfect! Based on your preferences, I'm finding some amazing options for you. Would you like me to focus on any specific neighborhoods or areas?",
        "Great choices! I'm curating a personalized itinerary. Should I include any specific cuisines or activities you're interested in?",
        "Excellent! I'm compiling recommendations that match your vibe. Any dietary restrictions or accessibility needs I should know about?",
        "Thanks for that info! I'm building your custom itinerary now. Would you like me to include time for rest between activities?",
      ];

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <Card className="flex flex-col h-[600px] w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="bg-primary/10 p-2 rounded-full">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Scout AI Assistant</h3>
          <p className="text-sm text-muted-foreground">
            {sessionId
              ? `Session #${sessionId.slice(0, 8)}`
              : "Planning your perfect itinerary"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-center text-muted-foreground">
            <div>
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary/50" />
              <p>Start a conversation to plan your adventure</p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <Avatar className="h-8 w-8 flex-shrink-0">
              <div
                className={`h-full w-full flex items-center justify-center text-xs font-semibold ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-gradient-to-br from-purple-500 to-indigo-500 text-white"
                }`}
              >
                {message.role === "user" ? "You" : "AI"}
              </div>
            </Avatar>
            <div
              className={`flex-1 ${
                message.role === "user" ? "text-right" : "text-left"
              }`}
            >
              <div
                className={`inline-block max-w-[80%] p-3 rounded-2xl ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1 px-1">
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-500 text-white">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </Avatar>
            <div className="bg-muted p-3 rounded-2xl">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex gap-2 p-4 border-t bg-background"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tell me more about your preferences..."
          disabled={isLoading}
          className="flex-1"
        />
        <Button type="submit" disabled={!input.trim() || isLoading} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </Card>
  );
}

