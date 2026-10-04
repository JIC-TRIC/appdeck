import { useMemo, useState } from "react";
import "./PracticeHistory.css";
import { formatTime } from "../../utils/youtube";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrashCan,
  faChevronDown,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

function PracticeHistory({ pieces, practiceSessions, onDeleteSession }) {
  const [isOpen, setIsOpen] = useState(false);
  const [openDays, setOpenDays] = useState({});
  const [visibleCount, setVisibleCount] = useState(30);

  const groupedByDay = useMemo(() => {
    if (!isOpen) return [];
    const allSessions = [];
    Object.entries(practiceSessions || {}).forEach(([pieceId, sessions]) => {
      const piece = (pieces || []).find((p) => p.id === pieceId);
      if (!piece || !Array.isArray(sessions)) return;
      sessions.forEach((session) => {
        allSessions.push({
          ...session,
          pieceId,
          pieceTitle: piece.title,
          pieceArtist: piece.artist,
          thumbnail: piece.thumbnail,
        });
      });
    });

    allSessions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const groups = [];
    const dayMap = {};
    allSessions.forEach((session) => {
      const d = new Date(session.timestamp);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!dayMap[key]) {
        dayMap[key] = { key, sessions: [], totalTime: 0 };
        groups.push(dayMap[key]);
      }
      dayMap[key].sessions.push(session);
      dayMap[key].totalTime += session.duration || 0;
    });

    return groups;
  }, [isOpen, pieces, practiceSessions]);

  const totalDays = groupedByDay.length;
  const visibleDays = groupedByDay.slice(0, visibleCount);

  const formatDayLabel = (dateKey) => {
    const [y, m, d] = dateKey.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diff = Math.floor((today - date) / (1000 * 60 * 60 * 24));

    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7) return `${diff} days ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const formatDateTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const toggleDay = (key) => {
    setOpenDays((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="history-section">
      <button className="history-toggle" onClick={() => setIsOpen(!isOpen)}>
        <FontAwesomeIcon
          icon={isOpen ? faChevronDown : faChevronRight}
          className="toggle-icon"
        />
        <span className="section-title">Session History</span>
        <span className="history-count">{totalDays} days</span>
      </button>

      {isOpen && (
        <div className="history-days">
          {totalDays === 0 ? (
            <div className="empty-history">No practice sessions yet.</div>
          ) : (
            <>
              {visibleDays.map((day) => (
                <div key={day.key} className="history-day">
                  <button
                    className="day-toggle"
                    onClick={() => toggleDay(day.key)}
                  >
                    <FontAwesomeIcon
                      icon={openDays[day.key] ? faChevronDown : faChevronRight}
                      className="toggle-icon"
                    />
                    <span className="day-label">{formatDayLabel(day.key)}</span>
                    <span className="day-meta">
                      {day.sessions.length} session
                      {day.sessions.length !== 1 ? "s" : ""}
                      {" · "}
                      {formatTime(day.totalTime)}
                    </span>
                  </button>

                  {openDays[day.key] && (
                    <div className="day-sessions">
                      {day.sessions.map((session, i) => (
                        <div
                          key={`${session.timestamp}-${i}`}
                          className="session-item"
                        >
                          {session.thumbnail && (
                            <img
                              className="session-thumbnail"
                              src={session.thumbnail}
                              alt=""
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          )}
                          <div className="session-info">
                            <div className="session-piece">
                              <span className="piece-title">
                                {session.pieceTitle}
                              </span>
                              <span className="piece-artist">
                                {session.pieceArtist}
                              </span>
                            </div>
                            <div className="session-meta">
                              <span className="session-time">
                                {formatDateTime(session.timestamp)}
                              </span>
                              <span className="session-duration">
                                {formatTime(session.duration)}
                              </span>
                            </div>
                          </div>
                          <button
                            className="delete-session-btn"
                            onClick={() =>
                              onDeleteSession(
                                session.pieceId,
                                session.timestamp,
                              )
                            }
                            title="Delete session"
                          >
                            <FontAwesomeIcon icon={faTrashCan} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {visibleCount < totalDays && (
                <button
                  className="load-more-btn"
                  onClick={() => setVisibleCount((c) => c + 30)}
                >
                  Show more ({totalDays - visibleCount} days remaining)
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default PracticeHistory;
