import { useEffect, useMemo, useState } from "react";
import { Activity, CalendarDays, CircleAlert, Radio, RefreshCw, Search } from "lucide-react";
import type { Match } from "./lib/database.types";
import { isSupabaseConfigured, supabase } from "./lib/supabase";

type MatchFilter = "all" | "live" | "upcoming";

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

const filterOptions: { value: MatchFilter; label: string }[] = [
  { value: "all", label: "All matches" },
  { value: "live", label: "Live" },
  { value: "upcoming", label: "Upcoming" },
];

function MatchList({ matches }: Readonly<{ matches: readonly Match[] }>) {
  return (
    <div className="match-list">
      {matches.map((match, index) => (
        <article className="match-row" key={match.id}>
          <div className="match-index">{String(index + 1).padStart(2, "0")}</div>
          <div className="match-date">
            <span className="match-day">{dateFormatter.format(new Date(match.starts_at))}</span>
            <span>{match.city} · {match.venue}</span>
          </div>
          <div className="matchup">
            <div className="team"><span className="team-badge">{match.home_team.slice(0, 3).toUpperCase()}</span><strong>{match.home_team}</strong></div>
            <span className="versus">V</span>
            <div className="team away-team"><span className="team-badge">{match.away_team.slice(0, 3).toUpperCase()}</span><strong>{match.away_team}</strong></div>
          </div>
          <div className={`match-status ${match.status}`}>
            {match.status === "live" && <span className="status-dot" />}
            {match.status === "scheduled" ? "UPCOMING" : match.status.toUpperCase()}
          </div>
        </article>
      ))}
    </div>
  );
}

function FixtureResults({
  configured,
  error,
  loading,
  matches,
  visibleMatches,
}: Readonly<{
  configured: boolean;
  error: string | null;
  loading: boolean;
  matches: readonly Match[];
  visibleMatches: readonly Match[];
}>) {
  if (!configured) {
    return (
      <div className="notice setup-notice">
        <CircleAlert size={20} />
        <div><strong>Connect your Supabase project</strong><p>Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to your local <code>.env</code>, then run the SQL migration in your Supabase project.</p></div>
      </div>
    );
  }

  if (error) {
    return <div className="notice error-notice"><CircleAlert size={20} /><div><strong>Could not load fixtures</strong><p>{error}</p></div></div>;
  }

  if (loading) {
    return <div className="loading-state"><span className="loader" /> Loading fixtures</div>;
  }

  if (visibleMatches.length === 0) {
    const title = matches.length ? "No fixtures match this view" : "No fixtures yet";
    const description = matches.length
      ? "Try another filter or search term."
      : "Add matches to the public.matches table to see them here.";
    return <div className="empty-state"><CalendarDays size={24} /><strong>{title}</strong><span>{description}</span></div>;
  }

  return <MatchList matches={visibleMatches} />;
}

function App() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [filter, setFilter] = useState<MatchFilter>("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    let active = true;
    const fetchMatches = async () => {
      const { data, error: fetchError } = await client
        .from("matches")
        .select("*")
        .order("starts_at", { ascending: true });

      if (!active) return;
      setLoading(false);
      if (fetchError) {
        setError(fetchError.message);
        return;
      }
      setError(null);
      setMatches(data ?? []);
      setLastUpdated(new Date());
    };

    void fetchMatches();
    const channel = client
      .channel("matches-live-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, () => {
        void fetchMatches();
      })
      .subscribe();

    return () => {
      active = false;
      void client.removeChannel(channel);
    };
  }, []);

  const visibleMatches = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return matches.filter((match) => {
      const matchesFilter = filter === "all" || match.status === filter;
      const matchesSearch = !normalizedSearch ||
        `${match.home_team} ${match.away_team} ${match.venue} ${match.city}`
          .toLowerCase()
          .includes(normalizedSearch);
      return matchesFilter && matchesSearch;
    });
  }, [filter, matches, search]);

  const liveCount = matches.filter((match) => match.status === "live").length;
  const upcomingCount = matches.filter((match) => match.status === "scheduled").length;

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="IPLME home">
          <span className="brand-mark">I</span>
          <span>IPL<span className="brand-light">ME</span></span>
        </a>
        <div className="topbar-right">
          <span className="season-label">SEASON <strong>2026</strong></span>
          <span className="connection"><span className={isSupabaseConfigured ? "connection-dot online" : "connection-dot"} />
            {isSupabaseConfigured ? "SUPABASE CONNECTED" : "SETUP REQUIRED"}
          </span>
        </div>
      </header>

      <section className="intro" id="top">
        <div>
          <p className="eyebrow"><span className="eyebrow-line" /> THE INDIAN PREMIER LEAGUE</p>
          <h1>MATCH<br /><span>CENTRE</span></h1>
          <p className="intro-copy">Every fixture. Every face-off. Follow the season as it happens.</p>
        </div>
        <div className="intro-stamp" aria-hidden="true">
          <span>20</span><span>26</span><small>THE SEASON</small>
        </div>
      </section>

      <section className="stats-row" aria-label="Match summary">
        <div className="stat-block"><span className="stat-label"><Radio size={14} /> LIVE NOW</span><strong>{liveCount.toString().padStart(2, "0")}</strong><span className="stat-note">matches in play</span></div>
        <div className="stat-block"><span className="stat-label"><CalendarDays size={14} /> UPCOMING</span><strong>{upcomingCount.toString().padStart(2, "0")}</strong><span className="stat-note">scheduled fixtures</span></div>
        <div className="stat-block"><span className="stat-label"><Activity size={14} /> FIXTURES</span><strong>{matches.length.toString().padStart(2, "0")}</strong><span className="stat-note">in the schedule</span></div>
        <div className="stats-aside">
          <span className="live-indicator"><span /> DATA UPDATES LIVE</span>
          <span className="updated-time">{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}` : "Awaiting connection"}</span>
        </div>
      </section>

      <section className="fixtures-section" aria-labelledby="fixtures-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">ON THE PITCH</p>
            <h2 id="fixtures-title">Fixtures <span>({visibleMatches.length})</span></h2>
          </div>
          <button className="refresh-button" type="button" onClick={() => window.location.reload()} title="Refresh fixtures">
            <RefreshCw size={16} /><span>REFRESH</span>
          </button>
        </div>

        <div className="toolbar">
          <fieldset className="filter-tabs">
            <legend className="visually-hidden">Filter matches</legend>
            {filterOptions.map((option) => (
              <button key={option.value} className={filter === option.value ? "filter-tab selected" : "filter-tab"} onClick={() => setFilter(option.value)} type="button">
                {option.label}
              </button>
            ))}
          </fieldset>
          <label className="search-box">
            <Search size={16} aria-hidden="true" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search teams or venue" aria-label="Search teams or venue" />
            <kbd>/</kbd>
          </label>
        </div>

        <FixtureResults
          configured={isSupabaseConfigured}
          error={error}
          loading={loading}
          matches={matches}
          visibleMatches={visibleMatches}
        />
      </section>

      <footer className="footer"><span>IPLME <span className="footer-divider">/</span> MATCH CENTRE</span><span>FIXTURES POWERED BY SUPABASE</span></footer>
    </main>
  );
}

export default App;