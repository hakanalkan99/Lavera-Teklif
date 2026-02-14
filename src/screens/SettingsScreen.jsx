import { useState } from "react";

export default function SettingsScreen({ state, setState, onBack }) {
  const [lakePrice, setLakePrice] = useState(
    state.settings.materialPrices?.Lake || 10000
  );

  function save() {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        materialPrices: {
          ...prev.settings.materialPrices,
          Lake: Number(lakePrice),
        },
      },
    }));
    onBack();
  }

  return (
    <div style={{ padding: 16, maxWidth: 520, margin: "0 auto" }}>
      <h2>Ayarlar</h2>

      <div style={{ marginTop: 20 }}>
        <label>Lake Birim Fiyatı</label>
        <input
          type="number"
          value={lakePrice}
          onChange={(e) => setLakePrice(e.target.value)}
          style={{
            padding: 10,
            borderRadius: 10,
            border: "1px solid #ddd",
            width: "100%",
            marginTop: 6,
          }}
        />
      </div>

      <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
        <button onClick={onBack}>Geri</button>
        <button onClick={save}>Kaydet</button>
      </div>
    </div>
  );
}