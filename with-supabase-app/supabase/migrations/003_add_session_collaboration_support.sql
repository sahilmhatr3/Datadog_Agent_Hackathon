-- Create invite status enum if it does not exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invite_status') THEN
    CREATE TYPE public.invite_status AS ENUM ('pending', 'accepted', 'declined', 'expired');
  END IF;
END
$$;

-- Table to track pending invitations for sessions
CREATE TABLE IF NOT EXISTS public.session_invites (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  inviter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_email text,
  status public.invite_status NOT NULL DEFAULT 'pending',
  message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  CONSTRAINT session_invites_recipient_check CHECK (
    invitee_user_id IS NOT NULL OR invitee_email IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_session_invites_session_id ON public.session_invites(session_id);
CREATE INDEX IF NOT EXISTS idx_session_invites_invitee_user ON public.session_invites(invitee_user_id);

ALTER TABLE public.session_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY session_invites_select ON public.session_invites
FOR SELECT
USING (
  auth.uid() = inviter_id
  OR auth.uid() = invitee_user_id
  OR EXISTS (
    SELECT 1
    FROM public.sessions s
    WHERE s.id = session_id AND s.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.session_participants sp
    WHERE sp.session_id = session_id AND sp.user_id = auth.uid()
  )
);

CREATE POLICY session_invites_insert ON public.session_invites
FOR INSERT
WITH CHECK (
  auth.uid() = inviter_id
  AND (
    EXISTS (
      SELECT 1
      FROM public.sessions s
      WHERE s.id = session_id AND s.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.session_participants sp
      WHERE sp.session_id = session_id
        AND sp.user_id = auth.uid()
        AND sp.role IN ('owner', 'editor')
    )
  )
);

CREATE POLICY session_invites_update ON public.session_invites
FOR UPDATE
USING (
  auth.uid() = inviter_id OR auth.uid() = invitee_user_id
)
WITH CHECK (
  auth.uid() = inviter_id OR auth.uid() = invitee_user_id
);

-- Table to capture each participant's current thinking for a session
CREATE TABLE IF NOT EXISTS public.session_participant_snapshots (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  top_recommendation_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  idea_summary text,
  last_contribution_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_session_participant_snapshots_session ON public.session_participant_snapshots(session_id);
CREATE INDEX IF NOT EXISTS idx_session_participant_snapshots_user ON public.session_participant_snapshots(user_id);

ALTER TABLE public.session_participant_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY session_participant_snapshots_select ON public.session_participant_snapshots
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.sessions s
    WHERE s.id = session_id AND s.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.session_participants sp
    WHERE sp.session_id = session_id AND sp.user_id = auth.uid()
  )
);

CREATE POLICY session_participant_snapshots_insert ON public.session_participant_snapshots
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (
    EXISTS (
      SELECT 1
      FROM public.sessions s
      WHERE s.id = session_id AND s.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.session_participants sp
      WHERE sp.session_id = session_id AND sp.user_id = auth.uid()
    )
  )
);

CREATE POLICY session_participant_snapshots_update ON public.session_participant_snapshots
FOR UPDATE
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1
    FROM public.sessions s
    WHERE s.id = session_id AND s.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.session_participants sp
    WHERE sp.session_id = session_id
      AND sp.user_id = auth.uid()
      AND sp.role IN ('owner', 'editor')
  )
)
WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1
    FROM public.sessions s
    WHERE s.id = session_id AND s.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.session_participants sp
    WHERE sp.session_id = session_id
      AND sp.user_id = auth.uid()
      AND sp.role IN ('owner', 'editor')
  )
);

-- Table to store aggregated collaboration summary for a session
CREATE TABLE IF NOT EXISTS public.session_collaboration_summaries (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  summary text NOT NULL DEFAULT '',
  highlights jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id)
);

ALTER TABLE public.session_collaboration_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY session_collaboration_summaries_select ON public.session_collaboration_summaries
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.sessions s
    WHERE s.id = session_id AND s.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.session_participants sp
    WHERE sp.session_id = session_id AND sp.user_id = auth.uid()
  )
);

CREATE POLICY session_collaboration_summaries_insert ON public.session_collaboration_summaries
FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  AND (
    EXISTS (
      SELECT 1
      FROM public.sessions s
      WHERE s.id = session_id AND s.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.session_participants sp
      WHERE sp.session_id = session_id
        AND sp.user_id = auth.uid()
        AND sp.role IN ('owner', 'editor')
    )
  )
);

CREATE POLICY session_collaboration_summaries_update ON public.session_collaboration_summaries
FOR UPDATE
USING (
  auth.uid() = created_by
  OR EXISTS (
    SELECT 1
    FROM public.sessions s
    WHERE s.id = session_id AND s.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.session_participants sp
    WHERE sp.session_id = session_id
      AND sp.user_id = auth.uid()
      AND sp.role IN ('owner', 'editor')
  )
)
WITH CHECK (
  auth.uid() = created_by
  OR EXISTS (
    SELECT 1
    FROM public.sessions s
    WHERE s.id = session_id AND s.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.session_participants sp
    WHERE sp.session_id = session_id
      AND sp.user_id = auth.uid()
      AND sp.role IN ('owner', 'editor')
  )
);

CREATE POLICY session_collaboration_summaries_delete ON public.session_collaboration_summaries
FOR DELETE
USING (
  auth.uid() = created_by
  OR EXISTS (
    SELECT 1
    FROM public.sessions s
    WHERE s.id = session_id AND s.owner_id = auth.uid()
  )
);
