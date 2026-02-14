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
        accessories: (prev.settings.accessories || []).map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a)),
      },
    }));
  }

  function addAccessory() {
    const name = accName.trim();
    const price = toNum(accPrice);
    if (!name || !price) return;
    const id = (crypto.randomUUID && crypto.randomUUID()) || String(Date.now() + Math.random());

    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        accessories: [{ id, name, unitPrice: price, isActive: true }, ...(prev.settings.accessories || [])],
      },
    }));

    setAccName("");
    setAccPrice("");
  }

  const card = { border: "1px solid #eee", borderRadius: 16, padding: 14, background: "#fff", boxShadow: "0 6px 18px rgba(0,0,0,0.04)" };

  return (
    <div style={{ minHeight: "100vh", background: "#f6f7fb" }}>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <button onClick={onBack} style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #ddd", background: "#fff" }}>
            ← Geri
          </button>
          <div style={{ fontWeight: 900 }}>Ayarlar</div>
        </div>

        <div style={{ ...card, marginTop: 12 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Malzeme Birim Fiyatları</div>
          <div style={{ display: "grid", gap: 8 }}>
            <input value={mdf} onChange={(e) => setMdf(e.target.value)} placeholder="MDFLAM" style={{ padding: 12, borderRadius: 12, border: "1px solid #ddd" }} />
            <input value={hg} onChange={(e) => setHg(e.target.value)} placeholder="High Gloss" style={{ padding: 12, borderRadius: 12, border: "1px solid #ddd" }} />
            <input value={lp} onChange={(e) => setLp(e.target.value)} placeholder="Lak Panel" style={{ padding: 12, borderRadius: 12, border: "1px solid #ddd" }} />
            <input value={lake} onChange={(e) => setLake(e.target.value)} placeholder="Lake" style={{ padding: 12, borderRadius: 12, border: "1px solid #ddd" }} />
          </div>
        </div>

        <div style={{ ...card, marginTop: 12 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Sabit Kalemler</div>
          <div style={{ display: "grid", gap: 8 }}>
            <input value={door} onChange={(e) => setDoor(e.target.value)} placeholder="Kapı birim fiyat (adet)" style={{ padding: 12, borderRadius: 12, border: "1px solid #ddd" }} />
            <input value={sk} onChange={(e) => setSk(e.target.value)} placeholder="Süpürgelik (₺/m)" style={{ padding: 12, borderRadius: 12, border: "1px solid #ddd" }} />
          </div>
        </div>

        <div style={{ ...card, marginTop: 12 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Aksesuarlar (aktif/pasif)</div>

          <div style={{ display: "grid", gap: 8, marginBottom: 10 }}>
            <input value={accName} onChange={(e) => setAccName(e.target.value)} placeholder="Yeni aksesuar adı" style={{ padding: 12, borderRadius: 12, border: "1px solid #ddd" }} />
            <input value={accPrice} onChange={(e) => setAccPrice(e.target.value)} placeholder="Birim fiyat (₺)" style={{ padding: 12, borderRadius: 12, border: "1px solid #ddd" }} />
            <button onClick={addAccessory} style={{ padding: 12, borderRadius: 12, border: 0, background: "#111", color: "#fff", fontWeight: 900 }}>
              + Aksesuar Ekle
            </button>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {accessories.map((a) => (
              <div key={a.id} style={{ border: "1px solid #eee", borderRadius: 14, padding: 12, background: "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 900 }}>{a.name}</div>
                    <div style={{ color: "#666", fontSize: 12 }}>{a.isActive ? "Aktif" : "Pasif"} • {a.unitPrice} ₺</div>
                  </div>
                  <button onClick={() => toggleAccessory(a.id)} style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #ddd", background: "#fff", fontWeight: 900 }}>
                    {a.isActive ? "Pasif yap" : "Aktif yap"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={save} style={{ width: "100%", marginTop: 12, padding: 14, borderRadius: 14, border: 0, background: "#111", color: "#fff", fontWeight: 900 }}>
          Kaydet
        </button>

        <div style={{ height: 24 }} />
      </div>
    </div>
  );
}