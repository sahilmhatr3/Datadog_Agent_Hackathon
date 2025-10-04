-- Add onboarding_completed field to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Add onboarding preferences columns
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS preferred_vibes vibe[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS preferred_event_types event_type[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS price_min price_tier DEFAULT '$',
ADD COLUMN IF NOT EXISTS price_max price_tier DEFAULT '$$$',
ADD COLUMN IF NOT EXISTS accessibility_needs jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS party_size_min integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS party_size_max integer DEFAULT 4;

-- Create index for onboarding status
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed ON public.profiles(onboarding_completed);
