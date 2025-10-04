"use client";

import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Session {
  id: string;
  title: string;
  destination_city?: string;
  destination_country?: string;
  start_time?: string;
  end_time?: string;
  created_at: string;
  participant_count?: number;
}

interface PreviousSessionsProps {
  sessions?: Session[];
  onSessionClick?: (sessionId: string) => void;
}

export function PreviousSessions({
  sessions = [],
  onSessionClick,
}: PreviousSessionsProps) {
  // Mock data if no sessions provided
  const mockSessions: Session[] = sessions.length
    ? sessions
    : [
        {
          id: "1",
          title: "Weekend in Paris",
          destination_city: "Paris",
          destination_country: "France",
          start_time: "2025-10-15T10:00:00Z",
          end_time: "2025-10-17T18:00:00Z",
          created_at: "2025-09-28T14:30:00Z",
          participant_count: 2,
        },
        {
          id: "2",
          title: "Tokyo Food Tour",
          destination_city: "Tokyo",
          destination_country: "Japan",
          start_time: "2025-11-01T09:00:00Z",
          end_time: "2025-11-05T20:00:00Z",
          created_at: "2025-09-25T10:15:00Z",
          participant_count: 4,
        },
        {
          id: "3",
          title: "Barcelona Adventure",
          destination_city: "Barcelona",
          destination_country: "Spain",
          created_at: "2025-09-20T16:45:00Z",
          participant_count: 1,
        },
      ];

  if (mockSessions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
        <h3 className="font-semibold mb-2">No previous sessions</h3>
        <p className="text-sm text-muted-foreground">
          Start your first Scout session by searching above
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5" />
        Recent Sessions
      </h3>
      {mockSessions.map((session) => (
        <Card
          key={session.id}
          className="p-4 hover:shadow-md transition-shadow cursor-pointer group"
          onClick={() => onSessionClick?.(session.id)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold group-hover:text-primary transition-colors">
                {session.title}
              </h4>

              <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                {session.destination_city && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>
                      {session.destination_city}, {session.destination_country}
                    </span>
                  </div>
                )}

                {session.start_time && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {new Date(session.start_time).toLocaleDateString()}
                      {session.end_time &&
                        ` - ${new Date(session.end_time).toLocaleDateString()}`}
                    </span>
                  </div>
                )}

                {session.participant_count && (
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    <span>{session.participant_count} participant{session.participant_count > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            </div>

            <Badge variant="outline" className="text-xs">
              {new Date(session.created_at).toLocaleDateString([], {
                month: "short",
                day: "numeric",
              })}
            </Badge>
          </div>
        </Card>
      ))}
    </div>
  );
}

