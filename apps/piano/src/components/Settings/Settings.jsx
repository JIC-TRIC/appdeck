import { useState, useEffect } from "react";
import "./Settings.css";
import { VERSION } from "../../version";
import { exportSnapshot, readBackup, restoreBackup } from "../../storage";

function Settings({ isOpen, onClose, settings, onSaveSettings }) {
  const [localSettings, setLocalSettings] = useState(settings);

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

  const handleToggle = (key) => {
    setLocalSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    onSaveSettings(localSettings);
    onClose();
  };

  const handleExportData = () => {
    try {
      // Sammle alle relevanten Daten aus dem Speicher
      const data = exportSnapshot();

      // Erstelle Blob und Download
      const dataStr = JSON.stringify(data, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `piano-tracker-backup-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export data. Please try again.");
    }
  };

  const handleImportData = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        // Validiert die Datenstruktur
        const data = readBackup(e.target?.result);

        // Frage Benutzer ob Daten überschrieben werden sollen
        if (confirm("This will replace all current data. Continue?")) {
          restoreBackup(data);

          alert("Data imported successfully! The page will reload.");
          window.location.reload();
        }
      } catch (error) {
        console.error("Import failed:", error);
        alert("Failed to import data. Please check the file format.");
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div className={`modal ${isOpen ? "active" : ""}`}>
      <div className="modal-content settings-modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Settings</h2>
        </div>

        <div className="settings-list">
          {/* Version Display */}
          <div className="version-display">
            <span className="version-label">Version:</span>
            <span className="version-number">{VERSION}</span>
          </div>

          <div className="settings-separator"></div>
          <div className="setting-item">
            <div className="setting-info">
              <h3 className="setting-title">External YouTube Button</h3>
              <p className="setting-description">
                Show button to open videos directly on YouTube (ad-free with
                Premium)
              </p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={localSettings.showExternalYouTubeButton}
                onChange={() => handleToggle("showExternalYouTubeButton")}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-section">
            <h3 className="section-title">Data Backup</h3>
            <p className="section-description">
              Export your data to create a backup or import a previous backup
            </p>

            <div className="backup-buttons">
              <button
                className="btn-backup export-btn"
                onClick={handleExportData}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Export Backup
              </button>

              <label className="btn-backup import-btn">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Import Backup
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  style={{ display: "none" }}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;
