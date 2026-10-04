import { useMemo } from "react";
import "./PracticeCalendar.css";

function PracticeCalendar({ practiceSessions }) {
  const { weeks, monthLabels } = useMemo(() => {
    const dayMap = {};
    Object.values(practiceSessions || {})
      .flat()
      .forEach((session) => {
        const d = new Date(session.timestamp);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        dayMap[key] = (dayMap[key] || 0) + (session.duration || 0);
      });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDay = new Date(today);
    startDay.setDate(startDay.getDate() - 363);
    startDay.setDate(startDay.getDate() - startDay.getDay());

    const allWeeks = [];
    const labels = [];
    const current = new Date(startDay);
    let lastMonth = -1;

    while (current <= today || allWeeks.length === 0) {
      const week = [];
      const weekStart = new Date(current);
      for (let d = 0; d < 7; d++) {
        const cellDate = new Date(current);
        if (cellDate > today) {
          week.push(null);
        } else {
          const key = `${cellDate.getFullYear()}-${String(cellDate.getMonth() + 1).padStart(2, "0")}-${String(cellDate.getDate()).padStart(2, "0")}`;
          week.push({ date: key, seconds: dayMap[key] || 0 });
        }
        current.setDate(current.getDate() + 1);
      }
      const m = weekStart.getMonth();
      if (m !== lastMonth) {
        labels.push({
          index: allWeeks.length,
          label: weekStart.toLocaleString("en-US", { month: "short" }),
        });
        lastMonth = m;
      }
      allWeeks.push(week);
    }

    return { weeks: allWeeks, monthLabels: labels };
  }, [practiceSessions]);

  const getLevel = (seconds) => {
    if (seconds === 0) return 0;
    if (seconds <= 300) return 1;
    if (seconds <= 900) return 2;
    if (seconds <= 1800) return 3;
    if (seconds <= 3600) return 4;
    return 5;
  };

  const formatTooltip = (cell) => {
    if (!cell) return "";
    if (cell.seconds === 0) return `${cell.date}: No practice`;
    const m = Math.floor(cell.seconds / 60);
    if (m < 60) return `${cell.date}: ${m}m`;
    return `${cell.date}: ${Math.floor(m / 60)}h ${m % 60}m`;
  };

  const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];

  return (
    <div className="heatmap-section">
      <h2 className="section-title">Practice Calendar</h2>
      <div className="heatmap-wrapper">
        <div className="heatmap-months">
          <div className="heatmap-day-spacer" />
          {weeks.map((_, i) => {
            const label = monthLabels.find((l) => l.index === i);
            return (
              <div key={i} className="heatmap-month-cell">
                {label ? label.label : ""}
              </div>
            );
          })}
        </div>
        <div className="heatmap-body">
          <div className="heatmap-day-labels">
            {dayLabels.map((l, i) => (
              <div key={i} className="heatmap-day-label">
                {l}
              </div>
            ))}
          </div>
          <div className="heatmap-grid">
            {weeks.map((week, wi) => (
              <div key={wi} className="heatmap-col">
                {week.map((cell, di) => (
                  <div
                    key={di}
                    className={`heatmap-cell ${cell ? `level-${getLevel(cell.seconds)}` : "empty"}`}
                    title={formatTooltip(cell)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="heatmap-legend">
          <span className="legend-label">Less</span>
          <div className="heatmap-cell level-0" />
          <div className="heatmap-cell level-1" />
          <div className="heatmap-cell level-2" />
          <div className="heatmap-cell level-3" />
          <div className="heatmap-cell level-4" />
          <div className="heatmap-cell level-5" />
          <span className="legend-label">More</span>
        </div>
      </div>
    </div>
  );
}

export default PracticeCalendar;
