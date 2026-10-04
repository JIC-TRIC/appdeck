import { useState, useMemo, useEffect } from "react";
import "./App.css";
import { useStored } from "@lib/useStored";
import { APP_ID } from "./storage";
import { extractVideoId } from "./utils/youtube";
import Header from "./components/Header/Header";
import StatsBar from "./components/StatsBar/StatsBar";
import FilterTabs from "./components/FilterTabs/FilterTabs";
import PieceCard from "./components/PieceCard/PieceCard";
import EmptyState from "./components/EmptyState/EmptyState";
import AddEditModal from "./components/Modal/AddEditModal";
import YouTubeModal from "./components/Modal/YoutubeModal";
import Toast from "./components/Toast/Toast";
import Settings from "./components/Settings/Settings";
import BottomNav from "./components/BottomNav/BottomNav";
import PracticeView from "./components/PracticeView/PracticeView";
import StatsView from "./components/StatsView/StatsView";
import MoreView from "./components/MoreView/MoreView";
import HomeView from "./components/HomeView/HomeView";
import SetlistsView from "./components/Setlists/SetlistsView";

function getSessionWeight(daysAgo) {
  // Exponentieller Abfall: Jeder Tag macht einen Unterschied
  // Nach 30 Tagen noch 1/10 des heutigen Werts
  // Formel: 10 * e^(-daysAgo/13) erreicht genau 1.0 nach 30 Tagen
  return 10 * Math.exp(-daysAgo / 13);
}

// Default progress object
const DEFAULT_PROGRESS = {
  rightHand: 0,
  leftHand: 0,
  together: 0,
  dynamics: false,
  memorized: 0,
};

// Ensure progress consistency: if a later stage has progress,
// all previous stages must be completed (fixes migration artifacts)
function normalizeProgress(p) {
  const out = { ...p };
  // If memorized started → dynamics must be done
  if (out.memorized >= 1) out.dynamics = true;
  // If dynamics done → together must be at Tempo
  if (out.dynamics) out.together = 2;
  // If together started → both hands must be at Tempo
  if (out.together >= 1) {
    out.rightHand = 2;
    out.leftHand = 2;
  }
  return out;
}

// Migrate old milestones[] to new progress object
function migrateProgress(piece) {
  if (piece.progress) {
    const normalized = normalizeProgress(piece.progress);
    if (
      normalized.rightHand !== piece.progress.rightHand ||
      normalized.leftHand !== piece.progress.leftHand ||
      normalized.together !== piece.progress.together ||
      normalized.dynamics !== piece.progress.dynamics
    ) {
      return { ...piece, progress: normalized };
    }
    return piece;
  }
  const ms = piece.milestones || [];
  return {
    ...piece,
    progress: normalizeProgress({
      rightHand: ms.includes("right_hand_full")
        ? 2
        : ms.includes("right_hand")
          ? 1
          : 0,
      leftHand: ms.includes("left_hand_full")
        ? 2
        : ms.includes("left_hand")
          ? 1
          : 0,
      together: ms.includes("tempo_reached")
        ? 2
        : ms.includes("hands_together")
          ? 1
          : 0,
      dynamics: ms.includes("dynamics_added"),
      memorized: ms.includes("memorized")
        ? 2
        : ms.includes("performance_ready")
          ? 1
          : 0,
    }),
  };
}

// Get status from progress object
export function getStatusFromProgress(progress = DEFAULT_PROGRESS) {
  const p = { ...DEFAULT_PROGRESS, ...progress };
  if (p.memorized === 2) return "mastered";
  if (p.memorized === 1) return "memorizing";
  if (p.dynamics) return "learned";
  if (p.together >= 1) return "together";
  if (p.rightHand >= 1 || p.leftHand >= 1) return "hands";
  return "not_started";
}

export function getStatusLabel(status) {
  const labels = {
    not_started: "Not Started",
    hands: "Hands Separately",
    together: "Hands Together",
    learned: "Learned",
    memorizing: "Memorizing",
    mastered: "Mastered",
  };
  return labels[status] || "Not Started";
}

export function getStatusValue(status) {
  const values = {
    not_started: 0,
    hands: 1,
    together: 2,
    learned: 3,
    memorizing: 4,
    mastered: 5,
  };
  return values[status] || 0;
}

