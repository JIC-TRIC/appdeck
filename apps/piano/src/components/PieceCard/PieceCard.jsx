import "./PieceCard.css";
import { formatTime } from "../../utils/youtube";
import { getStatusFromProgress, getStatusLabel } from "../../App";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHourglass,
  faHandsClapping,
  faGraduationCap,
  faCheck,
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

function ProgressDots({ progress }) {
  const p = { ...DEFAULT_PROGRESS, ...progress };
  return (
    <div className="progress-dots">
      <div className="dot-group">
        <span className={`dot-label ${p.leftHand > 0 ? "hands-label" : ""}`}>
          LH
        </span>
        <span className={`dot ${p.leftHand >= 1 ? "filled hands" : ""}`}></span>
        <span className={`dot ${p.leftHand >= 2 ? "filled hands" : ""}`}></span>
      </div>
      <div className="dot-group">
        <span className={`dot-label ${p.rightHand > 0 ? "hands-label" : ""}`}>
          RH
        </span>
        <span
          className={`dot ${p.rightHand >= 1 ? "filled hands" : ""}`}
        ></span>
        <span
          className={`dot ${p.rightHand >= 2 ? "filled hands" : ""}`}
        ></span>
      </div>
      <span className="dot-separator">│</span>
      <div className="dot-group together-group">
        <span
          className={`dot ${p.together >= 1 ? "filled together" : ""}`}
        ></span>
        <span
          className={`dot ${p.together >= 2 ? "filled together" : ""}`}
        ></span>
        <span className={`dot ${p.dynamics ? "filled dynamics" : ""}`}></span>
      </div>
      <span className="dot-separator">│</span>
      <div className="dot-group memorize-group">
        <span
          className={`dot ${p.memorized >= 1 ? "filled memorize" : ""}`}
        ></span>
        <span
          className={`dot ${p.memorized >= 2 ? "filled memorize" : ""}`}
        ></span>
      </div>
    </div>
  );
}

function PieceCard({ piece, sessions, onEdit, onYouTubeClick }) {
  const progress = piece.progress || DEFAULT_PROGRESS;
  const status = getStatusFromProgress(progress);
  const config = statusConfig[status] || statusConfig.not_started;
  const difficultyColor = getDifficultyColor(piece.difficulty);

  const totalPracticeTime = sessions.reduce(
    (sum, log) => sum + log.duration,
    0,
  );

  return (
    <div className="piece-card">
      <div
        className="piece-thumbnail"
        onClick={() => onYouTubeClick(piece.youtubeUrl, piece.id)}
      >
        <img
          src={piece.thumbnail}
          alt={piece.title}
          onError={(e) => {
            e.target.src =
              "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'><rect fill='%232a2a3e' width='16' height='9'/><text x='8' y='5' text-anchor='middle' fill='%23666' font-size='3'>🎹</text></svg>";
          }}
        />
        <div className="practice-time-badge">
          {formatTime(totalPracticeTime)}
        </div>
        <div
          className="difficulty-badge"
          style={{ backgroundColor: difficultyColor }}
        >
          {piece.difficulty}
        </div>
      </div>

      <div className="piece-content" onClick={() => onEdit(piece.id)}>
        <div className="piece-header">
          <div className="piece-title">{piece.title}</div>
          <div className="piece-artist">{piece.artist}</div>
        </div>

        <div className="progress-section">
          <div className="status-display">
            <span className="status-icon" style={{ color: config.color }}>
              <FontAwesomeIcon icon={config.icon} />
            </span>
            <span className="status-label" style={{ color: config.color }}>
              {getStatusLabel(status)}
            </span>
          </div>
        </div>
      </div>

      <div className="progress-dots-bar">
        <ProgressDots progress={progress} />
      </div>
    </div>
  );
}

export default PieceCard;
