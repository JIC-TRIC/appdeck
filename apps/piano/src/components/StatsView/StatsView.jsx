import { useMemo } from "react";
import "./StatsView.css";
import { formatTime } from "../../utils/youtube";
import { getStatusFromProgress } from "../../App";
import PracticeCalendar from "../PracticeCalendar/PracticeCalendar";
import PracticeHistory from "../PracticeHistory/PracticeHistory";
import Header from "../Header/Header";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faBullseye,
  faCheck,
  faChartLine,
} from "@fortawesome/free-solid-svg-icons";

function StatsView({ pieces, practiceSessions, onDeleteSession }) {
  // Statistiken berechnen
  const stats = useMemo(() => {
    const safePieces = pieces || [];
    const safeSessions = practiceSessions || {};

    const mastered = safePieces.filter((p) => {
      const status = getStatusFromProgress(p.progress);
      return (
        status === "learned" || status === "memorizing" || status === "mastered"
      );
    }).length;

    let totalTime = 0;
    let totalSessions = 0;

    Object.values(safeSessions).forEach((sessions) => {
      if (!Array.isArray(sessions)) return;
      totalSessions += sessions.length;
      sessions.forEach((session) => {
        totalTime += session?.duration || 0;
      });
    });

    const avgSessionLength =
      totalSessions > 0 ? Math.round(totalTime / totalSessions) : 0;

    // Heute
    const today = new Date().toDateString();
    let todayTime = 0;
    Object.values(safeSessions).forEach((sessions) => {
      if (!Array.isArray(sessions)) return;
      sessions.forEach((session) => {
        if (
          session?.timestamp &&
          new Date(session.timestamp).toDateString() === today
        ) {
          todayTime += session?.duration || 0;
        }
      });
    });

    // Diese Woche
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    let weekTime = 0;
    Object.values(safeSessions).forEach((sessions) => {
      if (!Array.isArray(sessions)) return;
      sessions.forEach((session) => {
        if (session?.timestamp && new Date(session.timestamp) >= weekAgo) {
          weekTime += session?.duration || 0;
        }
      });
    });

    return {
      mastered,
      totalTime,
      totalSessions,
      avgSessionLength,
      todayTime,
      weekTime,
    };
  }, [pieces, practiceSessions]);

  return (
    <>
      <Header />
      <div className="stats-view">
        <h1 className="stats-header">Statistics</h1>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card-large">
            <div className="stat-icon">
              <FontAwesomeIcon icon={faClock} />
            </div>
            <div className="stat-content">
              <div className="stat-value-large">
                {formatTime(stats.totalTime)}
              </div>
              <div className="stat-label-large">Total Practice Time</div>
            </div>
          </div>

          <div className="stat-card-large">
            <div className="stat-icon">
              <FontAwesomeIcon icon={faBullseye} />
            </div>
            <div className="stat-content">
              <div className="stat-value-large">{stats.totalSessions}</div>
              <div className="stat-label-large">Total Sessions</div>
            </div>
          </div>

          <div className="stat-card-large">
            <div className="stat-icon">
              <FontAwesomeIcon icon={faCheck} />
            </div>
            <div className="stat-content">
              <div className="stat-value-large">{stats.mastered}</div>
              <div className="stat-label-large">Learned Pieces</div>
            </div>
          </div>

          <div className="stat-card-large">
            <div className="stat-icon">
              <FontAwesomeIcon icon={faChartLine} />
            </div>
            <div className="stat-content">
              <div className="stat-value-large">
                {formatTime(stats.avgSessionLength)}
              </div>
              <div className="stat-label-large">Avg Session</div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="recent-section">
          <h2 className="section-title">Recent Activity</h2>
          <div className="recent-stats">
            <div className="recent-item">
              <span className="recent-label">Today:</span>
              <span className="recent-value">
                {formatTime(stats.todayTime)}
              </span>
            </div>
            <div className="recent-item">
              <span className="recent-label">This Week:</span>
              <span className="recent-value">{formatTime(stats.weekTime)}</span>
            </div>
          </div>
        </div>

        {/* Heatmap */}
        <PracticeCalendar practiceSessions={practiceSessions} />

        {/* Session History */}
        <PracticeHistory
          pieces={pieces}
          practiceSessions={practiceSessions}
          onDeleteSession={onDeleteSession}
        />

        {/* Bottom spacer for navigation bar */}
        <div className="bottom-spacer"></div>
      </div>
    </>
  );
}

export default StatsView;
