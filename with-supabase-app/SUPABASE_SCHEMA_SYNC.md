# Supabase Schema Sync Guide

## Overview
This guide helps you pull the remote Supabase schema to ensure your local development environment is in sync with the production database.

## Prerequisites

1. **Supabase CLI is installed** ✅ (Already done)
2. **Supabase project initialized** ✅ (Already done)
3. **You need your Supabase project details**

## Steps to Pull Remote Schema

### 1. Get Your Supabase Project Details

You'll need:
- **Project ID**: Found in your Supabase dashboard URL: `supabase.com/dashboard/project/[PROJECT_ID]`
- **Database Password**: Set when you created your project

### 2. Link to Your Remote Project

```bash
supabase link --project-ref [YOUR_PROJECT_ID]
```

You'll be prompted for your database password.

### 3. Pull the Remote Schema

Once linked, pull the entire schema:

```bash
# Pull all schemas including auth, storage, etc.
supabase db pull

# Or pull only the public schema
supabase db pull --schema public
```

This will create migration files in `supabase/migrations/` containing your remote schema.

### 4. Generate TypeScript Types

After pulling the schema, generate TypeScript types:

```bash
supabase gen types typescript --linked > lib/database.types.ts
```

### 5. Apply Our Onboarding Migration

Since we created a new migration for onboarding fields, we should push it to the remote:

```bash
# First, check what migrations will be applied
supabase db push --dry-run

# If everything looks good, apply the migrations
supabase db push
```

## Alternative: Direct Schema Dump

If you have direct database access, you can also use:

```bash
# Set your database URL
export DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres"

# Dump the schema
supabase db dump --db-url "$DATABASE_URL" > supabase/schema.sql
```

## Environment Variables

Don't forget to create `.env.local` with:

```
NEXT_PUBLIC_SUPABASE_URL=[YOUR_PROJECT_URL]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
```

Both values can be found in:
- Supabase Dashboard → Settings → API → Project URL
- Supabase Dashboard → Settings → API → Project API keys → anon/public

## Troubleshooting

- **"Project not linked"**: Run `supabase link` first
- **Permission denied**: Check your database password
- **Schema conflicts**: Use `--overwrite` flag carefully: `supabase db pull --overwrite`

## Next Steps

After syncing:
1. Review the generated migrations in `supabase/migrations/`
2. Check the TypeScript types in `lib/database.types.ts`
3. Apply any pending migrations with `supabase db push`
