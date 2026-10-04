import { useState, useEffect, useRef } from "react";
import "./SetlistsView.css";
import { getYouTubeThumbnail } from "../../utils/youtube";
import { getStatusFromProgress, getStatusLabel } from "../../App";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faTrashCan,
  faPen,
  faChevronUp,
  faChevronDown,
  faChevronLeft,
  faXmark,
  faListOl,
  faCheck,
  faMusic,
  faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";

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

function SetlistsView({
  isOpen,
  onClose,
  pieces,
  practiceSessions,
  setlists,
  onSetlistsUpdate,
  onPieceClick,
}) {
  const [activeSetlist, setActiveSetlist] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [isAddingPieces, setIsAddingPieces] = useState(false);
  const [addPieceSearch, setAddPieceSearch] = useState("");
  const inputRef = useRef(null);

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

  useEffect(() => {
    if ((isCreating || isRenaming) && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating, isRenaming]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setActiveSetlist(null);
      setIsCreating(false);
      setIsRenaming(false);
      setIsAddingPieces(false);
      setAddPieceSearch("");
      setNewTitle("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const safeSetlists = setlists || [];

  const handleCreate = () => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    const newSetlist = {
      id: Date.now().toString(),
      title: trimmed,
      pieceIds: [],
    };
    onSetlistsUpdate([...safeSetlists, newSetlist]);
    setNewTitle("");
    setIsCreating(false);
    setActiveSetlist(newSetlist.id);
  };

  const handleRename = () => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    onSetlistsUpdate(
      safeSetlists.map((s) =>
        s.id === activeSetlist ? { ...s, title: trimmed } : s,
      ),
    );
    setNewTitle("");
    setIsRenaming(false);
  };

  const handleDelete = (id) => {
    onSetlistsUpdate(safeSetlists.filter((s) => s.id !== id));
    if (activeSetlist === id) setActiveSetlist(null);
  };

  const handleAddPiece = (pieceId) => {
    onSetlistsUpdate(
      safeSetlists.map((s) =>
        s.id === activeSetlist
          ? { ...s, pieceIds: [...s.pieceIds, pieceId] }
          : s,
      ),
    );
  };

  const handleRemovePiece = (pieceId) => {
    onSetlistsUpdate(
      safeSetlists.map((s) =>
        s.id === activeSetlist
          ? { ...s, pieceIds: s.pieceIds.filter((id) => id !== pieceId) }
          : s,
      ),
    );
  };

  const handleMovePiece = (index, direction) => {
    const setlist = safeSetlists.find((s) => s.id === activeSetlist);
    if (!setlist) return;
    const newIds = [...setlist.pieceIds];
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= newIds.length) return;
    [newIds[index], newIds[swapIndex]] = [newIds[swapIndex], newIds[index]];
    onSetlistsUpdate(
      safeSetlists.map((s) =>
        s.id === activeSetlist ? { ...s, pieceIds: newIds } : s,
      ),
    );
  };

  const currentSetlist = safeSetlists.find((s) => s.id === activeSetlist);

  // Pieces in the current setlist (resolved)
  const setlistPieces = currentSetlist
    ? currentSetlist.pieceIds
        .map((id) => pieces.find((p) => p.id === id))
        .filter(Boolean)
    : [];

  // Pieces available to add (not already in this setlist)
  const availablePieces = currentSetlist
    ? pieces.filter((p) => {
        if (currentSetlist.pieceIds.includes(p.id)) return false;
        if (addPieceSearch) {
          const q = addPieceSearch.toLowerCase();
          return (
            p.title.toLowerCase().includes(q) ||
            p.artist.toLowerCase().includes(q)
          );
        }
        return true;
      })
    : [];

  // === ADD PIECES SUB-VIEW ===
  if (isAddingPieces && activeSetlist) {
    return (
      <div className="modal active">
        <div className="modal-content setlists-modal-content">
          <div className="setlists-header">
            <button
              className="setlists-back-btn"
              onClick={() => {
                setIsAddingPieces(false);
                setAddPieceSearch("");
              }}
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            <h2 className="modal-title">Add Pieces</h2>
            <button
              className="close-btn"
              onClick={() => {
                setIsAddingPieces(false);
                setAddPieceSearch("");
              }}
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>

          <div className="setlists-search-wrapper">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="setlists-search-icon"
            />
            <input
              type="text"
              className="setlists-search-input"
              placeholder="Search by title or artist..."
              value={addPieceSearch}
              onChange={(e) => setAddPieceSearch(e.target.value)}
            />
            {addPieceSearch && (
              <button
                className="setlists-search-clear"
                onClick={() => setAddPieceSearch("")}
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            )}
          </div>

          <div className="setlists-piece-list">
            {availablePieces.length === 0 ? (
              <div className="setlists-empty">
                All pieces are already in this setlist.
              </div>
            ) : (
              availablePieces.map((piece) => {
                const thumb = getYouTubeThumbnail(piece.youtubeUrl);
                return (
                  <button
                    key={piece.id}
                    className="setlists-add-piece-item"
                    onClick={() => handleAddPiece(piece.id)}
                  >
                    <div className="setlists-piece-thumb">
                      {thumb ? (
                        <img src={thumb} alt="" />
                      ) : (
                        <div className="setlists-piece-thumb-placeholder">
                          <FontAwesomeIcon icon={faMusic} />
                        </div>
                      )}
                    </div>
                    <div className="setlists-piece-info">
                      <span className="setlists-piece-title">
                        {piece.title}
                      </span>
                      <span className="setlists-piece-artist">
                        {piece.artist}
                      </span>
                    </div>
                    <span className="setlists-add-icon">
                      <FontAwesomeIcon icon={faPlus} />
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  // === SETLIST DETAIL VIEW ===
  if (activeSetlist && currentSetlist) {
    return (
      <div className="modal active">
        <div className="modal-content setlists-modal-content">
          <div className="setlists-header">
            <button
              className="setlists-back-btn"
              onClick={() => setActiveSetlist(null)}
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            {isRenaming ? (
              <form
                className="setlists-rename-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRename();
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  className="setlists-input"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Setlist name"
                  maxLength={50}
                />
                <button type="submit" className="setlists-confirm-btn">
                  <FontAwesomeIcon icon={faCheck} />
                </button>
              </form>
            ) : (
              <h2 className="modal-title setlist-detail-title">
                {currentSetlist.title}
              </h2>
            )}
            {!isRenaming && (
              <button
                className="close-btn"
                onClick={() => {
                  setIsRenaming(true);
                  setNewTitle(currentSetlist.title);
                }}
              >
                <FontAwesomeIcon icon={faPen} />
              </button>
            )}
          </div>

          <div className="setlists-detail-meta">
            <span>
              {setlistPieces.length}{" "}
              {setlistPieces.length === 1 ? "piece" : "pieces"}
            </span>
          </div>

          {setlistPieces.length === 0 ? (
            <div className="setlists-empty">
              <p>No pieces yet. Add some!</p>
            </div>
          ) : (
            <div className="setlists-piece-list">
              {setlistPieces.map((piece, index) => {
                const thumb = getYouTubeThumbnail(piece.youtubeUrl);
                const status = getStatusFromProgress(piece.progress);
                return (
                  <div key={piece.id} className="setlists-piece-row">
                    <div className="setlists-piece-order">
                      <button
                        className="setlists-move-btn"
                        onClick={() => handleMovePiece(index, -1)}
                        disabled={index === 0}
                      >
                        <FontAwesomeIcon icon={faChevronUp} />
                      </button>
                      <span className="setlists-piece-num">{index + 1}</span>
                      <button
                        className="setlists-move-btn"
                        onClick={() => handleMovePiece(index, 1)}
                        disabled={index === setlistPieces.length - 1}
                      >
                        <FontAwesomeIcon icon={faChevronDown} />
                      </button>
                    </div>
                    <button
                      className="setlists-piece-card"
                      onClick={() => onPieceClick(piece)}
                    >
                      <div className="setlists-piece-thumb">
                        {thumb ? (
                          <img src={thumb} alt="" />
                        ) : (
                          <div className="setlists-piece-thumb-placeholder">
                            <FontAwesomeIcon icon={faMusic} />
                          </div>
                        )}
                        <span
                          className="setlists-diff-badge"
                          style={{
                            background: getDifficultyColor(piece.difficulty),
                          }}
                        >
                          {piece.difficulty}
                        </span>
                      </div>
                      <div className="setlists-piece-info">
                        <span className="setlists-piece-title">
                          {piece.title}
                        </span>
                        <span className="setlists-piece-artist">
                          {piece.artist}
                        </span>
                        <span className="setlists-piece-status">
                          {getStatusLabel(status)}
                        </span>
                      </div>
                    </button>
                    <button
                      className="setlists-remove-btn"
                      onClick={() => handleRemovePiece(piece.id)}
                    >
                      <FontAwesomeIcon icon={faTrashCan} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <button
            className="setlists-add-btn"
            onClick={() => setIsAddingPieces(true)}
          >
            <FontAwesomeIcon icon={faPlus} /> Add Pieces
          </button>
        </div>
      </div>
    );
  }

  // === SETLISTS LIST VIEW ===
  return (
    <div className="modal active">
      <div className="modal-content setlists-modal-content">
        <div className="setlists-header">
          <h2 className="modal-title">My Setlists</h2>
          <button className="close-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {isCreating ? (
          <form
            className="setlists-create-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleCreate();
            }}
          >
            <input
              ref={inputRef}
              type="text"
              className="setlists-input"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Setlist name..."
              maxLength={50}
            />
            <button type="submit" className="setlists-confirm-btn">
              <FontAwesomeIcon icon={faCheck} />
            </button>
            <button
              type="button"
              className="setlists-cancel-btn"
              onClick={() => {
                setIsCreating(false);
                setNewTitle("");
              }}
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </form>
        ) : (
          <button
            className="setlists-new-btn"
            onClick={() => setIsCreating(true)}
          >
            <FontAwesomeIcon icon={faPlus} /> New Setlist
          </button>
        )}

        {safeSetlists.length === 0 && !isCreating ? (
          <div className="setlists-empty">
            <FontAwesomeIcon icon={faListOl} className="setlists-empty-icon" />
            <p>No setlists yet</p>
            <span>
              Create one to organize your pieces for performances or practice.
            </span>
          </div>
        ) : (
          <div className="setlists-list">
            {safeSetlists.map((setlist) => {
              const resolvedPieces = setlist.pieceIds
                .map((id) => pieces.find((p) => p.id === id))
                .filter(Boolean);
              const firstThumb =
                resolvedPieces.length > 0
                  ? getYouTubeThumbnail(resolvedPieces[0].youtubeUrl)
                  : null;
              return (
                <div key={setlist.id} className="setlists-list-item">
                  <button
                    className="setlists-list-card"
                    onClick={() => setActiveSetlist(setlist.id)}
                  >
                    <div className="setlists-list-thumb">
                      {firstThumb ? (
                        <img src={firstThumb} alt="" />
                      ) : (
                        <div className="setlists-list-thumb-placeholder">
                          <FontAwesomeIcon icon={faListOl} />
                        </div>
                      )}
                    </div>
                    <div className="setlists-list-info">
                      <span className="setlists-list-title">
                        {setlist.title}
                      </span>
                      <span className="setlists-list-count">
                        {resolvedPieces.length}{" "}
                        {resolvedPieces.length === 1 ? "piece" : "pieces"}
                      </span>
                    </div>
                  </button>
                  <button
                    className="setlists-delete-btn"
                    onClick={() => handleDelete(setlist.id)}
                  >
                    <FontAwesomeIcon icon={faTrashCan} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default SetlistsView;
