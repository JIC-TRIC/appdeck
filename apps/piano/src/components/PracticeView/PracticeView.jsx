import { useMemo } from "react";
import "./PracticeView.css";
import { formatTime } from "../../utils/youtube";
import Header from "../Header/Header";
import SessionPlaylist from "../SessionPlaylist/SessionPlaylist";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBullseye,
  faStar,
  faListOl,
} from "@fortawesome/free-solid-svg-icons";

function PracticeView({
  pieces,
  practiceSessions,
  onPieceClick,
  practiceStreak,
  onAddPiece,
  favoritePiecesCount = 3,
  playlistData,
  onPlaylistUpdate,
  onOpenSetlists,
}) {
  // Sichere Defaults
  const safePieces = pieces || [];
  const safeSessions = practiceSessions || {};

  // Heute geübte Zeit berechnen
  const todayTime = useMemo(() => {
    const today = new Date().toDateString();
    let total = 0;
    Object.values(safeSessions).forEach((sessions) => {
      if (!Array.isArray(sessions)) return;
      sessions.forEach((session) => {
        if (
          session?.timestamp &&
          new Date(session.timestamp).toDateString() === today
        ) {
          total += session?.duration || 0;
        }
      });
    });
    return total;
  }, [safeSessions]);

  // Daily Goal (hardcoded für jetzt, später aus Settings)
  const dailyGoal = 30 * 60; // 30 Minuten in Sekunden
  const goalProgress = Math.min((todayTime / dailyGoal) * 100, 100);

  // Favorite Pieces (Top 3 nach Gesamtzeit)
  const favoritePieces = useMemo(() => {
    return safePieces
      .map((piece) => {
        const sessions = safeSessions[piece.id] || [];
        const totalTime = Array.isArray(sessions)
          ? sessions.reduce((sum, s) => sum + (s?.duration || 0), 0)
          : 0;
        const sessionCount = Array.isArray(sessions) ? sessions.length : 0;
        return { ...piece, totalTime, sessionCount };
      })
      .filter((p) => p.sessionCount > 0)
      .sort((a, b) => b.totalTime - a.totalTime)
      .slice(0, favoritePiecesCount);
  }, [safePieces, safeSessions, favoritePiecesCount]);

  // Practice Milestones
  const milestoneData = useMemo(() => {
    // Gesamtzeit über alle Sessions berechnen
    let totalTime = 0;
    Object.values(safeSessions).forEach((sessions) => {
      if (!Array.isArray(sessions)) return;
      sessions.forEach((session) => {
        totalTime += session?.duration || 0;
      });
    });

    // Milestones dynamisch generieren
    // 0-100h: 5h, 10h, 25h, 50h, 75h, 100h
    // 100-500h: 50h Schritte (150h, 200h, 250h, 300h, 350h, 400h, 450h, 500h)
    // Ab 500h: 100h Schritte maximal (600h, 700h, 800h, ...)
    const milestones = [];

    // Anfang: Kleine Schritte bis 100h
    [5, 10, 25, 50, 75, 100].forEach((h) => {
      milestones.push({ hours: h, seconds: h * 60 * 60 });
    });

    // Mittlere Phase: 50h Schritte bis 500h
    for (let h = 150; h <= 500; h += 50) {
      milestones.push({ hours: h, seconds: h * 60 * 60 });
    }

    // Späte Phase: 100h Schritte (maximal)
    for (let h = 600; h <= 2000; h += 100) {
      milestones.push({ hours: h, seconds: h * 60 * 60 });
    }

    // Nächsten Milestone finden
    const nextMilestone = milestones.find((m) => totalTime < m.seconds);

    if (!nextMilestone) {
      // Alle Milestones erreicht!
      return {
        totalTime,
        completed: true,
        message: "All milestones completed!",
        progress: 100,
      };
    }

    // Vorherigen Milestone finden für Progress Berechnung
    const milestoneIndex = milestones.indexOf(nextMilestone);
    const previousMilestone =
      milestoneIndex > 0 ? milestones[milestoneIndex - 1].seconds : 0;

    const progress =
      ((totalTime - previousMilestone) /
        (nextMilestone.seconds - previousMilestone)) *
      100;
    const remaining = nextMilestone.seconds - totalTime;

    return {
      totalTime,
      completed: false,
      nextMilestone: nextMilestone.hours,
      remaining,
      progress: Math.max(0, Math.min(100, progress)),
    };
  }, [practiceSessions]);

  return (
    <>
      <Header />
      <div className="practice-view">
        {/* Add Piece Button */}
        <button className="add-piece-btn" onClick={onAddPiece}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Add Piece
        </button>

        {/* Session Playlist */}
        <SessionPlaylist
          pieces={safePieces}
          practiceSessions={safeSessions}
          onPieceClick={onPieceClick}
          playlistData={playlistData}
          onPlaylistUpdate={onPlaylistUpdate}
        />

        {/* Setlists Button */}
        <button className="setlists-open-btn" onClick={onOpenSetlists}>
          <FontAwesomeIcon icon={faListOl} /> My Setlists
        </button>

        {/* Daily Goal Section */}
        <div className="goal-section">
          <h2 className="section-title">
            <FontAwesomeIcon icon={faBullseye} /> Today's Goal
          </h2>
          <div className="goal-card">
            <div className="goal-progress-ring">
              <svg viewBox="0 0 120 120" className="progress-svg">
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  className="progress-bg"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  className="progress-fill"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(goalProgress / 100) * 339.292} 339.292`}
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <div className="progress-text">
                <div className="progress-value">
                  {Math.round(goalProgress)}%
                </div>
                <div className="progress-label">Complete</div>
              </div>
            </div>
            <div className="goal-info">
              <div className="goal-stat">
                <span className="stat-label">Today:</span>
                <span className="stat-value">{formatTime(todayTime)}</span>
              </div>
              <div className="goal-stat">
                <span className="stat-label">Goal:</span>
                <span className="stat-value">{formatTime(dailyGoal)}</span>
              </div>
              <div className="goal-stat">
                <span className="stat-label">Streak:</span>
                <span className="stat-value streak-value">
                  {practiceStreak} days
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Practice Milestones Section */}
        <div className="milestone-section">
          <h2 className="section-title">Practice Milestones</h2>
          <div className="milestone-card">
            {milestoneData.completed ? (
              <div className="milestone-completed">
                <div className="milestone-icon">
                  <FontAwesomeIcon icon={faStar} />
                </div>
                <div className="milestone-text">{milestoneData.message}</div>
                <div className="milestone-total">
                  Total: {formatTime(milestoneData.totalTime)}
                </div>
              </div>
            ) : (
              <>
                <div className="milestone-header">
                  <span className="milestone-label">Next Milestone</span>
                  <span className="milestone-target">
                    {milestoneData.nextMilestone} Hours
                  </span>
                </div>
                <div className="milestone-progress-bar">
                  <div
                    className="milestone-progress-fill"
                    style={{ width: `${milestoneData.progress}%` }}
                  />
                </div>
                <div className="milestone-stats">
                  <span className="milestone-stat">
                    Current: {formatTime(milestoneData.totalTime)}
                  </span>
                  <span className="milestone-stat">
                    Remaining: {formatTime(milestoneData.remaining)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Favorite Pieces Section */}
        {favoritePieces.length > 0 && (
          <div className="favorites-section">
            <h2 className="section-title">
              <FontAwesomeIcon icon={faStar} /> Favorite Pieces
            </h2>
            <div className="favorites-list">
              {favoritePieces.map((piece, index) => (
                <button
                  key={piece.id}
                  className="favorite-item"
                  onClick={() => onPieceClick(piece)}
                >
                  <div className="favorite-rank">#{index + 1}</div>
                  <div className="favorite-info">
                    <span className="favorite-title">{piece.title}</span>
                    <span className="favorite-artist">{piece.artist}</span>
                  </div>
                  <div className="favorite-stats">
                    <span className="favorite-time">
                      {formatTime(piece.totalTime)}
                    </span>
                    <span className="favorite-count">
                      {piece.sessionCount} sessions
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {pieces.length === 0 && (
          <div className="empty-practice">
            <p>Add some pieces to start practicing!</p>
          </div>
        )}

        {/* YouTube Button at bottom */}
        <button
          className="youtube-bottom-btn"
          onClick={() => window.open("https://www.youtube.com", "_blank")}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
              fill="currentColor"
            />
          </svg>
          Find Piano Tutorials
        </button>

        {/* Bottom spacer for navigation bar */}
        <div className="bottom-spacer"></div>
      </div>
    </>
  );
}

export default PracticeView;
