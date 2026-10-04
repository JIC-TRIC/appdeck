import { useState, useEffect } from "react";
import "./Modal.css";
import { getYouTubeThumbnail } from "../../utils/youtube";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleQuestion,
  faMusic,
  faFaceSmile,
  faMeh,
  faFaceFrown,
  faSkull,
  faCircleInfo,
  faXmark,
  faPen,
  faChevronDown,
  faChevronUp,
  faHandPointRight,
  faHandPointLeft,
  faHandsClapping,
  faVolumeHigh,
  faWandMagicSparkles,
  faLock,
  faPaste,
} from "@fortawesome/free-solid-svg-icons";

const DEFAULT_PROGRESS = {
  rightHand: 0,
  leftHand: 0,
  together: 0,
  dynamics: false,
  memorized: 0,
};

// 3-segment toggle component for 0/1/2 values
function ProgressToggle({
  label,
  icon,
  value,
  onChange,
  labels = ["—", "Slow", "Tempo"],
  disabled = false,
  lockedMessage = null,
}) {
  return (
    <div className={`progress-toggle-row ${disabled ? "disabled" : ""}`}>
      <div className="progress-toggle-label">
        <FontAwesomeIcon icon={icon} />
        <span>{label}</span>
        {lockedMessage && (
          <span className="locked-hint">
            <FontAwesomeIcon icon={faLock} /> {lockedMessage}
          </span>
        )}
      </div>
      <div className="progress-toggle-btns">
        {labels.map((lbl, i) => (
          <button
            key={i}
            type="button"
            className={`progress-toggle-btn ${value === i ? "active" : ""}`}
            onClick={() => !disabled && onChange(i)}
            disabled={disabled}
          >
            {lbl}
          </button>
        ))}
      </div>
    </div>
  );
}

// Boolean toggle for dynamics
function ProgressBoolToggle({
  label,
  icon,
  value,
  onChange,
  disabled = false,
  lockedMessage = null,
}) {
  return (
    <div className={`progress-toggle-row ${disabled ? "disabled" : ""}`}>
      <div className="progress-toggle-label">
        <FontAwesomeIcon icon={icon} />
        <span>{label}</span>
        {lockedMessage && (
          <span className="locked-hint">
            <FontAwesomeIcon icon={faLock} /> {lockedMessage}
          </span>
        )}
      </div>
      <div className="progress-toggle-btns">
        <button
          type="button"
          className={`progress-toggle-btn ${!value ? "active" : ""}`}
          onClick={() => !disabled && onChange(false)}
          disabled={disabled}
        >
          —
        </button>
        <button
          type="button"
          className={`progress-toggle-btn ${value ? "active" : ""}`}
          onClick={() => !disabled && onChange(true)}
          disabled={disabled}
        >
          Yes
        </button>
      </div>
    </div>
  );
}

