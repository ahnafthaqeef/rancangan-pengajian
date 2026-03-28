# Project: Rancangan Pengajian Harian

**Status:** MVP Built
**Goal:** Daily learning planner — set objectives + activities per day, track completion, view weekly progress
**Stack:** Next.js 15, TypeScript, Tailwind CSS, Supabase
**Language:** Bahasa Malaysia (UI in BM)
**Port:** 3003

## What's Built (MVP)
- Weekly calendar dashboard: 7-day grid with completion progress per day
- Create plan: date, subject, objective, activity list
- Day view: all plans for a date, check off activities, progress bar
- Per-plan and overall daily progress tracking

## Key Files
- `src/app/page.tsx` — weekly dashboard with calendar
- `src/app/plan/new/page.tsx` — create plan form
- `src/app/plan/[date]/page.tsx` — day view with activity checkboxes
- `src/types/index.ts` — TypeScript types
- `src/lib/supabase/client.ts` — Supabase browser client
- `supabase_schema.sql` — run this in Supabase SQL editor first

## Environment
- `.env.local` — `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Setup
1. Create Supabase project
2. Run `supabase_schema.sql` in SQL editor
3. Copy URL + anon key to `.env.local`
4. `npm run dev` → http://localhost:3003

## What's Next
- Auth (Supabase email login)
- Weekly summary report
- Streak tracking
- Notion sync (push daily plan to Notion)
