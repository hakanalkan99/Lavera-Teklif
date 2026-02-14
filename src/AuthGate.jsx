import React, { useMemo, useState } from "react";

const LS_OK_KEY = "lavera_auth_ok_v1";
const LS_CREDS_KEY = "lavera_auth_creds_v1";

// Varsayılan (ilk kurulumda)
const DEFAULT_CREDS = { user: "lavera", pass: "1234" };

function loadCreds() {
  try {
    const raw = localStorage.getItem(LS_CREDS_KEY);
    if (!raw) return DEFAULT_CREDS;
    const parsed = JSON.parse(raw);
    const user = String(parsed?.user ?? DEFAULT_CREDS.user);
    const pass = String(parsed?.pass ?? DEFAULT_CREDS.pass);
    return { user, pass };
  } catch {
    return DEFAULT_CREDS;
  }
}

export default function AuthGate({ children }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  const isAuthed = useMemo(() => {
    try {
      return localStorage.getItem(LS_OK_KEY) === "1";
    } catch {
      return false;
    }
  }, []);

  const [ok, setOk] = useState(isAuthed);

  function login() {
    setError("");
    const creds = loadCreds();

    if (user.trim() === creds.user && pass === creds.pass) {
      try {
        localStorage.setItem(LS_OK_KEY, "1");
      } catch {}
      setOk(true);
      return;
    }
    setError("Kullanıcı adı veya şifre yanlış.");
  }

  function logout() {
    try {
      localStorage.removeItem(LS_OK_KEY);
    } catch {}
    setOk(false);
    setUser("");
    setPass("");
  }

  if (ok) {
    return (
      <div style={{ minHeight: "100vh" }}>
        <div style={{ position: "fixed", top: 12, right: 12, zIndex: 9999 }}>
          <button
            onClick={logout}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid #ddd",
              background: "#fff",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Çıkış
          </button>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "linear-gradient(180deg, #0b0b0f 0%, #141420 100%)",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: 18,
          padding: 18,
          color: "white",
          boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 900 }}>Lavera Teklif</div>
        <div style={{ marginTop: 6, opacity: 0.8, fontSize: 13 }}>
          Giriş yapmadan devam edemezsiniz.
        </div>

        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          <input
            value={user}
            onChange={(e) => setUser(e.target.value)}
            placeholder="Kullanıcı adı"
            style={{
              padding: 12,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(0,0,0,0.25)",
              color: "white",
              outline: "none",
            }}
          />
          <input
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="Şifre"
            type="password"
            style={{
              padding: 12,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(0,0,0,0.25)",
              color: "white",
              outline: "none",
            }}
          />

          {error ? (
            <div style={{ color: "#ffb4b4", fontWeight: 700, fontSize: 13 }}>{error}</div>
          ) : null}

          <button
            onClick={login}
            style={{
              padding: 12,
              borderRadius: 12,
              border: 0,
              background: "white",
              color: "#111",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Giriş Yap
          </button>
        </div>
      </div>
    </div>
  );
}