function AddEditModal({ isOpen, onClose, onSave, editingPiece }) {
  const [formData, setFormData] = useState({
    youtubeUrl: "",
    title: "",
    artist: "",
    difficulty: "Unknown",
    progress: { ...DEFAULT_PROGRESS },
  });
  const [showDifficultyInfo, setShowDifficultyInfo] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const difficultyDescriptions = {
    Unknown: "Difficulty not yet assessed",
    Free: "Can play the piece fluently with both hands without significant errors",
    Easy: "Can play the piece safely with both hands, but not completely perfect",
    Medium:
      "Can play both hands separately well, but both hands together is still difficult",
    Hard: "Can play both hands separately with some errors, both hands together barely possible",
    Ultrahard:
      "Cannot play either hand separately, both hands together impossible",
  };

  useEffect(() => {
    if (editingPiece) {
      setFormData({
        ...editingPiece,
        progress: editingPiece.progress || { ...DEFAULT_PROGRESS },
      });
    } else {
      setFormData({
        youtubeUrl: "",
        title: "",
        artist: "",
        difficulty: "Unknown",
        progress: { ...DEFAULT_PROGRESS },
      });
      setShowDetails(false);
    }
  }, [editingPiece, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    };
  }, [isOpen]);

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setFormData((prev) => ({ ...prev, youtubeUrl: text }));
    } catch (error) {
      console.error("Failed to read clipboard:", error);
      alert("Clipboard access denied. Please paste manually.");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const pieceData = {
      ...formData,
      thumbnail: getYouTubeThumbnail(formData.youtubeUrl),
    };
    onSave(pieceData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const updateProgress = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      progress: { ...prev.progress, [field]: value },
    }));
  };

  if (!isOpen) return null;

  const progress = formData.progress || DEFAULT_PROGRESS;
  // Forward locks: can't advance until previous phase is done
  const handsReady = progress.rightHand >= 2 && progress.leftHand >= 2;
  const togetherReady = progress.together >= 2;
  // Backward locks: can't go back and edit once next phase has progress
  const handsLocked = progress.together >= 1;
  const togetherLocked = progress.dynamics === true;
  const dynamicsLocked = progress.memorized >= 1;

  return (
    <div className={`modal ${isOpen ? "active" : ""}`}>
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">
            {editingPiece
              ? formData.title || "Stück bearbeiten"
              : "Neues Stück hinzufügen"}
          </h2>
        </div>
        <form onSubmit={handleSubmit}>
          {!editingPiece ? (
            <>
              <div className="form-group">
                <label className="form-label">YouTube Link</label>
                <div className="input-with-button">
                  <input
                    type="url"
                    className="form-input"
                    name="youtubeUrl"
                    value={formData.youtubeUrl}
                    onChange={handleChange}
                    placeholder="https://youtube.com/watch?v=..."
                    required
                  />
                  <button
                    type="button"
                    className="btn-paste"
                    onClick={handlePasteFromClipboard}
                    title="Paste from clipboard"
                  >
                    <FontAwesomeIcon icon={faPaste} />
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  className="form-input"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Interpret</label>
                <input
                  type="text"
                  className="form-input"
                  name="artist"
                  value={formData.artist}
                  onChange={handleChange}
                  required
                />
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn-toggle-details"
                onClick={() => setShowDetails(!showDetails)}
              >
                <FontAwesomeIcon icon={faPen} />
                <span>Edit Title, Artist & Link</span>
                <FontAwesomeIcon
                  icon={showDetails ? faChevronUp : faChevronDown}
                  className="toggle-chevron"
                />
              </button>
              {showDetails && (
                <div className="details-fields">
                  <div className="form-group">
                    <label className="form-label">YouTube Link</label>
                    <div className="input-with-button">
                      <input
                        type="url"
                        className="form-input"
                        name="youtubeUrl"
                        value={formData.youtubeUrl}
                        onChange={handleChange}
                        placeholder="https://youtube.com/watch?v=..."
                        required
                      />
                      <button
                        type="button"
                        className="btn-paste"
                        onClick={handlePasteFromClipboard}
                        title="Paste from clipboard"
                      >
                        <FontAwesomeIcon icon={faPaste} />
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Title</label>
                    <input
                      type="text"
                      className="form-input"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Interpret</label>
                    <input
                      type="text"
                      className="form-input"
                      name="artist"
                      value={formData.artist}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              )}
            </>
          )}

          <div className="form-group">
            <div className="form-label-with-info">
              <label className="form-label">Difficulty</label>
              <button
                type="button"
                className="info-btn"
                onClick={() => setShowDifficultyInfo(true)}
                title="Show difficulty explanations"
              >
                <FontAwesomeIcon icon={faCircleInfo} />
              </button>
            </div>
            <div className="segmented-control">
              {[
                { v: "Unknown", icon: faCircleQuestion, l: "Unknown" },
                { v: "Free", icon: faMusic, l: "Free" },
                { v: "Easy", icon: faFaceSmile, l: "Easy" },
                { v: "Medium", icon: faMeh, l: "Medium" },
                { v: "Hard", icon: faFaceFrown, l: "Hard" },
                { v: "Ultrahard", icon: faSkull, l: "Ultra" },
              ].map((d) => (
                <button
                  key={d.v}
                  type="button"
                  className={`segment-btn ${formData.difficulty === d.v ? "active" : ""}`}
                  onClick={() =>
                    handleChange({ target: { name: "difficulty", value: d.v } })
                  }
                >
                  <span className="segment-icon">
                    <FontAwesomeIcon icon={d.icon} />
                  </span>
                  <span className="segment-label">{d.l}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Progress System */}
          <div className="form-group">
            <label className="form-label">Progress</label>
            <div className="progress-stepper">
              <div className="progress-phase">
                <div className="phase-title">
                  <FontAwesomeIcon
                    icon={faHandPointRight}
                    className="phase-icon"
                  />{" "}
                  Hands Separately
                </div>
                <ProgressToggle
                  label="Left Hand"
                  icon={faHandPointLeft}
                  value={progress.leftHand}
                  onChange={(v) => updateProgress("leftHand", v)}
                  disabled={handsLocked}
                  lockedMessage={handsLocked ? "Hands Together started" : null}
                />
                <ProgressToggle
                  label="Right Hand"
                  icon={faHandPointRight}
                  value={progress.rightHand}
                  onChange={(v) => updateProgress("rightHand", v)}
                  disabled={handsLocked}
                  lockedMessage={handsLocked ? "Hands Together started" : null}
                />
              </div>

              <div className="progress-phase">
                <div className="phase-title">
                  <FontAwesomeIcon
                    icon={faHandsClapping}
                    className="phase-icon"
                  />{" "}
                  Hands Together
                </div>
                <ProgressToggle
                  label="Together"
                  icon={faHandsClapping}
                  value={progress.together}
                  onChange={(v) => updateProgress("together", v)}
                  disabled={!handsReady || togetherLocked}
                  lockedMessage={
                    togetherLocked
                      ? "Dynamics started"
                      : !handsReady
                        ? "Both hands on tempo first"
                        : null
                  }
                />
              </div>

              <div className="progress-phase">
                <div className="phase-title">
                  <FontAwesomeIcon icon={faVolumeHigh} className="phase-icon" />{" "}
                  Expression
                </div>
                <ProgressBoolToggle
                  label="Dynamics"
                  icon={faVolumeHigh}
                  value={progress.dynamics}
                  onChange={(v) => updateProgress("dynamics", v)}
                  disabled={!togetherReady || dynamicsLocked}
                  lockedMessage={
                    dynamicsLocked
                      ? "Memorize started"
                      : !togetherReady
                        ? "Hands together on tempo first"
                        : null
                  }
                />
              </div>

              <div className="progress-phase optional-phase">
                <div className="phase-title">
                  <FontAwesomeIcon
                    icon={faWandMagicSparkles}
                    className="phase-icon"
                  />{" "}
                  Memorize <span className="optional-tag">optional</span>
                </div>
                <ProgressToggle
                  label="By Heart"
                  icon={faWandMagicSparkles}
                  value={progress.memorized}
                  onChange={(v) => updateProgress("memorized", v)}
                  labels={["—", "Notes", "Complete"]}
                  disabled={!progress.dynamics}
                  lockedMessage={!progress.dynamics ? "Dynamics first" : null}
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save
            </button>
          </div>
        </form>
      </div>

      {/* Difficulty Info Overlay */}
      {showDifficultyInfo && (
        <div
          className="difficulty-info-overlay"
          onClick={() => setShowDifficultyInfo(false)}
        >
          <div
            className="difficulty-info-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="difficulty-info-header">
              <h3>Difficulty Levels</h3>
              <button
                className="close-info-btn"
                onClick={() => setShowDifficultyInfo(false)}
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <div className="difficulty-info-list">
              {Object.entries(difficultyDescriptions).map(
                ([level, description]) => (
                  <div key={level} className="difficulty-info-item">
                    <div className="difficulty-info-level">
                      <span className="difficulty-icon">
                        <FontAwesomeIcon
                          icon={
                            level === "Unknown"
                              ? faCircleQuestion
                              : level === "Free"
                                ? faMusic
                                : level === "Easy"
                                  ? faFaceSmile
                                  : level === "Medium"
                                    ? faMeh
                                    : level === "Hard"
                                      ? faFaceFrown
                                      : faSkull
                          }
                        />
                      </span>
                      <span className="difficulty-name">{level}</span>
                    </div>
                    <p className="difficulty-description">{description}</p>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddEditModal;
