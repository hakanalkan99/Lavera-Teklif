import { useMemo, useState } from "react";

const LS_OK_KEY = "lavera_auth_ok_v1";
const LS_CREDS_KEY = "lavera_auth_creds_v1";

function loadCreds() {
  try {
    const raw = localStorage.getItem(LS_CREDS_KEY);
    if (!raw) return { user: "lavera", pass: "1234" };
    const parsed = JSON.parse(raw);
    return {
      user: String(parsed?.user ?? "lavera"),
      pass: String(parsed?.pass ?? "1234"),
    };
  } catch {
    return { user: "lavera", pass: "1234" };
  }
}

export default function SettingsScreen({ state, setState, onBack }) {
  const s = state.settings;

  // Malzeme fiyatları
  const [mdf, setMdf] = useState(String(s.materialPrices?.MDFLAM ?? 100));
  const [hg, setHg] = useState(String(s.materialPrices?.HGloss ?? 120));
  const [lp, setLp] = useState(String(s.materialPrices?.LakPanel ?? 150));
  const [lake, setLake] = useState(String(s.materialPrices?.Lake ?? 200));

  // Sabit kalemler
  const [door, setDoor] = useState(String(s.doorPrice ?? 12000));
  const [sk, setSk] = useState(String(s.skirtingPricePerMeter ?? 300));

  // Aksesuar ekleme
  const [accName, setAccName] = useState("");
  const [accPrice, setAccPrice] = useState("");

  const accessories = useMemo(() => s.accessories || [], [s.accessories]);

  // Giriş bilgileri
  const initialCreds = useMemo(() => loadCreds(), []);
  const [loginUser, setLoginUser] = useState(initialCreds.user);
  const [loginPass, setLoginPass] = useState(initialCreds.pass);
  const [loginMsg, setLoginMsg] = useState("");

  function toNum(v) {
    const n = Number(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }

  function savePrices() {
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
  }

  function toggleAccessory(id) {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        accessories: (prev.settings.accessories || []).map((a) =>
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
        accessories: (prev.settings.accessories || []).filter((a) => a.id !== id),
      },
      // projelerdeki aynı aksesuarı da temizleyelim (boş kalmasın)
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

    const id =
      (crypto?.randomUUID && crypto.randomUUID()) ||
      String(Date.now() + Math.random());

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

  function saveLoginCreds() {
    setLoginMsg("");
    const u = loginUser.trim();
    const p = String(loginPass);

    if (!u || !p) {
      setLoginMsg("Kullanıcı adı ve şifre boş olamaz.");
      return;
    }

    try {
      localStorage.setItem(LS_CREDS_KEY, JSON.stringify({ user: u, pass: p }));
      // herkesin tekrar giriş yapmasını istersen bunu aç:
      localStorage.removeItem(LS_OK_KEY);
    } catch {}

    setLoginMsg("Kaydedildi ✅ (Tekrar giriş istenebilir)");
  }

  const card = {
    border: "1px solid #eee",
    borderRadius: 16,
    padding: 14,
    background: "#fff",
    boxShadow: "0 6px 18px rgba(0,0,0,0.04)",
  };

  function saveAllAndBack() {
    savePrices();
    onBack();
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f6f7fb" }}>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <button
            onClick={onBack}
            style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #ddd", background: "#fff" }}
          >
            ← Geri
          </button>
          <div style={{ fontWeight: 900 }}>Ayarlar</div>
        </div>

        {/* Giriş Bilgileri */}
        <div style={{ ...card, marginTop: 12 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Giriş (Kullanıcı / Şifre)</div>

          <div style={{ display: "grid", gap: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 800, color: "#333" }}>Kullanıcı adı</label>
            <input
              value={loginUser}
              onChange={(e) => setLoginUser(e.target.value)}
              placeholder="örn: lavera"
              style={{ padding: 12, borderRadius: 12, border: "1px solid #ddd" }}
            />

            <label style={{ fontSize: 12, fontWeight: 800, color: "#333" }}>Şifre</label>
            <input
              value={loginPass}
              onChange={(e) => setLoginPass(e.target.value)}
              placeholder="yeni şifre"
              type="password"
              style={{ padding: 12, borderRadius: 12, border: "1px solid #ddd" }}
            />

            <button
              onClick={saveLoginCreds}
              style={{ padding: 12, borderRadius: 12, border: 0, background: "#111", color: "#fff", fontWeight: 900 }}
            >
              Giriş Bilgilerini Kaydet
            </button>

            {loginMsg ? <div style={{ fontSize: 13, fontWeight: 800, color: "#0b7a2a" }}>{loginMsg}</div> : null}

            <div style={{ fontSize: 12, color: "#666" }}>
              Not: Kaydedince otomatik olarak tekrar giriş isteyebilir (güvenlik için).
            </div>
          </div>
        </div>

        {/* Malzeme Birim Fiyatları */}
        <div style={{ ...card, marginTop: 12 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Malzeme Birim Fiyatları</div>

          <div style={{ display: "grid", gap: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 800, color: "#333" }}>MDFLAM</label>
            <input value={mdf} onChange={(e) => setMdf(e.target.value)} style={{ padding: 12, borderRadius: 12, border: "1px solid #ddd" }} />

            <label style={{ fontSize: 12, fontWeight: 800, color: "#333" }}>High Gloss</label>
            <input value={hg} onChange={(e) => setHg(e.target.value)} style={{ padding: 12, borderRadius: 12, border: "1px solid #ddd" }} />

            <label style={{ fontSize: 12, fontWeight: 800, color: "#333" }}>Lak Panel</label>
            <input value={lp} onChange={(e) => setLp(e.target.value)} style={{ padding: 12, borderRadius: 12, border: "1px solid #ddd" }} />

            <label style={{ fontSize: 12, fontWeight: 800, color: "#333" }}>Lake</label>
            <input value={lake} onChange={(e) => setLake(e.target.value)} style={{ padding: 12, borderRadius: 12, border: "1px solid #ddd" }} />
          </div>
        </div>

        {/* Sabit Kalemler */}
        <div style={{ ...card, marginTop: 12 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Sabit Kalemler</div>

          <div style={{ display: "grid", gap: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 800, color: "#333" }}>Kapı (adet)</label>
            <input value={door} onChange={(e) => setDoor(e.target.value)} style={{ padding: 12, borderRadius: 12, border: "1px solid #ddd" }} />

            <label style={{ fontSize: 12, fontWeight: 800, color: "#333" }}>Süpürgelik (₺/m)</label>
            <input value={sk} onChange={(e) => setSk(e.target.value)} style={{ padding: 12, borderRadius: 12, border: "1px solid #ddd" }} />
          </div>
        </div>

        {/* Aksesuarlar */}
        <div style={{ ...card, marginTop: 12 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Aksesuarlar</div>

          <div style={{ display: "grid", gap: 8, marginBottom: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 800, color: "#333" }}>Yeni aksesuar adı</label>
            <input value={accName} onChange={(e) => setAccName(e.target.value)} style={{ padding: 12, borderRadius: 12, border: "1px solid #ddd" }} />

            <label style={{ fontSize: 12, fontWeight: 800, color: "#333" }}>Birim fiyat (₺)</label>
            <input value={accPrice} onChange={(e) => setAccPrice(e.target.value)} style={{ padding: 12, borderRadius: 12, border: "1px solid #ddd" }} />

            <button
              onClick={addAccessory}
              style={{ padding: 12, borderRadius: 12, border: 0, background: "#111", color: "#fff", fontWeight: 900 }}
            >
              + Aksesuar Ekle
            </button>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {accessories.map((a) => (
              <div key={a.id} style={{ border: "1px solid #eee", borderRadius: 14, padding: 12, background: "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 900 }}>{a.name}</div>
                    <div style={{ color: "#666", fontSize: 12 }}>
                      {a.isActive ? "Aktif" : "Pasif"} • {a.unitPrice} ₺
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => toggleAccessory(a.id)}
                      style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #ddd", background: "#fff", fontWeight: 900 }}
                    >
                      {a.isActive ? "Pasif" : "Aktif"}
                    </button>

                    <button
                      onClick={() => deleteAccessory(a.id)}
                      style={{ padding: "10px 12px", borderRadius: 12, border: 0, background: "#ff3b30", color: "#fff", fontWeight: 900 }}
                    >
                      Sil
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Kaydet */}
        <button
          onClick={saveAllAndBack}
          style={{ width: "100%", marginTop: 12, padding: 14, borderRadius: 14, border: 0, background: "#111", color: "#fff", fontWeight: 900 }}
        >
          Kaydet
        </button>

        <div style={{ height: 24 }} />
      </div>
    </div>
  );
}