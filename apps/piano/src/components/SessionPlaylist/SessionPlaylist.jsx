import { useState, useMemo, useCallback } from "react";
import "./SessionPlaylist.css";
import { formatTime } from "../../utils/youtube";
import { getStatusFromProgress, getStatusLabel } from "../../App";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faListCheck,
  faShuffle,
  faCheck,
  faChevronUp,
  faChevronDown,
  faHourglass,
  faHandsClapping,
  faGraduationCap,
  faBrain,
  faCrown,
} from "@fortawesome/free-solid-svg-icons";

const DEFAULT_PROGRESS = {
  rightHand: 0,
  leftHand: 0,
  together: 0,
  dynamics: false,
  memorized: 0,
};

const statusConfig = {
  not_started: { icon: faHourglass, color: "#64748b" },
  hands: { icon: faGraduationCap, color: "#14b8a6" },
  together: { icon: faHandsClapping, color: "#06b6d4" },
  learned: { icon: faCheck, color: "#4ade80" },
  memorizing: { icon: faBrain, color: "#a78bfa" },
  mastered: { icon: faCrown, color: "#f59e0b" },
};

const getDifficultyColor = (difficulty) => {
  const colors = {
    Unknown: "#64748b",
    Free: "#2dd4bf",
    Easy: "#4ade80",
    Medium: "#facc15",
    Hard: "#fb923c",
    Ultrahard: "#f43f5e",
  };
  return colors[difficulty] || "#94a3b8";
};

const TARGET_DURATION = 30 * 60; // 30 minutes in seconds

function getSessionWeight(daysAgo) {
  return 10 * Math.exp(-daysAgo / 13);
}

function trendingScore(piece, sessions, now) {
  const logs = sessions[piece.id] || [];
  let score = 0;
  for (const log of logs) {
    const logDate = new Date(log.timestamp);
    const daysAgo = Math.floor((now - logDate) / (1000 * 60 * 60 * 24));
    score += log.duration * getSessionWeight(daysAgo);
  }
  return score;
}

function getDifficultyValue(difficulty) {
  const values = {
    Unknown: 0,
    Free: 0,
    Easy: 1,
    Medium: 2,
    Hard: 3,
    Ultrahard: 4,
  };
  return values[difficulty] || 0;
}

function getAvgSessionTime(pieceId, sessions) {
  const logs = sessions[pieceId] || [];
  if (logs.length === 0) return 5 * 60; // default 5 min estimate
  const total = logs.reduce((sum, l) => sum + l.duration, 0);
  return total / logs.length;
}

