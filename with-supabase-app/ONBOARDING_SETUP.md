# Onboarding Setup Guide

## Overview
A multi-stage onboarding system has been implemented that forces users to complete a profile setup on their first login.

## Setup Steps

### 1. Database Migration
Run the migration to add the necessary columns to the profiles table:

```sql
-- Run this in your Supabase SQL editor
-- Location: supabase/migrations/001_add_onboarding_status.sql

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
```

### 2. Test the Flow

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Sign up for a new account or log in with an existing account

3. You'll be automatically redirected to `/onboarding` if you haven't completed onboarding

4. Complete the 3-step form:
   - **Step 1**: Basic Information (name, location, timezone)
   - **Step 2**: Travel Preferences (vibes, event types)
   - **Step 3**: Budget & Accessibility settings

5. After completion, you'll be redirected to `/protected`

## Features Implemented

- ✅ Multi-stage form with progress indicator
- ✅ Form validation (can't proceed without required fields)
- ✅ Middleware checks onboarding status and enforces completion
- ✅ Uses shadcn/ui components (Progress, Select, Slider, Textarea, etc.)
- ✅ Saves all preferences to the profiles table
- ✅ Responsive design

## Testing with Existing Users

For existing users, you can manually set their `onboarding_completed` to `false` in the database:

```sql
UPDATE public.profiles 
SET onboarding_completed = false 
WHERE id = 'USER_ID_HERE';
```

## Components Created

- `/app/onboarding/page.tsx` - Onboarding page
- `/components/onboarding/onboarding-form.tsx` - Main form component
- `/components/onboarding/steps/basic-info-step.tsx` - Step 1
- `/components/onboarding/steps/preferences-step.tsx` - Step 2
- `/components/onboarding/steps/budget-accessibility-step.tsx` - Step 3
- Updated `/lib/supabase/middleware.ts` - Enforces onboarding completion
