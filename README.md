# IPLME Match Centre

React + TypeScript match dashboard backed by Supabase. Match rows load from `public.matches` and refresh in real time when that table changes. `public.bookings` is included with row-level security for authenticated users.

## Connect Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the project's SQL Editor, run [`supabase/migrations/20261005000000_create_matches_and_bookings.sql`](supabase/migrations/20261005000000_create_matches_and_bookings.sql).
3. Copy `.env.example` to `.env`. In Project Settings > API, use the Project URL for `VITE_SUPABASE_URL` and the publishable/anon key for `VITE_SUPABASE_ANON_KEY`. Never put a service-role key in a browser app.
4. Start the app with `npm run dev`.

Add a first fixture in the SQL Editor to populate the dashboard:

```sql
insert into public.matches (home_team, away_team, starts_at, venue, city)
values (
  'Chennai Super Kings',
  'Mumbai Indians',
  now() + interval '1 day',
  'M. A. Chidambaram Stadium',
  'Chennai'
);
```

To create bookings, users must first be authenticated; booking rows are only readable and writable by their owning user. Match data is publicly readable, but there are no public insert or update policies.