function generatePlaylist(pieces, sessions, seed) {
  if (pieces.length === 0) return [];

  const now = new Date();
  const rng = seededRandom(seed);

  // Score each piece with a composite metric
  const scored = pieces.map((piece) => {
    const trend = trendingScore(piece, sessions, now);
    const status = getStatusFromProgress(piece.progress || DEFAULT_PROGRESS);
    const diff = getDifficultyValue(piece.difficulty);
    const logs = sessions[piece.id] || [];
    const lastPracticed = piece.lastPracticed
      ? new Date(piece.lastPracticed)
      : null;
    const daysSincePractice = lastPracticed
      ? Math.floor((now - lastPracticed) / (1000 * 60 * 60 * 24))
      : 999;

    // Higher = more likely to be picked
    // 1. Neglect bonus: pieces not practiced recently get a boost
    const neglectBonus = Math.min(daysSincePractice * 2, 60);

    // 2. Trending weight: high trending pieces get moderate priority
    const trendWeight = Math.min(trend / 500, 30);

    // 3. Status variety bonus: not_started/hands pieces get slight boost
    const statusBonus =
      status === "not_started"
        ? 15
        : status === "hands"
          ? 12
          : status === "together"
            ? 8
            : status === "learned"
              ? 5
              : status === "memorizing"
                ? 3
                : 2; // mastered - still included but lower priority

    // 4. Random jitter to keep things fresh (0-20)
    const jitter = rng() * 20;

    const score = neglectBonus + trendWeight + statusBonus + jitter;

    return {
      piece,
      score,
      avgTime: getAvgSessionTime(piece.id, sessions),
      difficulty: diff,
      status,
    };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Pick pieces until we fill ~30 minutes
  const playlist = [];
  let totalTime = 0;
  const usedDifficulties = new Set();
  const usedStatuses = new Set();

  for (const item of scored) {
    if (totalTime >= TARGET_DURATION) break;

    // Promote variety: slight preference for new difficulty/status combos
    const varietyBoost =
      (!usedDifficulties.has(item.difficulty) ? 5 : 0) +
      (!usedStatuses.has(item.status) ? 5 : 0);

    item.score += varietyBoost;
    playlist.push(item);
    totalTime += item.avgTime;
    usedDifficulties.add(item.difficulty);
    usedStatuses.add(item.status);
  }

  // Re-sort final playlist by score
  playlist.sort((a, b) => b.score - a.score);

  return playlist.map((item) => item.piece);
}

// Simple seeded PRNG for deterministic daily playlists
function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function getTodaySeed() {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function SessionPlaylist({
  pieces,
  practiceSessions,
  onPieceClick,
  playlistData,
  onPlaylistUpdate,
}) {
  const [expanded, setExpanded] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const todayStr = new Date().toDateString();

  // Determine if we need a fresh playlist
  const playlist = useMemo(() => {
    // If we have a stored playlist for today, use it
    if (
      playlistData &&
      playlistData.date === todayStr &&
      playlistData.pieceIds
    ) {
      const mapped = playlistData.pieceIds
        .map((id) => pieces.find((p) => p.id === id))
        .filter(Boolean);
      if (mapped.length > 0) return mapped;
    }

    // Generate new playlist
    const seed = getTodaySeed();
    const generated = generatePlaylist(pieces, practiceSessions, seed);
    // Ohne Stuecke nichts speichern: die leere Liste kaeme oben nicht durch,
    // wuerde sofort neu erzeugt und wieder gespeichert - Endlosschleife, die
    // App friert ein (React #185). Traf jeden Start mit leerer Bibliothek,
    // also auch den ersten hier vor dem Import.
    if (generated.length === 0) return generated;
    const ids = generated.map((p) => p.id);
    onPlaylistUpdate({ date: todayStr, pieceIds: ids, seed });
    return generated;
  }, [pieces, practiceSessions, playlistData, todayStr, onPlaylistUpdate]);

  // Check which pieces have been practiced today
  const completedToday = useMemo(() => {
    const completed = new Set();
    Object.entries(practiceSessions).forEach(([pieceId, sessions]) => {
      if (!Array.isArray(sessions)) return;
      const hasTodaySession = sessions.some(
        (s) =>
          s?.timestamp && new Date(s.timestamp).toDateString() === todayStr,
      );
      if (hasTodaySession) completed.add(pieceId);
    });
    return completed;
  }, [practiceSessions, todayStr]);

  const completedCount = playlist.filter((p) =>
    completedToday.has(p.id),
  ).length;

  const estimatedTime = useMemo(() => {
    return playlist.reduce(
      (sum, piece) => sum + getAvgSessionTime(piece.id, practiceSessions),
      0,
    );
  }, [playlist, practiceSessions]);

  const handleRegenerate = useCallback(() => {
    const newSeed = Date.now();
    const generated = generatePlaylist(pieces, practiceSessions, newSeed);
    const ids = generated.map((p) => p.id);
    onPlaylistUpdate({ date: todayStr, pieceIds: ids, seed: newSeed });
  }, [pieces, practiceSessions, todayStr, onPlaylistUpdate]);

  if (pieces.length === 0) return null;

  return (
    <div className="session-playlist">
      <button
        className="playlist-header-btn"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="playlist-header-left">
          <FontAwesomeIcon icon={faListCheck} className="playlist-icon" />
          <span className="playlist-title">Session Playlist</span>
          <span className="playlist-progress">
            {completedCount}/{playlist.length}
          </span>
        </div>
        <FontAwesomeIcon
          icon={expanded ? faChevronUp : faChevronDown}
          className="playlist-chevron"
        />
      </button>

      {expanded && (
        <div className="playlist-body">
          <div className="playlist-meta">
            <span className="playlist-estimate">
              ~{formatTime(Math.round(estimatedTime))}
            </span>
            <button
              className="playlist-refresh-btn"
              onClick={() => setShowConfirm(true)}
            >
              <FontAwesomeIcon icon={faShuffle} />
              <span>New Playlist</span>
            </button>
          </div>

          <div className="playlist-items">
            {playlist.map((piece, index) => {
              const isDone = completedToday.has(piece.id);
              const status = getStatusFromProgress(
                piece.progress || DEFAULT_PROGRESS,
              );
              const config = statusConfig[status] || statusConfig.not_started;
              const sessions = practiceSessions[piece.id] || [];
              const totalTime = sessions.reduce(
                (sum, s) => sum + s.duration,
                0,
              );
              const difficultyColor = getDifficultyColor(piece.difficulty);

              return (
                <button
                  key={piece.id}
                  className={`playlist-item ${isDone ? "completed" : ""}`}
                  onClick={() => onPieceClick(piece)}
                >
                  <div className="playlist-item-thumb">
                    <img
                      src={piece.thumbnail}
                      alt={piece.title}
                      onError={(e) => {
                        e.target.src =
                          "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'><rect fill='%232a2a3e' width='16' height='9'/><text x='8' y='5' text-anchor='middle' fill='%23666' font-size='3'>🎹</text></svg>";
                      }}
                    />
                    <span
                      className="playlist-diff-badge"
                      style={{ backgroundColor: difficultyColor }}
                    >
                      {piece.difficulty}
                    </span>
                    <span className="playlist-time-badge">
                      {formatTime(totalTime)}
                    </span>
                    {isDone && (
                      <div className="playlist-done-overlay">
                        <FontAwesomeIcon icon={faCheck} />
                      </div>
                    )}
                  </div>
                  <div className="playlist-item-content">
                    <div className="playlist-item-header">
                      <span className="playlist-item-title">{piece.title}</span>
                      <span className="playlist-item-artist">
                        {piece.artist}
                      </span>
                    </div>
                    <div className="playlist-item-status">
                      <span
                        className="playlist-status-icon"
                        style={{ color: config.color }}
                      >
                        <FontAwesomeIcon icon={config.icon} />
                      </span>
                      <span
                        className="playlist-status-label"
                        style={{ color: config.color }}
                      >
                        {getStatusLabel(status)}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showConfirm && (
        <div
          className="playlist-confirm-overlay"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="playlist-confirm-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="playlist-confirm-title">New Playlist?</p>
            <p className="playlist-confirm-text">
              Your current playlist will be replaced.
            </p>
            <div className="playlist-confirm-actions">
              <button
                className="playlist-confirm-cancel"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="playlist-confirm-ok"
                onClick={() => {
                  setShowConfirm(false);
                  handleRegenerate();
                }}
              >
                <FontAwesomeIcon icon={faShuffle} /> Shuffle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SessionPlaylist;
