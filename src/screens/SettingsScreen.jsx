import React, { useMemo, useState } from "react";

export default function SettingsScreen({ state, setState, onBack }) {
  const s = state.settings || {};

  const [tab, setTab] = useState("malzeme"); // malzeme | katsayi | sabit | aksesuar

  // Malzeme fiyatları
  const [mdf, setMdf] = useState(String(s.materialPrices?.MDFLAM ?? 100));
  const [hg, setHg] = useState(String(s.materialPrices?.HGloss ?? 120));
  const [lp, setLp] = useState(String(s.materialPrices?.LakPanel ?? 150));
  const [lake, setLake] = useState(String(s.materialPrices?.Lake ?? 200));

  // ✅ Katsayılar (rekabet için)
  const [kHilton, setKHilton] = useState(String(s.coeffs?.hilton ?? 1));
  const [kSep, setKSep] = useState(String(s.coeffs?.seperator ?? 1));
  const [kTv, setKTv] = useState(String(s.coeffs?.tv ?? 1));

  // Sabit kalemler
  const [door, setDoor] = useState(String(s.doorPrice ?? 12000));
  const [sk, setSk] = useState(String(s.skirtingPricePerMeter ?? 300));

  // Aksesuarlar
  const [accName, setAccName] = useState("");
  const [accPrice, setAccPrice] = useState("");
  const accessories = useMemo(() => s.accessories || [], [s.accessories]);

  function toNum(v) {
    const n = Number(String(v ?? "").replace(",", ".").replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  function clamp(n, min, max) {
    const x = Number(n);
    if (!Number.isFinite(x)) return min;
    return Math.max(min, Math.min(max, x));
  }

  function saveAll() {
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
        coeffs: {
          hilton: clamp(toNum(kHilton), 0.1, 3),
          seperator: clamp(toNum(kSep), 0.1, 3),
          tv: clamp(toNum(kTv), 0.1, 3),
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

  function deleteAccessory(id) {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        accessories: (prev.settings.accessories || []).filter((a) => a.id !== id),
      },
      projects: (prev.projects || []).map((p) => ({
        ...p,
        accessories: (p.accessories || []).filter((x) => x.accessoryId !== id),
      })),
    }));
  }

  function addAccessory() {
    const name = accName.trim();
    const price = toNum(accPrice);
    if (!name || !price) return;
    const id = (crypto?.randomUUID && crypto.randomUUID()) || String(Date.now() + Math.random());

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

  const page = { minHeight: "100vh", background: "#f6f7fb" };
  const wrap = { maxWidth: 560, margin: "0 auto", padding: 16 };
  const card = {
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 18,
    padding: 14,
    background: "#fff",
    boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
  };
  const btn = {
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  };
  const btnPrimary = { ...btn, background: "#111", color: "#fff", border: "1px solid #111" };
  const pill = (active) => ({
    padding: "10px 12px",
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.12)",
    background: active ? "#111" : "#fff",
    color: active ? "#fff" : "#111",
    fontWeight: 950,
    cursor: "pointer",
    whiteSpace: "nowrap",
  });
  const input = {
    padding: 12,
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.14)",
    fontWeight: 900,
    width: "100%",
  };
  const label = { fontSize: 12, fontWeight: 950, color: "#333", marginBottom: 6 };

  return (
    <div style={page}>
      <div style={wrap}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <button onClick={onBack} style={btn}>
            ← Geri
          </button>
          <div style={{ fontWeight: 950 }}>Ayarlar</div>
        </div>

        {/* Sekmeler */}
        <div style={{ display: "flex", gap: 8, marginTop: 12, overflowX: "auto", paddingBottom: 4 }}>
          <button style={pill(tab === "malzeme")} onClick={() => setTab("malzeme")}>
            Malzemeler
          </button>
          <button style={pill(tab === "katsayi")} onClick={() => setTab("katsayi")}>
            Katsayılar
          </button>
          <button style={pill(tab === "sabit")} onClick={() => setTab("sabit")}>
            Sabit Kalem
          </button>
          <button style={pill(tab === "aksesuar")} onClick={() => setTab("aksesuar")}>
            Aksesuarlar
          </button>
        </div>

        {/* Malzemeler */}
        {tab === "malzeme" && (
          <div style={{ ...card, marginTop: 12 }}>
            <div style={{ fontWeight: 950, marginBottom: 10 }}>Malzeme Birim Fiyatları (₺)</div>
            <div style={{ display: "grid", gap: 10 }}>
              <div>
                <div style={label}>MDFLAM</div>
                <input value={mdf} onChange={(e) => setMdf(e.target.value)} style={input} inputMode="decimal" />
              </div>
              <div>
                <div style={label}>High Gloss</div>
                <input value={hg} onChange={(e) => setHg(e.target.value)} style={input} inputMode="decimal" />
              </div>
              <div>
                <div style={label}>Lak Panel</div>
                <input value={lp} onChange={(e) => setLp(e.target.value)} style={input} inputMode="decimal" />
              </div>
              <div>
                <div style={label}>Lake</div>
                <input value={lake} onChange={(e) => setLake(e.target.value)} style={input} inputMode="decimal" />
              </div>
            </div>
          </div>
        )}

        {/* ✅ Katsayılar */}
        {tab === "katsayi" && (
          <div style={{ ...card, marginTop: 12 }}>
            <div style={{ fontWeight: 950, marginBottom: 6 }}>Katsayı Ayarları</div>
            <div style={{ color: "#666", fontSize: 12, fontWeight: 800, lineHeight: 1.5, marginBottom: 10 }}>
              Bu katsayılar sadece ilgili kalemin fiyatını çarpar. (0.1 – 3 arası)
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <div>
                <div style={label}>Hilton katsayısı</div>
                <input value={kHilton} onChange={(e) => setKHilton(e.target.value)} style={input} inputMode="decimal" />
              </div>
              <div>
                <div style={label}>Seperatör katsayısı</div>
                <input value={kSep} onChange={(e) => setKSep(e.target.value)} style={input} inputMode="decimal" />
              </div>
              <div>
                <div style={label}>TV Ünitesi katsayısı</div>
                <input value={kTv} onChange={(e) => setKTv(e.target.value)} style={input} inputMode="decimal" />
              </div>
            </div>
          </div>
        )}

        {/* Sabit */}
        {tab === "sabit" && (
          <div style={{ ...card, marginTop: 12 }}>
            <div style={{ fontWeight: 950, marginBottom: 10 }}>Sabit Kalemler</div>
            <div style={{ display: "grid", gap: 10 }}>
              <div>
                <div style={label}>Kapı birim fiyat (adet)</div>
                <input value={door} onChange={(e) => setDoor(e.target.value)} style={input} inputMode="decimal" />
              </div>
              <div>
                <div style={label}>Süpürgelik (₺/m)</div>
                <input value={sk} onChange={(e) => setSk(e.target.value)} style={input} inputMode="decimal" />
              </div>
            </div>
          </div>
        )}

        {/* Aksesuarlar */}
        {tab === "aksesuar" && (
          <div style={{ ...card, marginTop: 12 }}>
            <div style={{ fontWeight: 950, marginBottom: 10 }}>Aksesuarlar (aktif/pasif + sil)</div>

            <div style={{ display: "grid", gap: 10, marginBottom: 12 }}>
              <div>
                <div style={label}>Yeni aksesuar adı</div>
                <input value={accName} onChange={(e) => setAccName(e.target.value)} style={input} />
              </div>
              <div>
                <div style={label}>Birim fiyat (₺)</div>
                <input value={accPrice} onChange={(e) => setAccPrice(e.target.value)} style={input} inputMode="decimal" />
              </div>
              <button onClick={addAccessory} style={btnPrimary}>
                + Aksesuar Ekle
              </button>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {accessories.map((a) => (
                <div key={a.id} style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: 16, padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 950, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.name}</div>
                      <div style={{ color: "#666", fontSize: 12, fontWeight: 800 }}>
                        {a.isActive ? "Aktif" : "Pasif"} • {a.unitPrice} ₺
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => toggleAccessory(a.id)} style={btn}>
                        {a.isActive ? "Pasif yap" : "Aktif yap"}
                      </button>
                      <button
                        onClick={() => deleteAccessory(a.id)}
                        style={{ ...btn, borderColor: "rgba(220,38,38,0.25)", color: "#b91c1c" }}
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {accessories.length === 0 ? <div style={{ color: "#666", fontWeight: 800 }}>Aksesuar yok.</div> : null}
            </div>
          </div>
        )}

        <button onClick={saveAll} style={{ width: "100%", marginTop: 12, padding: 14, borderRadius: 14, border: 0, background: "#111", color: "#fff", fontWeight: 950 }}>
          Kaydet
        </button>

        <div style={{ height: 24 }} />
      </div>
    </div>
  );
}