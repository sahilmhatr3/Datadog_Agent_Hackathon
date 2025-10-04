"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  Clock,
  MapPin,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Database } from "@/lib/database.types";

export type InviteStatus = Database["public"]["Enums"]["invite_status"];

type ParticipantSnapshot = {
  userId: string;
  name: string;
  lastContributionAt: string;
  ideaSummary?: string;
  topRecommendations: Array<{
    id: string;
    placeName: string;
    city?: string;
    matchScore: number;
  }>;
};

export type SessionInvitePreview = {
  id: string;
  sessionId: string;
  sessionTitle: string;
  destination?: string;
  inviterName: string;
  inviterEmail?: string;
  status: InviteStatus;
  createdAt: string;
  message?: string;
  participants: ParticipantSnapshot[];
  aggregateSummary?: {
    summary: string;
    highlights: string[];
  };
};

type SessionInvitesProps = {
  invites?: SessionInvitePreview[];
  onAcceptInvite?: (inviteId: string) => void;
  onDeclineInvite?: (inviteId: string) => void;
};

const mockInvites: SessionInvitePreview[] = [
  {
    id: "invite-1",
    sessionId: "session-paris-weekend",
    sessionTitle: "Paris Culinary Weekend",
    destination: "Paris, France",
    inviterName: "Mila Chen",
    inviterEmail: "mila@example.com",
    status: "pending",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    message:
      "Join us to build out the food lineup — we need another opinion on bistros vs. wine bars!",
    participants: [
      {
        userId: "user-1",
        name: "Mila Chen",
        lastContributionAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        ideaSummary:
          "Loves modern bistros, wants a late-night natural wine spot and a lazy Sunday brunch.",
        topRecommendations: [
          {
            id: "rec-mila-1",
            placeName: "Le Petit Cler",
            city: "7th Arrondissement",
            matchScore: 92,
          },
          {
            id: "rec-mila-2",
            placeName: "La Buvette",
            city: "Oberkampf",
            matchScore: 88,
          },
        ],
      },
      {
        userId: "user-2",
        name: "Alex Rivera",
        lastContributionAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        ideaSummary:
          "Hunting for patisserie crawl and an evening jazz club near the Seine.",
        topRecommendations: [
          {
            id: "rec-alex-1",
            placeName: "Stohrer",
            city: "Montorgueil",
            matchScore: 90,
          },
          {
            id: "rec-alex-2",
            placeName: "Le Caveau de la Huchette",
            city: "Latin Quarter",
            matchScore: 84,
          },
        ],
      },
    ],
    aggregateSummary: {
      summary:
        "Team wants a cozy-but-lively food crawl that ends with jazz by the river. Splitting time between Right Bank pastries and Left Bank wine bars.",
      highlights: [
        "Saturday evening natural wine crawl",
        "Sunday brunch with view of Eiffel Tower",
        "Late-night jazz club wishlist",
      ],
    },
  },
  {
    id: "invite-2",
    sessionId: "session-lisbon-gathering",
    sessionTitle: "Lisbon Remote Work Sprint",
    destination: "Lisbon, Portugal",
    inviterName: "Jordan Blake",
    inviterEmail: "jordan@example.com",
    status: "pending",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    participants: [
      {
        userId: "user-3",
        name: "Jordan Blake",
        lastContributionAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        ideaSummary:
          "Needs daylight-friendly cafés with strong Wi-Fi and evening tapas to unwind.",
        topRecommendations: [
          {
            id: "rec-jordan-1",
            placeName: "Hello, Kristof",
            city: "Cais do Sodré",
            matchScore: 86,
          },
          {
            id: "rec-jordan-2",
            placeName: "Boa-Bao",
            city: "Chiado",
            matchScore: 81,
          },
        ],
      },
    ],
    aggregateSummary: {
      summary:
        "Focus is on bright cowork cafés near the river, plus relaxed tapas and miradouro sunset spots after work sessions.",
      highlights: [
        "Cowork cafés with strong Wi-Fi",
        "Tapas crawl for Thursday night",
        "Sunset lookout planning",
      ],
    },
  },
];

const statusCopy: Record<InviteStatus, { label: string; tone: string }> = {
  pending: { label: "Pending", tone: "bg-amber-100 text-amber-900" },
  accepted: { label: "Accepted", tone: "bg-emerald-100 text-emerald-900" },
  declined: { label: "Declined", tone: "bg-rose-100 text-rose-900" },
  expired: { label: "Expired", tone: "bg-muted text-muted-foreground" },
};

