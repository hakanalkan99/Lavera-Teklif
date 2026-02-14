import { useMemo, useState } from "react";

export default function SettingsScreen({ state, setState, onBack }) {
  const s = state.settings;

  const [mdf, setMdf] = useState(String(s.materialPrices?.MDFLAM ?? 100));
  const [hg, setHg] = useState(String(s.materialPrices?.HGloss ?? 120));
  const [lp, setLp] = useState(String(s.materialPrices?.LakPanel ?? 150));
  const [lake, setLake] = useState(String(s.materialPrices?.Lake ?? 200));

  const [door, setDoor] = useState(String(s.doorPrice ?? 12000));
  const [sk, setSk] = useState(String(s.skirtingPricePerMeter ?? 300));

  const [accName, setAccName] = useState("");
  const [accPrice, setAccPrice] = useState("");

  const accessories = useMemo(() => s.accessories || [], [s.accessories]);

  function toNum(v) {
    const n = Number(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }

  function save() {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        materialPrices: {
          MDFLAM: toNum(mdf),
          HGloss: toNum(hg),
          LakPanel: toNum(lp),
          Lake: toNum(lake),
        },
        doorPrice: toNum(door),
        skirtingPricePerMeter: toNum(sk),
      },
    }));
    onBack();
  }

  function toggleAccessory(id) {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        accessories: prev.settings.accessories.map((a) =>
          a.id === id ? { ...a, isActive: !a.isActive } : a
        ),
      },
    }));
  }

  function deleteAccessory(id) {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        accessories: prev.settings.accessories.filter((a) => a.id !== id),
      },
    }));
  }

  function addAccessory() {
    const name = accName.trim();
    const price = toNum(accPrice);
    if (!name || !price) return;

    const id =
      (crypto.randomUUID && crypto.randomUUID()) ||
      String(Date.now() + Math.random());

    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        accessories: [
          { id, name, unitPrice: price, isActive: true },
          ...prev.settings.accessories,
        ],
      },
    }));

    setAccName("");
    setAccPrice("");
  }

  const card = {
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 16,
    background: "#ffffff",
    boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
  };

  const input = {
    padding: 12,
    borderRadius: 12,
    border: "1px solid #ddd",
    width: "100%",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6" }}>
      <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button onClick={onBack}>← Geri</button>
          <h2>Ayarlar</h2>
        </div>

        {/* MALZEMELER */}
        <div style={{ ...card, marginTop: 16 }}>
          <h3>Malzeme Birim Fiyatları (₺ / metre)</h3>
          <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
            <div>
              <label>MDFLAM</label>
              <input value={mdf} onChange={(e) => setMdf(e.target.value)} style={input} />
            </div>
            <div>
              <label>High Gloss</label>
              <input value={hg} onChange={(e) => setHg(e.target.value)} style={input} />
            </div>
            <div>
              <label>Lak Panel</label>
              <input value={lp} onChange={(e) => setLp(e.target.value)} style={input} />
            </div>
            <div>
              <label>Lake</label>
              <input value={lake} onChange={(e) => setLake(e.target.value)} style={input} />
            </div>
          </div>
        </div>

        {/* SABİT KALEMLER */}
        <div style={{ ...card, marginTop: 16 }}>
          <h3>Sabit Kalemler</h3>
          <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
            <div>
              <label>Kapı (adet fiyat)</label>
              <input value={door} onChange={(e) => setDoor(e.target.value)} style={input} />
            </div>
            <div>
              <label>Süpürgelik (₺ / metre)</label>
              <input value={sk} onChange={(e) => setSk(e.target.value)} style={input} />
            </div>
          </div>
        </div>

        {/* AKSESUARLAR */}
        <div style={{ ...card, marginTop: 16 }}>
          <h3>Aksesuarlar</h3>

          <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
            <input
              placeholder="Yeni aksesuar adı"
              value={accName}
              onChange={(e) => setAccName(e.target.value)}
              style={input}
            />
            <input
              placeholder="Birim fiyat (₺)"
              value={accPrice}
              onChange={(e) => setAccPrice(e.target.value)}
              style={input}
            />
            <button onClick={addAccessory}>+ Aksesuar Ekle</button>
          </div>

          <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
            {accessories.map((a) => (
              <div key={a.id} style={{ border: "1px solid #eee", padding: 12, borderRadius: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <strong>{a.name}</strong>
                    <div style={{ fontSize: 12, color: "#666" }}>
                      {a.unitPrice} ₺ • {a.isActive ? "Aktif" : "Pasif"}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => toggleAccessory(a.id)}>
                      {a.isActive ? "Pasif yap" : "Aktif yap"}
                    </button>
                    <button
                      onClick={() => deleteAccessory(a.id)}
                      style={{ background: "#dc2626", color: "#fff" }}
                    >
                      Sil
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={save}
          style={{
            marginTop: 20,
            width: "100%",
            padding: 14,
            borderRadius: 14,
            border: 0,
            background: "#111",
            color: "#fff",
            fontWeight: 700,
          }}
        >
          Kaydet
        </button>
      </div>
    </div>
  );
}