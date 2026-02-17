import React, { useMemo, useState } from "react";

export default function SettingsScreen({ state, setState, onBack }) {
  const s = state.settings || {};

  // ---------- Font / UI ----------
  const FONT =
    'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif';

  const page = { minHeight: "100vh", background: "#f6f7fb", fontFamily: FONT, color: "#0f172a" };
  const wrap = { maxWidth: 580, margin: "0 auto", padding: 16 };
  const card = {
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 18,
    padding: 14,
    background: "#fff",
    boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
  };

  const topBtn = {
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "#fff",
    fontWeight: 900,
    cursor: "pointer",
    fontFamily: FONT,
  };

  const label = { fontSize: 12.5, fontWeight: 950, color: "#0f172a" };
  const input = {
    width: "100%",
    marginTop: 6,
    padding: 12,
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.14)",
    background: "#fff",
    fontWeight: 900,
    fontSize: 14,
    outline: "none",
    fontFamily: FONT,
  };

  const btnPrimary = {
    padding: 12,
    borderRadius: 14,
    border: "1px solid #111",
    background: "#111",
    color: "#fff",
    fontWeight: 950,
    cursor: "pointer",
    fontFamily: FONT,
  };

  const btnGhost = {
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "#fff",
    fontWeight: 950,
    cursor: "pointer",
    fontFamily: FONT,
  };

  // ---------- Helpers ----------
  function toNum(v) {
    const n = Number(String(v ?? "").replace(",", ".").replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }

  // ---------- Material prices ----------
  const [mdf, setMdf] = useState(String(s.materialPrices?.MDFLAM ?? 100));
  const [hg, setHg] = useState(String(s.materialPrices?.HGloss ?? 120));
  const [lp, setLp] = useState(String(s.materialPrices?.LakPanel ?? 150));
  const [lake, setLake] = useState(String(s.materialPrices?.Lake ?? 200));

  // ---------- Fixed items ----------
  const [door, setDoor] = useState(String(s.doorPrice ?? 12000));
  const [sk, setSk] = useState(String(s.skirtingPricePerMeter ?? 300));

  // ---------- Coefficients (KATSAYI / ÇARPAN) ----------
  // İsteğin: Hilton / TV / Seperatör ayarlanabilir olsun (varsayılan 2)
  const coeff = s.coefficients || {};
  const [kHilton, setKHilton] = useState(String(coeff.hilton ?? 2));
  const [kTv, setKTv] = useState(String(coeff.tv ?? 2));
  const [kSep, setKSep] = useState(String(coeff.seperator ?? 2));
  // Coffee da dursun (istersen UI’dan kaldırırız) — varsayılan 1
  const [kCoffee, setKCoffee] = useState(String(coeff.coffee ?? 1));

  // ---------- Accessories ----------
  const [accName, setAccName] = useState("");
  const [accPrice, setAccPrice] = useState("");
  const accessories = useMemo(() => s.accessories || [], [s.accessories]);

  // ---------- Company info ----------
  const company = s.companyInfo || {};
  const [cName, setCName] = useState(company.name || "");
  const [cAddr, setCAddr] = useState(company.address || "");
  const [cPhone, setCPhone] = useState(company.phone || "");
  const [cEmail, setCEmail] = useState(company.email || "");
  const [logoDataUrl, setLogoDataUrl] = useState(company.logoDataUrl || "");

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

        // ✅ katsayılar burada kaydediliyor
        coefficients: {
          hilton: toNum(kHilton) || 0,
          tv: toNum(kTv) || 0,
          seperator: toNum(kSep) || 0,
          coffee: toNum(kCoffee) || 0,
        },

        doorPrice: toNum(door),
        skirtingPricePerMeter: toNum(sk),

        companyInfo: {
          name: String(cName || "").trim(),
          address: String(cAddr || "").trim(),
          phone: String(cPhone || "").trim(),
          email: String(cEmail || "").trim(),
          logoDataUrl: logoDataUrl || "",
        },
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

  async function onPickLogo(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogoDataUrl(String(reader.result || ""));
    reader.readAsDataURL(file);
  }

  return (
    <div style={page}>
      <div style={wrap}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <button onClick={onBack} style={topBtn}>
            ← Geri
          </button>
          <div style={{ fontWeight: 950, fontSize: 16 }}>Ayarlar</div>
        </div>

        {/* MALZEME */}
        <div style={{ ...card, marginTop: 12 }}>
          <div style={{ fontWeight: 950, marginBottom: 10, fontSize: 14 }}>Malzeme Birim Fiyatları (₺)</div>
          <div style={{ display: "grid", gap: 10 }}>
            <label style={label}>
              MDFLAM
              <input value={mdf} onChange={(e) => setMdf(e.target.value)} style={input} inputMode="decimal" />
            </label>
            <label style={label}>
              High Gloss
              <input value={hg} onChange={(e) => setHg(e.target.value)} style={input} inputMode="decimal" />
            </label>
            <label style={label}>
              Lak Panel
              <input value={lp} onChange={(e) => setLp(e.target.value)} style={input} inputMode="decimal" />
            </label>
            <label style={label}>
              Lake
              <input value={lake} onChange={(e) => setLake(e.target.value)} style={input} inputMode="decimal" />
            </label>
          </div>
        </div>

        {/* KATSAYILAR */}
        <div style={{ ...card, marginTop: 12 }}>
          <div style={{ fontWeight: 950, marginBottom: 8, fontSize: 14 }}>Katsayılar (Çarpan)</div>
          <div style={{ fontSize: 12.5, color: "#475569", fontWeight: 800, lineHeight: 1.4 }}>
            Hilton / TV Ünitesi / Seperatör (ve istersen Kahve Köşesi) fiyatlarını çarpanla artırıp azaltır.
            <br />
            Örn: <b>2</b> girersen ilgili kalemin fiyatı 2x olur.
          </div>

          <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <label style={label}>
                Hilton katsayı
                <input value={kHilton} onChange={(e) => setKHilton(e.target.value)} style={input} inputMode="decimal" />
              </label>
              <label style={label}>
                TV Ünitesi katsayı
                <input value={kTv} onChange={(e) => setKTv(e.target.value)} style={input} inputMode="decimal" />
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <label style={label}>
                Seperatör katsayı
                <input value={kSep} onChange={(e) => setKSep(e.target.value)} style={input} inputMode="decimal" />
              </label>
              <label style={label}>
                Kahve Köşesi katsayı
                <input value={kCoffee} onChange={(e) => setKCoffee(e.target.value)} style={input} inputMode="decimal" />
              </label>
            </div>
          </div>
        </div>

        {/* SABİT KALEMLER */}
        <div style={{ ...card, marginTop: 12 }}>
          <div style={{ fontWeight: 950, marginBottom: 10, fontSize: 14 }}>Sabit Kalemler</div>
          <div style={{ display: "grid", gap: 10 }}>
            <label style={label}>
              Kapı birim fiyat (adet)
              <input value={door} onChange={(e) => setDoor(e.target.value)} style={input} inputMode="decimal" />
            </label>
            <label style={label}>
              Süpürgelik (₺/m)
              <input value={sk} onChange={(e) => setSk(e.target.value)} style={input} inputMode="decimal" />
            </label>
          </div>
        </div>

        {/* ŞİRKET */}
        <div style={{ ...card, marginTop: 12 }}>
          <div style={{ fontWeight: 950, marginBottom: 10, fontSize: 14 }}>Şirket Bilgileri (Teklif Üst Bilgi)</div>

          <div style={{ display: "grid", gap: 10 }}>
            <label style={label}>
              Şirket adı
              <input value={cName} onChange={(e) => setCName(e.target.value)} style={input} />
            </label>

            <label style={label}>
              Adres
              <input value={cAddr} onChange={(e) => setCAddr(e.target.value)} style={input} />
            </label>

            <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
              <label style={label}>
                Telefon
                <input value={cPhone} onChange={(e) => setCPhone(e.target.value)} style={input} />
              </label>

              <label style={label}>
                E-posta
                <input value={cEmail} onChange={(e) => setCEmail(e.target.value)} style={input} />
              </label>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <label style={label}>
                Logo yükle
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onPickLogo(e.target.files?.[0])}
                  style={{ display: "block", marginTop: 6, fontFamily: FONT }}
                />
              </label>

              <div
                style={{
                  width: 128,
                  height: 60,
                  borderRadius: 14,
                  border: "1px solid rgba(0,0,0,0.10)",
                  background: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {logoDataUrl ? (
                  <img src={logoDataUrl} alt="logo" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                ) : (
                  <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 950 }}>LOGO</div>
                )}
              </div>

              {logoDataUrl ? (
                <button onClick={() => setLogoDataUrl("")} style={btnGhost}>
                  Logoyu kaldır
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* AKSESUAR */}
        <div style={{ ...card, marginTop: 12 }}>
          <div style={{ fontWeight: 950, marginBottom: 10, fontSize: 14 }}>Aksesuarlar (aktif/pasif)</div>

          <div style={{ display: "grid", gap: 10, marginBottom: 12 }}>
            <input
              value={accName}
              onChange={(e) => setAccName(e.target.value)}
              placeholder="Yeni aksesuar adı"
              style={input}
            />
            <input
              value={accPrice}
              onChange={(e) => setAccPrice(e.target.value)}
              placeholder="Birim fiyat (₺)"
              style={input}
              inputMode="decimal"
            />
            <button onClick={addAccessory} style={btnPrimary}>
              + Aksesuar Ekle
            </button>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {accessories.map((a) => (
              <div key={a.id} style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: 16, padding: 12, background: "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: 950, fontSize: 14 }}>{a.name}</div>
                    <div style={{ color: "#475569", fontSize: 12.5, fontWeight: 800, marginTop: 2 }}>
                      {a.isActive ? "Aktif" : "Pasif"} • {a.unitPrice} ₺
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button onClick={() => toggleAccessory(a.id)} style={btnGhost}>
                      {a.isActive ? "Pasif yap" : "Aktif yap"}
                    </button>
                    <button
                      onClick={() => deleteAccessory(a.id)}
                      style={{
                        ...btnGhost,
                        border: "1px solid rgba(220,38,38,0.22)",
                        color: "#b91c1c",
                      }}
                    >
                      Sil
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={save} style={{ width: "100%", marginTop: 12, padding: 14, borderRadius: 16, border: 0, background: "#111", color: "#fff", fontWeight: 950, fontFamily: FONT, cursor: "pointer" }}>
          Kaydet
        </button>

        <div style={{ height: 24 }} />
      </div>
    </div>
  );
}