function formatRelativeTime(isoDate: string) {
  const deltaMs = Date.now() - new Date(isoDate).getTime();
  const deltaMinutes = Math.round(deltaMs / (1000 * 60));
  if (deltaMinutes < 1) return "just now";
  if (deltaMinutes < 60) return `${deltaMinutes} min ago`;
  const deltaHours = Math.round(deltaMinutes / 60);
  if (deltaHours < 24) return `${deltaHours} hr ago`;
  const deltaDays = Math.round(deltaHours / 24);
  return `${deltaDays} day${deltaDays > 1 ? "s" : ""} ago`;
}

export function SessionInvites({
  invites = mockInvites,
  onAcceptInvite,
  onDeclineInvite,
}: SessionInvitesProps) {
  const [expandedInviteId, setExpandedInviteId] = useState<string | null>(
    invites.length ? invites[0].id : null,
  );

  const pendingInvites = useMemo(
    () => invites.filter((invite) => invite.status === "pending"),
    [invites],
  );

  if (!invites.length) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
          <Sparkles className="h-6 w-6" />
          <p>No new collaborations yet. Keep planning and watch this space.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Session invites
          </h2>
          <p className="text-sm text-muted-foreground">
            Collaborators want to build with you. Open a session snapshot to see
            their current picks and vibe.
          </p>
        </div>
        <Badge variant="outline" className="w-fit text-xs font-medium">
          {pendingInvites.length} pending invite{pendingInvites.length === 1 ? "" : "s"}
        </Badge>
      </div>

      <div className="grid gap-3">
        {invites.map((invite) => {
          const isExpanded = expandedInviteId === invite.id;
          const status = statusCopy[invite.status];

          return (
            <Card key={invite.id} className="p-4 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">
                      {invite.sessionTitle}
                    </h3>
                    <Badge className={status.tone}>{status.label}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    {invite.destination && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {invite.destination}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      Hosted by {invite.inviterName}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Received {formatRelativeTime(invite.createdAt)}
                    </span>
                  </div>
                  {invite.message && (
                    <p className="text-sm text-muted-foreground/90">
                      “{invite.message}”
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  {invite.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => onAcceptInvite?.(invite.id)}
                        className="gap-1"
                      >
                        <Check className="h-4 w-4" /> Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDeclineInvite?.(invite.id)}
                        className="gap-1"
                      >
                        <X className="h-4 w-4" /> Decline
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant={isExpanded ? "secondary" : "ghost"}
                    onClick={() =>
                      setExpandedInviteId((current) =>
                        current === invite.id ? null : invite.id,
                      )
                    }
                    className="gap-1"
                  >
                    <Sparkles className="h-4 w-4" />
                    {isExpanded ? "Hide snapshot" : "View snapshot"}
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <div className="grid gap-6 lg:grid-cols-5">
                  <div className="lg:col-span-2 space-y-3">
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Group alignment
                      </h4>
                      {invite.aggregateSummary ? (
                        <div className="space-y-3">
                          <p className="text-sm text-foreground/80">
                            {invite.aggregateSummary.summary}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {invite.aggregateSummary.highlights.map((highlight) => (
                              <Badge
                                key={highlight}
                                variant="outline"
                                className="text-xs font-medium"
                              >
                                {highlight}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No shared summary yet — be the first to drop your ideas.
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Last updated {formatRelativeTime(invite.createdAt)}
                    </div>
                  </div>

                  <div className="lg:col-span-3 space-y-4">
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Participant picks
                    </h4>
                    <div className="space-y-4">
                      {invite.participants.map((participant) => (
                        <Card key={participant.userId} className="border-dashed p-4">
                          <div className="flex flex-col gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold">
                                {participant.name}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                Updated {formatRelativeTime(participant.lastContributionAt)}
                              </Badge>
                            </div>
                            {participant.ideaSummary && (
                              <p className="text-sm text-muted-foreground">
                                {participant.ideaSummary}
                              </p>
                            )}
                            <div className="grid gap-2 sm:grid-cols-2">
                              {participant.topRecommendations.map((rec) => (
                                <div
                                  key={`${participant.userId}-${rec.id}`}
                                  className="rounded-lg border bg-card p-3"
                                >
                                  <div className="text-sm font-medium">
                                    {rec.placeName}
                                  </div>
                                  {rec.city && (
                                    <div className="text-xs text-muted-foreground">
                                      {rec.city}
                                    </div>
                                  )}
                                  <div className="mt-2 text-xs text-primary font-semibold">
                                    Match score {rec.matchScore}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
