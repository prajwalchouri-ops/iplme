insert into public.matches (id, home_team, away_team, starts_at, venue, city, status)
values
  (
    'a50708f3-71b4-4cd1-9f64-cf2f50051001',
    'Royal Challengers Bengaluru',
    'Mumbai Indians',
    '2026-10-10T19:30:00+05:30',
    'M. Chinnaswamy Stadium',
    'Bengaluru',
    'scheduled'
  ),
  (
    'a50708f3-71b4-4cd1-9f64-cf2f50051002',
    'Royal Challengers Bengaluru',
    'Chennai Super Kings',
    '2026-10-12T19:30:00+05:30',
    'M. Chinnaswamy Stadium',
    'Bengaluru',
    'scheduled'
  )
on conflict (id) do update set
  home_team = excluded.home_team,
  away_team = excluded.away_team,
  starts_at = excluded.starts_at,
  venue = excluded.venue,
  city = excluded.city,
  status = excluded.status;