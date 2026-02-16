import React, { useMemo, useState } from "react";

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

  // Company info
  const company = s.companyInfo || {};
  const [cName, setCName] = useState(company.name || "");
  const [cAddr, setCAddr] = useState(company.address || "");
  const [cPhone, setCPhone] = useState(company.phone || "");
  const [cEmail, setCEmail] = useState(company.email || "");
  const [logoDataUrl, setLogoDataUrl] = useState(company.logoDataUrl || "");

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

  const card = { border: "1px solid #eee", borderRadius: 16, padding: 14, background: "#fff", boxShadow: "0 6px 18px rgba(0,0,0,0.04)" };

  return (
    <div style={{ minHeight: "100vh", background: "#f6f7fb" }}>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <button onClick={onBack} style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #ddd", background: "#fff", fontWeight: 900 }}>
            ← Geri
          </button>
          <div style={{ fontWeight: 900 }}>Ayarlar</div>
        </div>

        <div style={{ ...card, marginTop: 12 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Malzeme Birim Fiyatları (₺)</div>
          <div style={{ display: "grid", gap: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 900, color: "#333" }}>
              MDFLAM
              <input value={mdf} onChange={(e) => setMdf(e.target.value)} style={{ width: "100%", marginTop: 6, padding: 12, borderRadius: 12, border: "1px solid #ddd" }} />
            </label>
            <label style={{ fontSize: 12, fontWeight: 900, color: "#333" }}>
              High Gloss
              <input value={hg} onChange={(e) => setHg(e.target.value)} style={{ width: "100%", marginTop: 6, padding: 12, borderRadius: 12, border: "1px solid #ddd" }} />
            </label>
            <label style={{ fontSize: 12, fontWeight: 900, color: "#333" }}>
              Lak Panel
              <input value={lp} onChange={(e) => setLp(e.target.value)} style={{ width: "100%", marginTop: 6, padding: 12, borderRadius: 12, border: "1px solid #ddd" }} />
            </label>
            <label style={{ fontSize: 12, fontWeight: 900, color: "#333" }}>
              Lake
              <input value={lake} onChange={(e) => setLake(e.target.value)} style={{ width: "100%", marginTop: 6, padding: 12, borderRadius: 12, border: "1px solid #ddd" }} />
            </label>
          </div>
        </div>

        <div style={{ ...card, marginTop: 12 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Sabit Kalemler</div>
          <div style={{ display: "grid", gap: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 900, color: "#333" }}>
              Kapı birim fiyat (adet)
              <input value={door} onChange={(e) => setDoor(e.target.value)} style={{ width: "100%", marginTop: 6, padding: 12, borderRadius: 12, border: "1px solid #ddd" }} />
            </label>
            <label style={{ fontSize: 12, fontWeight: 900, color: "#333" }}>
              Süpürgelik (₺/m)
              <input value={sk} onChange={(e) => setSk(e.target.value)} style={{ width: "100%", marginTop: 6, padding: 12, borderRadius: 12, border: "1px solid #ddd" }} />
            </label>
          </div>
        </div>

        <div style={{ ...card, marginTop: 12 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Şirket Bilgileri (Teklif Üst Bilgi)</div>

          <div style={{ display: "grid", gap: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 900, color: "#333" }}>
              Şirket adı
              <input value={cName} onChange={(e) => setCName(e.target.value)} style={{ width: "100%", marginTop: 6, padding: 12, borderRadius: 12, border: "1px solid #ddd" }} />
            </label>

            <label style={{ fontSize: 12, fontWeight: 900, color: "#333" }}>
              Adres
              <input value={cAddr} onChange={(e) => setCAddr(e.target.value)} style={{ width: "100%", marginTop: 6, padding: 12, borderRadius: 12, border: "1px solid #ddd" }} />
            </label>

            <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr" }}>
              <label style={{ fontSize: 12, fontWeight: 900, color: "#333" }}>
                Telefon
                <input value={cPhone} onChange={(e) => setCPhone(e.target.value)} style={{ width: "100%", marginTop: 6, padding: 12, borderRadius: 12, border: "1px solid #ddd" }} />
              </label>

              <label style={{ fontSize: 12, fontWeight: 900, color: "#333" }}>
                E-posta
                <input value={cEmail} onChange={(e) => setCEmail(e.target.value)} style={{ width: "100%", marginTop: 6, padding: 12, borderRadius: 12, border: "1px solid #ddd" }} />
              </label>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <label style={{ fontSize: 12, fontWeight: 900, color: "#333" }}>
                Logo yükle
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onPickLogo(e.target.files?.[0])}
                  style={{ display: "block", marginTop: 6 }}
                />
              </label>

              <div style={{ width: 120, height: 56, borderRadius: 12, border: "1px solid #eee", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {logoDataUrl ? <img src={logoDataUrl} alt="logo" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} /> : <div style={{ fontSize: 12, color: "#999", fontWeight: 900 }}>LOGO</div>}
              </div>

              {logoDataUrl ? (
                <button
                  onClick={() => setLogoDataUrl("")}
                  style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #ddd", background: "#fff", fontWeight: 900 }}
                >
                  Logoyu kaldır
                </button>
              ) : null}
            </div>
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
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => toggleAccessory(a.id)} style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #ddd", background: "#fff", fontWeight: 900 }}>
                      {a.isActive ? "Pasif yap" : "Aktif yap"}
                    </button>
                    <button onClick={() => deleteAccessory(a.id)} style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #fee2e2", background: "#fff", fontWeight: 900, color: "#b91c1c" }}>
                      Sil
                    </button>
                  </div>
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