function App() {
  // Gespeichert unter piano:<name> (siehe storage.ts)
  const [rawPieces, setRawPieces] = useStored(APP_ID, "pieces", []);
  // Auto-migrate old pieces on load
  const pieces = useMemo(() => rawPieces.map(migrateProgress), [rawPieces]);
  const setPieces = (updater) => {
    if (typeof updater === "function") {
      setRawPieces((prev) => updater(prev.map(migrateProgress)));
    } else {
      setRawPieces(updater);
    }
  };
  const [practiceSessions, setPracticeSessions] = useStored(
    APP_ID,
    "sessions",
    {},
  );
  const [settings, setSettings] = useStored(APP_ID, "settings", {
    showExternalYouTubeButton: true,
    favoritePiecesCount: 3,
    colorScheme: "midnight",
  });
  const [playlistData, setPlaylistData] = useStored(APP_ID, "playlist", null);
  const [setlists, setSetlists] = useStored(APP_ID, "setlists", []);

  // Apply color scheme
  const validThemes = [
    "midnight",
    "monochrome",
    "sandstorm",
    "slate",
    "ivory",
    "breeze",
  ];
  useEffect(() => {
    const theme = validThemes.includes(settings.colorScheme)
      ? settings.colorScheme
      : "midnight";
    if (theme !== settings.colorScheme) {
      setSettings({ ...settings, colorScheme: theme });
    }
    document.documentElement.setAttribute("data-theme", theme);
    // Hintergrund fuer den Uebergang zurueck in den Launcher (shared/shell.js
    // liest theme-color)
    const background = getComputedStyle(document.documentElement)
      .getPropertyValue("--background")
      .trim();
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", background);
  }, [settings.colorScheme]);

  const [activeTab, setActiveTab] = useState("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    difficulty: [],
    progress: [],
  });
  const [sort, setSort] = useState({ sortBy: "trending", reverse: false });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isYouTubeModalOpen, setIsYouTubeModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSetlistsOpen, setIsSetlistsOpen] = useState(false);
  const [editingPiece, setEditingPiece] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [practicingPiece, setPracticingPiece] = useState(null);
  const [toast, setToast] = useState({ message: "", isVisible: false });
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Scroll-to-Top Button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const showToast = (message) => {
    setToast({ message, isVisible: true });
  };

  const hideToast = () => {
    setToast({ message: "", isVisible: false });
  };

  const isDuplicateYouTubeUrl = (url, excludeId = null) => {
    const newVideoId = extractVideoId(url);
    if (!newVideoId) return false;

    return pieces.some((piece) => {
      if (excludeId && piece.id === excludeId) return false;
      const existingVideoId = extractVideoId(piece.youtubeUrl);
      return existingVideoId === newVideoId;
    });
  };

  const getDifficultyValue = (difficulty) => {
    const values = {
      Unknown: -1,
      Free: 0,
      Easy: 1,
      Medium: 2,
      Hard: 3,
      Ultrahard: 4,
    };
    return values[difficulty] || 0;
  };

  const trendingScore = (piece, now) => {
    const logs = practiceSessions[piece.id] || [];

    let score = 0;
    for (let log of logs) {
      const logDate = new Date(log.timestamp);
      const daysAgo = Math.floor((now - logDate) / (1000 * 60 * 60 * 24));

      const weight = getSessionWeight(daysAgo);
      score += log.duration * weight;
    }
    return score;
  };

  const getTotalPracticeTime = (pieceId) => {
    const logs = practiceSessions[pieceId] || [];
    return logs.reduce((sum, log) => sum + log.duration, 0);
  };

  const processedPieces = useMemo(() => {
    let result = [...pieces];

    if (searchQuery) {
      result = result.filter((piece) => {
        const searchLower = searchQuery.toLowerCase();
        return (
          piece.title.toLowerCase().includes(searchLower) ||
          piece.artist.toLowerCase().includes(searchLower)
        );
      });
    }

    if (filters.difficulty && filters.difficulty.length > 0) {
      result = result.filter((p) => filters.difficulty.includes(p.difficulty));
    }
    if (filters.progress && filters.progress.length > 0) {
      result = result.filter((p) => {
        const status = getStatusFromProgress(p.progress);
        return filters.progress.includes(status);
      });
    }

    if (sort.sortBy === "random") {
      result = result.sort(() => Math.random() - 0.5);
    } else if (sort.sortBy === "lastPracticed") {
      result = result.sort((a, b) => {
        const dateA = a.lastPracticed ? new Date(a.lastPracticed) : new Date(0);
        const dateB = b.lastPracticed ? new Date(b.lastPracticed) : new Date(0);
        return dateB - dateA;
      });
    } else if (sort.sortBy === "progress") {
      result = result.sort((a, b) => {
        const statusA = getStatusFromProgress(a.progress);
        const statusB = getStatusFromProgress(b.progress);
        return getStatusValue(statusA) - getStatusValue(statusB);
      });
    } else if (sort.sortBy === "difficulty") {
      result = result.sort(
        (a, b) =>
          getDifficultyValue(a.difficulty) - getDifficultyValue(b.difficulty),
      );
    } else if (sort.sortBy === "title") {
      result = result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort.sortBy === "practiceTime") {
      result = result.sort(
        (a, b) => getTotalPracticeTime(b.id) - getTotalPracticeTime(a.id),
      );
    } else if (sort.sortBy === "trending") {
      // NEU: Trending-Algorithmus mit Gewichtung über 3 Monate
      const now = new Date();
      result = result.sort(
        (a, b) => trendingScore(b, now) - trendingScore(a, now),
      );
    } else if (sort.sortBy === "default") {
      result = result.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB - dateA;
      });
    }

    if (sort.reverse && sort.sortBy !== "random") {
      result = result.reverse();
    }

    return result;
  }, [pieces, searchQuery, filters, sort, practiceSessions]);

  const handleSavePiece = (pieceData) => {
    const isDuplicate = isDuplicateYouTubeUrl(
      pieceData.youtubeUrl,
      editingPiece?.id,
    );

    if (isDuplicate) {
      showToast("This YouTube video already exists!");
      return;
    }

    if (editingPiece) {
      setPieces(
        pieces.map((p) =>
          p.id === editingPiece.id ? { ...p, ...pieceData } : p,
        ),
      );
      showToast("Piece updated!");
    } else {
      const newPiece = {
        id: Date.now().toString(),
        ...pieceData,
        practiceTime: 0,
        lastPracticed: null,
        createdAt: new Date().toISOString(),
      };
      setPieces([...pieces, newPiece]);
      showToast("Piece added!");
    }
    setIsAddModalOpen(false);
    setEditingPiece(null);
  };

  const handleEditPiece = (id) => {
    const piece = pieces.find((p) => p.id === id);
    setEditingPiece(piece);
    setIsAddModalOpen(true);
  };

  const handleOpenYouTube = (url, pieceId) => {
    const piece = pieces.find((p) => p.id === pieceId);
    setYoutubeUrl(url);
    setPracticingPiece(piece);
    setIsYouTubeModalOpen(true);
  };

  const handleSavePracticeTime = (pieceId, seconds, timestamp) => {
    if (pieceId && seconds >= 30) {
      setPracticeSessions((prev) => {
        const pieceLogs = prev[pieceId] || [];
        const updated = [...pieceLogs, { timestamp, duration: seconds }];
        return { ...prev, [pieceId]: updated };
      });

      // Nur noch das letzte Übungsdatum im Piece speichern!
      setPieces((prev) =>
        prev.map((p) =>
          p.id === pieceId ? { ...p, lastPracticed: timestamp } : p,
        ),
      );
      showToast("Practice time saved!");
    } else if (pieceId && seconds > 0) {
      // Update last practiced even for short sessions
      setPieces((prev) =>
        prev.map((p) =>
          p.id === pieceId ? { ...p, lastPracticed: timestamp } : p,
        ),
      );
    }
  };

  const handleUpdateProgress = (pieceId, newProgress) => {
    setPieces((prev) =>
      prev.map((p) => (p.id === pieceId ? { ...p, progress: newProgress } : p)),
    );
    showToast("Progress updated!");
  };

  const handleUpdateDifficulty = (pieceId, newDifficulty) => {
    setPieces((prev) =>
      prev.map((p) =>
        p.id === pieceId ? { ...p, difficulty: newDifficulty } : p,
      ),
    );
  };

  const handleDeleteSession = (pieceId, timestamp) => {
    setPracticeSessions((prev) => {
      const pieceLogs = prev[pieceId] || [];
      const updated = pieceLogs.filter(
        (session) => session.timestamp !== timestamp,
      );
      return { ...prev, [pieceId]: updated };
    });
    showToast("Session deleted!");
  };

  const handleCloseYouTube = () => {
    setIsYouTubeModalOpen(false);
    setYoutubeUrl("");
    setPracticingPiece(null);
  };

  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    showToast("Settings saved!");
  };

  const stats = StatsBar({ pieces, practiceSessions });

  const handlePieceClick = (piece) => {
    handleOpenYouTube(piece.youtubeUrl, piece.id);
  };

  return (
    <div className="App">
      <div className="scroll-container">
        {/* Home View */}
        <div style={{ display: activeTab === "home" ? "block" : "none" }}>
          <HomeView
            pieces={pieces}
            practiceSessions={practiceSessions}
            onNavigate={setActiveTab}
          />
        </div>

        {/* Library View */}
        <div style={{ display: activeTab === "library" ? "block" : "none" }}>
          <Header />
          <div className="container">
            <FilterTabs
              onSearchChange={setSearchQuery}
              onFilterChange={setFilters}
              onSortChange={setSort}
            />
          </div>
          <div className="container">
            {processedPieces.length === 0 ? (
              <EmptyState onAddClick={() => setIsAddModalOpen(true)} />
            ) : (
              <div className="pieces-grid">
                {processedPieces.map((piece) => (
                  <PieceCard
                    key={piece.id}
                    piece={piece}
                    sessions={practiceSessions[piece.id] || []}
                    onEdit={handleEditPiece}
                    onYouTubeClick={handleOpenYouTube}
                  />
                ))}
              </div>
            )}
            {/* Bottom spacer for navigation bar */}
            <div className="bottom-spacer"></div>
          </div>
        </div>

        {/* Practice View */}
        <div style={{ display: activeTab === "practice" ? "block" : "none" }}>
          <PracticeView
            pieces={pieces}
            practiceSessions={practiceSessions}
            onPieceClick={handlePieceClick}
            practiceStreak={stats.practiceStreak}
            onAddPiece={() => setIsAddModalOpen(true)}
            favoritePiecesCount={settings.favoritePiecesCount}
            playlistData={playlistData}
            onPlaylistUpdate={setPlaylistData}
            onOpenSetlists={() => setIsSetlistsOpen(true)}
          />
        </div>

        {/* Stats View */}
        <div style={{ display: activeTab === "stats" ? "block" : "none" }}>
          <StatsView
            pieces={pieces}
            practiceSessions={practiceSessions}
            onDeleteSession={handleDeleteSession}
          />
        </div>

        {/* More View */}
        <div style={{ display: activeTab === "more" ? "block" : "none" }}>
          <MoreView settings={settings} onSaveSettings={handleSaveSettings} />
        </div>
      </div>

      <AddEditModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingPiece(null);
        }}
        onSave={handleSavePiece}
        editingPiece={editingPiece}
      />

      <YouTubeModal
        isOpen={isYouTubeModalOpen}
        onClose={handleCloseYouTube}
        videoUrl={youtubeUrl}
        piece={practicingPiece}
        onSavePracticeTime={handleSavePracticeTime}
        onUpdateProgress={handleUpdateProgress}
        onUpdateDifficulty={handleUpdateDifficulty}
        settings={settings}
      />

      <Settings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />

      <SetlistsView
        isOpen={isSetlistsOpen}
        onClose={() => setIsSetlistsOpen(false)}
        pieces={pieces}
        practiceSessions={practiceSessions}
        setlists={setlists}
        onSetlistsUpdate={setSetlists}
        onPieceClick={(piece) => {
          setIsSetlistsOpen(false);
          handlePieceClick(piece);
        }}
      />

      <Toast
        message={toast.message}
        isVisible={toast.isVisible}
        onHide={hideToast}
      />

      <button
        className={`scroll-to-top ${showScrollTop ? "visible" : ""}`}
        onClick={scrollToTop}
        aria-label="Scroll to top"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 19V5M5 12l7-7 7 7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        disabled={
          isAddModalOpen ||
          isYouTubeModalOpen ||
          isSettingsOpen ||
          isSetlistsOpen
        }
      />
    </div>
  );
}

export default App;
