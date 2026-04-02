# Supabase Setup Instructions

This application is now connected to Supabase. Follow these steps to complete the setup:

## 1. Create Tables in Supabase

Go to your Supabase dashboard and run the SQL from `scripts/setup.sql`:

1. Navigate to your Supabase project
2. Go to the SQL Editor
3. Copy the contents of `scripts/setup.sql`
4. Paste and execute the SQL

This will create the `projects` and `transcripts` tables with proper indexes.

## 2. Seed Sample Data

Once tables are created, seed sample data by running:

```bash
npm run seed
```

Or add this script to your `package.json`:

```json
"seed": "node -r ts-node/register scripts/seed-database.ts"
```

This will insert the mock projects and transcripts data into your Supabase database.

## 3. Verify Setup

After seeding:
1. Go back to your Supabase SQL Editor
2. Run: `SELECT COUNT(*) FROM projects;` (should show 5)
3. Run: `SELECT COUNT(*) FROM transcripts;` (should show 8)
4. Run the Next.js dev server: `npm run dev`
5. Navigate to the Projects page - you should see real data from Supabase

## Environment Variables

The following environment variables are already set up through Vercel's Supabase integration:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anonymous key for client-side operations
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for server-side operations
- `POSTGRES_URL` - Database connection string

## Project Table Schema

```
id (UUID, Primary Key)
name (Text)
study_name (Text)
description (Text)
study_type (Text)
status (Text)
participant_count (Integer)
tags (Text Array)
team (Text Array)
created_at (Timestamp)
updated_at (Timestamp)
```

## Transcripts Table Schema

```
id (UUID, Primary Key)
project_id (UUID, Foreign Key to projects)
session_id (Text)
transcript (Text)
created_at (Timestamp)
```

## What's Connected

The Projects page now fetches real data from Supabase:
- ✓ Project list with search
- ✓ Status filtering
- ✓ Study type filtering
- ✓ Transcript count calculation
- ✓ Updated date sorting
- ✓ Row click navigation

## Troubleshooting

**"Error fetching projects" message:**
1. Check that tables exist in Supabase SQL Editor
2. Verify environment variables are set in Vercel project settings
3. Check browser console for detailed error messages

**"No projects found" message:**
1. Run the seed script: `npm run seed`
2. Or manually insert projects via Supabase SQL Editor

**API route not working:**
- Check `/app/api/projects/route.ts` exists
- Verify Supabase client is properly configured in `/lib/supabase/server.ts`
