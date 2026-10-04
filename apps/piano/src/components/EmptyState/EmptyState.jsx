import "./EmptyState.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMusic } from "@fortawesome/free-solid-svg-icons";

function EmptyState({ onAddClick }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <FontAwesomeIcon icon={faMusic} />
      </div>
      <div className="empty-title">You haven't added any pieces yet</div>
      <div className="empty-text">Add your first piano piece!</div>
      <button className="btn btn-primary" onClick={onAddClick}>
        Add Your First Piece
      </button>
    </div>
  );
}

export default EmptyState;
