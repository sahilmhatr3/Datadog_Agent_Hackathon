-- Session collaboration enhancements: shared profile visibility, voting, invite acceptance helpers

-- Allow authenticated users to view collaborator profiles for discovery
DO $outer$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'profiles_read_authenticated'
  ) THEN
    EXECUTE 'CREATE POLICY profiles_read_authenticated ON public.profiles
      FOR SELECT USING (auth.role() = ''authenticated'')';
  END IF;
END
$outer$;

-- Create session_votes table for collaborative decision making
CREATE TABLE IF NOT EXISTS public.session_votes (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  voter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_id uuid NOT NULL REFERENCES public.recommendations(id) ON DELETE CASCADE,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  weight integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, voter_id, recommendation_id)
);

CREATE INDEX IF NOT EXISTS idx_session_votes_session ON public.session_votes(session_id);
CREATE INDEX IF NOT EXISTS idx_session_votes_recommendation ON public.session_votes(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_session_votes_voter ON public.session_votes(voter_id);

ALTER TABLE public.session_votes ENABLE ROW LEVEL SECURITY;

-- Voting policies
DO $outer$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'session_votes'
      AND policyname = 'session_votes_select'
  ) THEN
    EXECUTE 'CREATE POLICY session_votes_select ON public.session_votes
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.sessions s
          WHERE s.id = session_votes.session_id
            AND s.owner_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1
          FROM public.session_participants sp
          WHERE sp.session_id = session_votes.session_id
            AND sp.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1
          FROM public.session_invites si
          WHERE si.session_id = session_votes.session_id
            AND si.invitee_user_id = auth.uid()
            AND si.status IN (''pending'', ''accepted'')
        )
      )';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'session_votes'
      AND policyname = 'session_votes_insert'
  ) THEN
    EXECUTE 'CREATE POLICY session_votes_insert ON public.session_votes
      FOR INSERT
      WITH CHECK (
        auth.uid() = voter_id
        AND (
          EXISTS (
            SELECT 1
            FROM public.sessions s
            WHERE s.id = session_votes.session_id
              AND s.owner_id = auth.uid()
          )
          OR EXISTS (
            SELECT 1
            FROM public.session_participants sp
            WHERE sp.session_id = session_votes.session_id
              AND sp.user_id = auth.uid()
          )
        )
      )';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'session_votes'
      AND policyname = 'session_votes_update'
  ) THEN
    EXECUTE 'CREATE POLICY session_votes_update ON public.session_votes
      FOR UPDATE
      USING (auth.uid() = voter_id)
      WITH CHECK (auth.uid() = voter_id)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'session_votes'
      AND policyname = 'session_votes_delete'
  ) THEN
    EXECUTE 'CREATE POLICY session_votes_delete ON public.session_votes
      FOR DELETE
      USING (auth.uid() = voter_id)';
  END IF;
END
$outer$;

-- Helper to accept an invite and join the session
CREATE OR REPLACE FUNCTION public.accept_session_invite(invite_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_record public.session_invites;
BEGIN
  SELECT * INTO invite_record
  FROM public.session_invites
  WHERE id = invite_id
  FOR UPDATE;

  IF invite_record IS NULL THEN
    RAISE EXCEPTION 'Invite not found';
  END IF;

  IF invite_record.invitee_user_id IS NULL THEN
    RAISE EXCEPTION 'Invite has no registered invitee';
  END IF;

  IF invite_record.invitee_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to accept this invite';
  END IF;

  IF invite_record.status <> 'pending' THEN
    RETURN;
  END IF;

  UPDATE public.session_invites
  SET status = 'accepted',
      responded_at = now()
  WHERE id = invite_id;

  INSERT INTO public.session_participants (session_id, user_id, role)
  VALUES (invite_record.session_id, invite_record.invitee_user_id, 'viewer')
  ON CONFLICT (session_id, user_id) DO NOTHING;
END;
$$;

-- Helper to decline an invite
CREATE OR REPLACE FUNCTION public.decline_session_invite(invite_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_record public.session_invites;
BEGIN
  SELECT * INTO invite_record
  FROM public.session_invites
  WHERE id = invite_id
  FOR UPDATE;

  IF invite_record IS NULL THEN
    RAISE EXCEPTION 'Invite not found';
  END IF;

  IF invite_record.invitee_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to decline this invite';
  END IF;

  IF invite_record.status <> 'pending' THEN
    RETURN;
  END IF;

  UPDATE public.session_invites
  SET status = 'declined',
      responded_at = now()
  WHERE id = invite_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_session_invite(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decline_session_invite(uuid) TO authenticated;
