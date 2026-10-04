import { useState } from "react";
import "./FilterTabs.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircle,
  faGraduationCap,
  faHandsClapping,
  faCheck,
  faBrain,
  faCrown,
} from "@fortawesome/free-solid-svg-icons";

function FilterTabs({ onFilterChange, onSortChange, onSearchChange }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState([]);
  const [progressFilter, setProgressFilter] = useState([]);
  const [sortBy, setSortBy] = useState("trending");
  const [sortReverse, setSortReverse] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filter-Optionen
  const difficultyOptions = [
    { value: "Unknown", label: "Unknown" },
    { value: "Free", label: "Free" },
    { value: "Easy", label: "Easy" },
    { value: "Medium", label: "Medium" },
    { value: "Hard", label: "Hard" },
    { value: "Ultrahard", label: "Ultrahard" },
  ];

  const progressOptions = [
    { value: "not_started", label: "Not Started", icon: faCircle },
    { value: "hands", label: "Hands", icon: faGraduationCap },
    { value: "together", label: "Together", icon: faHandsClapping },
    { value: "learned", label: "Learned", icon: faCheck },
    { value: "memorizing", label: "Memorizing", icon: faBrain },
    { value: "mastered", label: "Mastered", icon: faCrown },
  ];

  const sortOptions = [
    { value: "trending", label: "Trending" },
    { value: "practiceTime", label: "Practice Time" },
    { value: "lastPracticed", label: "Last Practiced" },
    { value: "default", label: "Date Added" },
    { value: "progress", label: "Progress" },
    { value: "difficulty", label: "Difficulty" },
    { value: "title", label: "Title" },
    { value: "random", label: "Random" },
  ];

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearchChange(value);
  };

  const handleDifficultyChange = (value) => {
    const newFilter = difficultyFilter.includes(value)
      ? difficultyFilter.filter((v) => v !== value)
      : [...difficultyFilter, value];
    setDifficultyFilter(newFilter);
    onFilterChange({ difficulty: newFilter, progress: progressFilter });
  };

  const handleProgressChange = (value) => {
    const newFilter = progressFilter.includes(value)
      ? progressFilter.filter((v) => v !== value)
      : [...progressFilter, value];
    setProgressFilter(newFilter);
    onFilterChange({ difficulty: difficultyFilter, progress: newFilter });
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    onSortChange({ sortBy: value, reverse: sortReverse });
  };

  const handleSortReverseToggle = () => {
    const newReverse = !sortReverse;
    setSortReverse(newReverse);
    onSortChange({ sortBy, reverse: newReverse });
  };

  const hasActiveFilters =
    difficultyFilter.length > 0 || progressFilter.length > 0;

  return (
    <div className="filter-sort-container">
      {/* Search Bar mit Filter Button */}
      <div className="search-filter-bar">
        <div className="search-input-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="Search by title or artist..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          {searchQuery && (
            <button
              className="clear-search"
              onClick={() => {
                setSearchQuery("");
                onSearchChange("");
              }}
            >
              ✕
            </button>
          )}
        </div>

        <button
          className={`filter-btn ${showFilters ? "active" : ""} ${
            hasActiveFilters ? "has-filters" : ""
          }`}
          onClick={() => setShowFilters(!showFilters)}
          title="Filter options"
        >
          <svg
            className="filter-icon"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2.5 5.83333H6.66667M6.66667 5.83333C6.66667 7.67428 8.15905 9.16667 10 9.16667C11.8409 9.16667 13.3333 7.67428 13.3333 5.83333M6.66667 5.83333C6.66667 3.99238 8.15905 2.5 10 2.5C11.8409 2.5 13.3333 3.99238 13.3333 5.83333M13.3333 5.83333H17.5M2.5 14.1667H8.33333M8.33333 14.1667C8.33333 16.0076 9.82572 17.5 11.6667 17.5C13.5076 17.5 15 16.0076 15 14.1667M8.33333 14.1667C8.33333 12.3257 9.82572 10.8333 11.6667 10.8333C13.5076 10.8333 15 12.3257 15 14.1667M15 14.1667H17.5"
              stroke="currentColor"
              strokeWidth="1.67"
              strokeLinecap="round"
            />
          </svg>
          {hasActiveFilters && <span className="active-dot"></span>}
        </button>
      </div>

      {/* Sort Controls */}
      <div className="controls-bar">
        <div className="sort-controls">
          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            className={`reverse-btn ${sortReverse ? "active" : ""}`}
            onClick={handleSortReverseToggle}
            title="Reverse order"
          >
            {sortReverse ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 4L12 20M12 20L18 14M12 20L6 14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 20L12 4M12 4L6 10M12 4L18 10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Expandable Filter Panel */}
      {showFilters && (
        <div className="filter-panel">
          <div className="filter-group">
            <label className="filter-label">Difficulty</label>
            <div className="filter-chips">
              {difficultyOptions.map((option) => (
                <button
                  key={option.value}
                  className={`filter-chip ${
                    difficultyFilter.includes(option.value) ? "active" : ""
                  }`}
                  onClick={() => handleDifficultyChange(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Progress</label>
            <div className="filter-chips">
              {progressOptions.map((option) => (
                <button
                  key={option.value}
                  className={`filter-chip ${
                    progressFilter.includes(option.value) ? "active" : ""
                  }`}
                  onClick={() => handleProgressChange(option.value)}
                >
                  <FontAwesomeIcon icon={option.icon} /> {option.label}
                </button>
              ))}
            </div>
          </div>

          {hasActiveFilters && (
            <button
              className="clear-filters-btn"
              onClick={() => {
                setDifficultyFilter([]);
                setProgressFilter([]);
                onFilterChange({ difficulty: [], progress: [] });
              }}
            >
              Reset all Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default FilterTabs;
