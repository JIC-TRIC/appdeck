import { useMemo } from "react";
import "./HomeView.css";

function HomeView({ pieces, practiceSessions, onNavigate }) {
  const stats = useMemo(() => {
    const totalPieces = pieces.length;
    const totalSessions = Object.values(practiceSessions).reduce(
      (sum, logs) => sum + logs.length,
      0,
    );
    const totalMinutes = Math.round(
      Object.values(practiceSessions).reduce(
        (sum, logs) => sum + logs.reduce((s, l) => s + l.duration, 0),
        0,
      ) / 60,
    );
    const mastered = pieces.filter((p) => {
      const prog = p.progress || {};
      return prog.memorized === 2;
    }).length;
    return { totalPieces, totalSessions, totalMinutes, mastered };
  }, [pieces, practiceSessions]);

  const hasData = stats.totalPieces > 0;

  return (
    <div className="home-view">
      {/* Hero Section */}
      <section className="home-hero">
        <div className="home-hero-icon">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect
              x="4"
              y="12"
              width="40"
              height="28"
              rx="2"
              stroke="currentColor"
              strokeWidth="2.5"
            />
            <rect
              x="10"
              y="12"
              width="4"
              height="18"
              rx="1"
              fill="currentColor"
              opacity="0.15"
            />
            <rect
              x="18"
              y="12"
              width="4"
              height="18"
              rx="1"
              fill="currentColor"
              opacity="0.15"
            />
            <rect
              x="26"
              y="12"
              width="4"
              height="18"
              rx="1"
              fill="currentColor"
              opacity="0.15"
            />
            <rect
              x="34"
              y="12"
              width="4"
              height="18"
              rx="1"
              fill="currentColor"
              opacity="0.15"
            />
            <line
              x1="10"
              y1="40"
              x2="10"
              y2="30"
              stroke="currentColor"
              strokeWidth="1.5"
              opacity="0.4"
            />
            <line
              x1="14"
              y1="40"
              x2="14"
              y2="30"
              stroke="currentColor"
              strokeWidth="1.5"
              opacity="0.4"
            />
            <line
              x1="18"
              y1="40"
              x2="18"
              y2="30"
              stroke="currentColor"
              strokeWidth="1.5"
              opacity="0.4"
            />
            <line
              x1="22"
              y1="40"
              x2="22"
              y2="30"
              stroke="currentColor"
              strokeWidth="1.5"
              opacity="0.4"
            />
            <line
              x1="26"
              y1="40"
              x2="26"
              y2="30"
              stroke="currentColor"
              strokeWidth="1.5"
              opacity="0.4"
            />
            <line
              x1="30"
              y1="40"
              x2="30"
              y2="30"
              stroke="currentColor"
              strokeWidth="1.5"
              opacity="0.4"
            />
            <line
              x1="34"
              y1="40"
              x2="34"
              y2="30"
              stroke="currentColor"
              strokeWidth="1.5"
              opacity="0.4"
            />
            <line
              x1="38"
              y1="40"
              x2="38"
              y2="30"
              stroke="currentColor"
              strokeWidth="1.5"
              opacity="0.4"
            />
          </svg>
        </div>
        <h1 className="home-title">Piano Tracker</h1>
        <p className="home-subtitle">
          Your personal practice companion. Track pieces, log sessions, and
          watch your progress grow.
        </p>
      </section>

      {/* Quick Stats (only if user has data) */}
      {hasData && (
        <section className="home-stats">
          <div className="home-stat-card" onClick={() => onNavigate("library")}>
            <span className="home-stat-value">{stats.totalPieces}</span>
            <span className="home-stat-label">Pieces</span>
          </div>
          <div className="home-stat-card" onClick={() => onNavigate("stats")}>
            <span className="home-stat-value">
              {stats.totalMinutes >= 60
                ? `${Math.floor(stats.totalMinutes / 60)}h`
                : `${stats.totalMinutes}m`}
            </span>
            <span className="home-stat-label">Practiced</span>
          </div>
          <div className="home-stat-card" onClick={() => onNavigate("stats")}>
            <span className="home-stat-value">{stats.totalSessions}</span>
            <span className="home-stat-label">Sessions</span>
          </div>
          <div className="home-stat-card" onClick={() => onNavigate("library")}>
            <span className="home-stat-value">{stats.mastered}</span>
            <span className="home-stat-label">Mastered</span>
          </div>
        </section>
      )}

      {/* Feature Cards */}
      <section className="home-features">
        <button
          className="home-feature-card"
          onClick={() => onNavigate("library")}
        >
          <div className="home-feature-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="home-feature-text">
            <h3>Library</h3>
            <p>
              Manage your repertoire. Add pieces with YouTube links, difficulty,
              and notes.
            </p>
          </div>
          <span className="home-feature-arrow">→</span>
        </button>

        <button
          className="home-feature-card"
          onClick={() => onNavigate("practice")}
        >
          <div className="home-feature-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M12 6v6l4 2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="home-feature-text">
            <h3>Practice</h3>
            <p>
              Daily playlists, goal tracking, and smart session suggestions.
            </p>
          </div>
          <span className="home-feature-arrow">→</span>
        </button>

        <button
          className="home-feature-card"
          onClick={() => onNavigate("stats")}
        >
          <div className="home-feature-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 3v18h18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M18 17V9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M13 17v-4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8 17v-8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="home-feature-text">
            <h3>Statistics</h3>
            <p>
              Visualize your progress with charts, streaks, and practice
              history.
            </p>
          </div>
          <span className="home-feature-arrow">→</span>
        </button>
      </section>

      {/* Highlights */}
      <section className="home-highlights">
        <div className="home-highlight">
          <span className="home-highlight-icon">♩</span>
          <span>Phase-based progress tracking</span>
        </div>
        <div className="home-highlight">
          <span className="home-highlight-icon">▶</span>
          <span>Built-in YouTube player</span>
        </div>
        <div className="home-highlight">
          <span className="home-highlight-icon">◆</span>
          <span>Smart daily practice playlists</span>
        </div>
        <div className="home-highlight">
          <span className="home-highlight-icon">■</span>
          <span>Multiple color themes</span>
        </div>
        <div className="home-highlight">
          <span className="home-highlight-icon">○</span>
          <span>Works offline — all data local</span>
        </div>
      </section>

      {/* CTA */}
      {!hasData && (
        <section className="home-cta">
          <button
            className="home-cta-btn"
            onClick={() => onNavigate("library")}
          >
            Get Started
          </button>
        </section>
      )}

      <footer className="home-footer">
        <span>Piano Tracker — built for pianists</span>
      </footer>
    </div>
  );
}

export default HomeView;
