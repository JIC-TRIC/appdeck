import "./StatsBar.css";
import { formatTime } from "../../utils/youtube";
import { getStatusFromProgress } from "../../App";

// Hilfsfunktion: Prüft ob zwei Daten am selben Tag sind
const isSameDay = (date1, date2) => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

function StatsBar({ pieces, practiceSessions }) {
  // Gelernt = dynamics true (or mastered/memorizing)
  const learned = pieces.filter((p) => {
    const status = getStatusFromProgress(p.progress);
    return (
      status === "learned" || status === "memorizing" || status === "mastered"
    );
  }).length;

  const today = new Date();

  // Zeit heute berechnen (aus allen Sessions aller Stücke)
  const todayTime = Object.values(practiceSessions)
    .flat()
    .filter((log) => isSameDay(new Date(log.timestamp), today))
    .reduce((sum, log) => sum + log.duration, 0);

  // Gesamtzeit berechnen (alle Sessions von allen Stücken)
  const totalTime = Object.values(practiceSessions)
    .flat()
    .reduce((sum, log) => sum + log.duration, 0);

  // Berechne Practice Streak
  const practiceStreak = (() => {
    // Sammle alle einzigartigen Übungstage
    const practiceDays = new Set();
    Object.values(practiceSessions)
      .flat()
      .forEach((session) => {
        const date = new Date(session.timestamp);
        const dateKey = date.toISOString().split("T")[0]; // YYYY-MM-DD
        practiceDays.add(dateKey);
      });

    if (practiceDays.size === 0) return 0;

    // Sortiere Tage
    const sortedDays = Array.from(practiceDays).sort().reverse();

    // Prüfe ob heute geübt wurde
    const todayKey = today.toISOString().split("T")[0];
    const yesterdayKey = new Date(today.getTime() - 86400000)
      .toISOString()
      .split("T")[0];

    // Streak beginnt bei gestern oder heute
    let startDay = sortedDays[0] === todayKey ? todayKey : yesterdayKey;
    if (sortedDays[0] !== todayKey && sortedDays[0] !== yesterdayKey) {
      return 0; // Keine aktuelle Streak
    }

    let streak = 0;
    let currentDay = new Date(startDay);

    // Zähle rückwärts
    while (true) {
      const dayKey = currentDay.toISOString().split("T")[0];
      if (practiceDays.has(dayKey)) {
        streak++;
        currentDay.setDate(currentDay.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  })();

  // Funktion zum Formatieren in Stunden
  const formatHours = (seconds) => {
    const hours = (seconds / 3600).toFixed(1);
    return `${hours}h`;
  };

  return {
    mastered: learned,
    todayTime,
    totalTime,
    practiceStreak,
    statsBar: (
      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-label">Pieces</span>
          <span className="stat-value">{pieces.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Today</span>
          <span className="stat-value">{formatTime(todayTime)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Total</span>
          <span className="stat-value">{formatHours(totalTime)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Learned</span>
          <span className="stat-value">{learned}</span>
        </div>
      </div>
    ),
  };
}

export default StatsBar;
