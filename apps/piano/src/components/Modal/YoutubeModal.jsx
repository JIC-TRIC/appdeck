import { useState, useEffect, useRef } from "react";
import "./Modal.css";
import { extractVideoId, formatTimerDisplay } from "../../utils/youtube";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHandPointRight,
  faHandPointLeft,
  faHandsClapping,
  faVolumeHigh,
  faWandMagicSparkles,
  faCircleQuestion,
  faMusic,
  faFaceSmile,
  faMeh,
  faFaceFrown,
  faSkull,
  faLock,
} from "@fortawesome/free-solid-svg-icons";

const DEFAULT_PROGRESS = {
  rightHand: 0,
  leftHand: 0,
  together: 0,
  dynamics: false,
  memorized: 0,
};

function YouTubeModal({
  isOpen,
  onClose,
  videoUrl,
  piece,
  onSavePracticeTime,
  onUpdateProgress,
  onUpdateDifficulty,
  settings,
}) {
  const [seconds, setSeconds] = useState(0);
  const [player, setPlayer] = useState(null);
  const [progress, setProgress] = useState({ ...DEFAULT_PROGRESS });
  const [difficulty, setDifficulty] = useState("Unknown");
  const intervalRef = useRef(null);
  const playerRef = useRef(null);
  const startTimeRef = useRef(null);

  // Initialize progress and difficulty when modal opens
  useEffect(() => {
    if (isOpen && piece) {
      setProgress(piece.progress || { ...DEFAULT_PROGRESS });
      setDifficulty(piece.difficulty || "Unknown");
    }
  }, [isOpen, piece]);

  // Verhindere Body-Scroll wenn Modal geöffnet ist
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

  // Load YouTube IFrame API
  useEffect(() => {
    // Only load API if we're showing the player
    if (settings?.showExternalYouTubeButton) {
      return;
    }

    // Check if API is already loaded
    if (window.YT && window.YT.Player) {
      return;
    }

    // Load the IFrame Player API code asynchronously
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    // API ready callback
    window.onYouTubeIframeAPIReady = () => {
      console.log("YouTube API ready");
    };
  }, [settings]);

  // Initialize player when modal opens (only if not showing external button)
  useEffect(() => {
    if (!isOpen || settings?.showExternalYouTubeButton) return;

    const videoId = extractVideoId(videoUrl);
    if (!videoId) return;

    // Wait for API to be ready
    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) {
        setTimeout(initPlayer, 100);
        return;
      }

      // Create player
      const newPlayer = new window.YT.Player("youtube-player", {
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: (event) => {
            playerRef.current = event.target;
            setPlayer(event.target);
          },
        },
      });
    };

    initPlayer();

    // Cleanup
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [isOpen, videoUrl, settings]);

  // Start timer when modal opens
  useEffect(() => {
    if (isOpen) {
      // Speichere Startzeit
      startTimeRef.current = Date.now();
      setSeconds(0);

      // Update Timer basierend auf verstrichener Zeit
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setSeconds(elapsed);
      }, 1000);
    }

    // Cleanup: stop timer when modal closes
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      startTimeRef.current = null;
    };
  }, [isOpen]);

  // Zusätzlicher Effect: Update bei visibility change (App wird wieder aktiv)
  useEffect(() => {
    if (!isOpen) return;

    const handleVisibilityChange = () => {
      if (!document.hidden && startTimeRef.current) {
        // App ist wieder aktiv - berechne korrekte Zeit
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setSeconds(elapsed);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isOpen]);

  const updateProgress = (field, value) => {
    setProgress((prev) => ({ ...prev, [field]: value }));
  };

  const handleCloseWithoutSaving = () => {
    onClose();
  };

  const handleClose = () => {
    if (seconds > 0 && piece) {
      onSavePracticeTime(piece.id, seconds, new Date().toISOString());
    }
    const progressChanged =
      JSON.stringify(progress) !==
      JSON.stringify(piece?.progress || DEFAULT_PROGRESS);
    if (progressChanged) {
      onUpdateProgress(piece.id, progress);
    }
    const difficultyChanged = difficulty !== (piece?.difficulty || "Unknown");
    if (difficultyChanged && onUpdateDifficulty) {
      onUpdateDifficulty(piece.id, difficulty);
    }
    onClose();
  };

  const handleOpenInYouTube = () => {
    window.open(videoUrl, "_blank");
  };

  if (!isOpen) return null;

  const videoId = extractVideoId(videoUrl);

  return (
    <div className={`modal ${isOpen ? "active" : ""}`}>
      <div className="modal-content youtube-modal-content">
        <div className="modal-header">
          <h2 className="modal-title">{piece?.title || "YouTube Video"}</h2>
          <div className="timer-display">⏱️ {formatTimerDisplay(seconds)}</div>
        </div>

        {/* Difficulty Selector */}
        <div className="form-group">
          <label className="form-label">Difficulty</label>
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
                className={`segment-btn ${difficulty === d.v ? "active" : ""}`}
                onClick={() => setDifficulty(d.v)}
              >
                <span className="segment-icon">
                  <FontAwesomeIcon icon={d.icon} />
                </span>
                <span className="segment-label">{d.l}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Progress Selector */}
        <div className="form-group">
          <label className="form-label">Progress</label>
          {(() => {
            // Forward locks: can't advance until previous phase is done
            const handsReady =
              progress.rightHand >= 2 && progress.leftHand >= 2;
            const togetherReady = progress.together >= 2;
            // Backward locks: can't go back once next phase has progress
            const handsLocked = progress.together >= 1;
            const togetherLocked = progress.dynamics === true;
            const dynamicsLocked = progress.memorized >= 1;

            const handsDisabled = handsLocked;
            const togetherDisabled = !handsReady || togetherLocked;
            const dynamicsDisabled = !togetherReady || dynamicsLocked;
            const memorizeDisabled = !progress.dynamics;

            return (
              <div className="progress-stepper">
                <div className="progress-phase">
                  <div className="phase-title">
                    <FontAwesomeIcon
                      icon={faHandPointRight}
                      className="phase-icon"
                    />{" "}
                    Hands Separately
                  </div>
                  <div
                    className={`progress-toggle-row ${handsDisabled ? "disabled" : ""}`}
                  >
                    <div className="progress-toggle-label">
                      <FontAwesomeIcon icon={faHandPointRight} />{" "}
                      <span>Right Hand</span>
                      {handsLocked && (
                        <span className="locked-hint">
                          <FontAwesomeIcon icon={faLock} /> Hands Together
                          started
                        </span>
                      )}
                    </div>
                    <div className="progress-toggle-btns">
                      {["—", "Slow", "Tempo"].map((lbl, i) => (
                        <button
                          key={i}
                          type="button"
                          className={`progress-toggle-btn ${progress.rightHand === i ? "active" : ""}`}
                          onClick={() =>
                            !handsDisabled && updateProgress("rightHand", i)
                          }
                          disabled={handsDisabled}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div
                    className={`progress-toggle-row ${handsDisabled ? "disabled" : ""}`}
                  >
                    <div className="progress-toggle-label">
                      <FontAwesomeIcon icon={faHandPointLeft} />{" "}
                      <span>Left Hand</span>
                      {handsLocked && (
                        <span className="locked-hint">
                          <FontAwesomeIcon icon={faLock} /> Hands Together
                          started
                        </span>
                      )}
                    </div>
                    <div className="progress-toggle-btns">
                      {["—", "Slow", "Tempo"].map((lbl, i) => (
                        <button
                          key={i}
                          type="button"
                          className={`progress-toggle-btn ${progress.leftHand === i ? "active" : ""}`}
                          onClick={() =>
                            !handsDisabled && updateProgress("leftHand", i)
                          }
                          disabled={handsDisabled}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="progress-phase">
                  <div className="phase-title">
                    <FontAwesomeIcon
                      icon={faHandsClapping}
                      className="phase-icon"
                    />{" "}
                    Hands Together
                  </div>
                  <div
                    className={`progress-toggle-row ${togetherDisabled ? "disabled" : ""}`}
                  >
                    <div className="progress-toggle-label">
                      <FontAwesomeIcon icon={faHandsClapping} />{" "}
                      <span>Together</span>
                      {togetherLocked ? (
                        <span className="locked-hint">
                          <FontAwesomeIcon icon={faLock} /> Dynamics started
                        </span>
                      ) : (
                        !handsReady && (
                          <span className="locked-hint">
                            <FontAwesomeIcon icon={faLock} /> Both hands on
                            tempo first
                          </span>
                        )
                      )}
                    </div>
                    <div className="progress-toggle-btns">
                      {["—", "Slow", "Tempo"].map((lbl, i) => (
                        <button
                          key={i}
                          type="button"
                          className={`progress-toggle-btn ${progress.together === i ? "active" : ""}`}
                          onClick={() =>
                            !togetherDisabled && updateProgress("together", i)
                          }
                          disabled={togetherDisabled}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="progress-phase">
                  <div className="phase-title">
                    <FontAwesomeIcon
                      icon={faVolumeHigh}
                      className="phase-icon"
                    />{" "}
                    Expression
                  </div>
                  <div
                    className={`progress-toggle-row ${dynamicsDisabled ? "disabled" : ""}`}
                  >
                    <div className="progress-toggle-label">
                      <FontAwesomeIcon icon={faVolumeHigh} />{" "}
                      <span>Dynamics</span>
                      {dynamicsLocked ? (
                        <span className="locked-hint">
                          <FontAwesomeIcon icon={faLock} /> Memorize started
                        </span>
                      ) : (
                        !togetherReady && (
                          <span className="locked-hint">
                            <FontAwesomeIcon icon={faLock} /> Hands together on
                            tempo first
                          </span>
                        )
                      )}
                    </div>
                    <div className="progress-toggle-btns">
                      <button
                        type="button"
                        className={`progress-toggle-btn ${!progress.dynamics ? "active" : ""}`}
                        onClick={() =>
                          !dynamicsDisabled && updateProgress("dynamics", false)
                        }
                        disabled={dynamicsDisabled}
                      >
                        —
                      </button>
                      <button
                        type="button"
                        className={`progress-toggle-btn ${progress.dynamics ? "active" : ""}`}
                        onClick={() =>
                          !dynamicsDisabled && updateProgress("dynamics", true)
                        }
                        disabled={dynamicsDisabled}
                      >
                        Yes
                      </button>
                    </div>
                  </div>
                </div>

                <div className="progress-phase optional-phase">
                  <div className="phase-title">
                    <FontAwesomeIcon
                      icon={faWandMagicSparkles}
                      className="phase-icon"
                    />{" "}
                    Memorize <span className="optional-tag">optional</span>
                  </div>
                  <div
                    className={`progress-toggle-row ${memorizeDisabled ? "disabled" : ""}`}
                  >
                    <div className="progress-toggle-label">
                      <FontAwesomeIcon icon={faWandMagicSparkles} />{" "}
                      <span>By Heart</span>
                      {memorizeDisabled && (
                        <span className="locked-hint">
                          <FontAwesomeIcon icon={faLock} /> Dynamics first
                        </span>
                      )}
                    </div>
                    <div className="progress-toggle-btns">
                      {["—", "Notes", "Complete"].map((lbl, i) => (
                        <button
                          key={i}
                          type="button"
                          className={`progress-toggle-btn ${progress.memorized === i ? "active" : ""}`}
                          onClick={() =>
                            !memorizeDisabled && updateProgress("memorized", i)
                          }
                          disabled={memorizeDisabled}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Show either external button OR YouTube player */}
        {settings?.showExternalYouTubeButton ? (
          <button
            className="btn-open-youtube"
            onClick={handleOpenInYouTube}
            title="Open in YouTube (ad-free with Premium)"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 6H6C4.89543 6 4 6.89543 4 8V18C4 19.1046 4.89543 20 6 20H16C17.1046 20 18 19.1046 18 18V14M14 4H20M20 4V10M20 4L10 14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Open in YouTube
          </button>
        ) : (
          videoId && (
            <div className="video-container">
              <div id="youtube-player"></div>
            </div>
          )
        )}

        <div className="modal-actions">
          <button
            className="btn btn-secondary"
            onClick={handleCloseWithoutSaving}
          >
            Close
          </button>
          <button className="btn btn-primary" onClick={handleClose}>
            Close and Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default YouTubeModal;
