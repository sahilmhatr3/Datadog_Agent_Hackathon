"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { Loader2, SendHorizontal, UserPlus2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";

import type { Database } from "@/lib/database.types";

type SessionInviteRow = Database["public"]["Tables"]["session_invites"]["Row"];

type InviteCollaboratorCardProps = {
  sessionId?: string;
  currentQuery?: string;
};

type InviteStatusState =
  | { variant: "idle" }
  | { variant: "success"; message: string }
  | { variant: "error"; message: string };

export function InviteCollaboratorCard({
  sessionId,
  currentQuery,
}: InviteCollaboratorCardProps) {
  const [inviteeEmail, setInviteeEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<InviteStatusState>({ variant: "idle" });
  const [recentInvites, setRecentInvites] = useState<SessionInviteRow[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let isActive = true;

    supabase.auth.getUser().then(({ data, error }) => {
      if (!isActive) return;
      if (error) {
        console.error("Unable to fetch current user", error);
        setStatus({ variant: "error", message: "Cannot load your profile. Refresh and try again." });
        return;
      }
      setCurrentUserId(data.user?.id ?? null);
    });

    return () => {
      isActive = false;
    };
  }, [supabase]);

  const disabledReason = useMemo(() => {
    if (!sessionId) {
      return "Create or resume a session to send invites.";
    }
    if (!currentUserId) {
      return "Sign in again to invite collaborators.";
    }
    return null;
  }, [sessionId, currentUserId]);

  const handleSendInvite = useCallback(async () => {
    if (!sessionId || !currentUserId) {
      setStatus({ variant: "error", message: disabledReason ?? "Session not ready." });
      return;
    }

    const trimmedEmail = inviteeEmail.trim().toLowerCase();
    if (!trimmedEmail) {
      setStatus({ variant: "error", message: "Add an email before sending." });
      return;
    }

    setIsSending(true);
    setStatus({ variant: "idle" });

    const metadata = {
      source: "chat-session",
      queryContext: currentQuery ?? null,
    } satisfies SessionInviteRow["metadata"];

    const { data, error } = await supabase
      .from("session_invites")
      .insert({
        session_id: sessionId,
        inviter_id: currentUserId,
        invitee_email: trimmedEmail,
        message: inviteMessage.trim() || null,
        metadata,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to send invite", error);
      setStatus({ variant: "error", message: error.message || "Something went wrong. Try again." });
      setIsSending(false);
      return;
    }

    setRecentInvites((prev) => [data, ...prev].slice(0, 5));
    setInviteeEmail("");
    setInviteMessage("");
    setStatus({ variant: "success", message: "Invite sent." });
    setIsSending(false);
  }, [sessionId, currentUserId, inviteeEmail, inviteMessage, supabase, currentQuery, disabledReason]);

  return (
    <Card className="space-y-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <UserPlus2 className="h-4 w-4 text-primary" />
            Invite collaborators
          </h2>
          <p className="text-sm text-muted-foreground">
            Send a quick invite so friends can add their ideas to this session.
          </p>
        </div>
        <Badge variant="outline" className="text-xs font-medium">
          {recentInvites.length} sent
        </Badge>
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="invite-email">Invitee email</Label>
          <Input
            id="invite-email"
            type="email"
            value={inviteeEmail}
            onChange={(event) => setInviteeEmail(event.target.value)}
            placeholder="friend@example.com"
            disabled={isSending || !!disabledReason}
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="invite-message">Personal note</Label>
          <Textarea
            id="invite-message"
            value={inviteMessage}
            onChange={(event) => setInviteMessage(event.target.value)}
            placeholder="Let them know what vibe you're planning."
            disabled={isSending || !!disabledReason}
            rows={3}
          />
        </div>

        <Button
          className="w-full gap-2"
          onClick={handleSendInvite}
          disabled={isSending || !!disabledReason}
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <SendHorizontal className="h-4 w-4" />
          )}
          {isSending ? "Sending" : "Send invite"}
        </Button>

        {disabledReason && (
          <p className="text-xs text-muted-foreground">{disabledReason}</p>
        )}

        {status.variant === "error" && (
          <p className="text-sm text-destructive" role="alert">
            {status.message}
          </p>
        )}

        {status.variant === "success" && (
          <p className="text-sm text-emerald-600" role="status">
            {status.message}
          </p>
        )}
      </div>

      {recentInvites.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Recent invites
          </h3>
          <div className="space-y-2">
            {recentInvites.map((invite) => (
              <div
                key={invite.id}
                className="rounded-lg border bg-card px-3 py-2 text-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{invite.invitee_email}</span>
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                    {invite.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Sent on {new Date(invite.created_at).toLocaleString()}
                </p>
                {invite.message && (
                  <p className="mt-1 text-xs">
                    “{invite.message}”
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
