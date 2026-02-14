import React from "react";
import type { PersistedState } from "../core/types";

export default function SettingsScreen({
  state,
  setState,
  onBack,
}: {
  state: PersistedState;
  setState: React.Dispatch<React.SetStateAction<PersistedState>>;
  onBack: () => void;
}) {
  function exportBackup() {
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `lavera-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();

    URL.revokeObjectURL(url);
  }

  function importBackup(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (parsed.projects && parsed.settings) {
          setState(parsed);
          alert("Yedek başarıyla yüklendi.");
        } else {
          alert("Geçersiz yedek dosyası.");
        }
      } catch {
        alert("Dosya okunamadı.");
      }
    };

    reader.readAsText(file);
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Ayarlar</h2>

      <button onClick={onBack} style={{ marginBottom: 20 }}>
        ← Geri
      </button>

      <div style={{ marginBottom: 20 }}>
        <button onClick={exportBackup}>
          📥 Yedek Al (JSON indir)
        </button>
      </div>

      <div>
        <label style={{ cursor: "pointer" }}>
          📤 Yedek Yükle
          <input
            type="file"
            accept="application/json"
            style={{ display: "none" }}
            onChange={importBackup}
          />
        </label>
      </div>
    </div>
  );
}