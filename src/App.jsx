import { useEffect, useMemo, useState } from "react";
import ProjectsScreen from "./screens/ProjectsScreen";
import ProjectScreen from "./screens/ProjectScreen";
import SettingsScreen from "./screens/SettingsScreen";
import { Screen } from "./ui/ui";
import { supabase } from "./core/supabaseClient";
import { loadProjectsFromCloud, saveProjectsToCloud } from "./core/cloudStore";

/**
 * LAVERA TEKLİF — APP (Cloud + Local)
 * - Supabase Auth (email/şifre)
 * - Projeler cloud’a kaydolur (projects_store tablosu)
 * - LocalStorage yedek: internet yoksa bozulmasın diye
 */

const LS_KEY = "lavera_teklif_state_v1";

// ---- Helpers
function safeParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function uuid() {
  return (crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random()}`).toString();
}

// Default settings (senin uygulamadaki beklentilerle uyumlu)
function defaultSettings() {
  return {
    materialPrices: {
      MDFLAM: 100,
      HGloss: 120,
      LakPanel: 150,
      Lake: 200,
    },
    // sabit kalemler
    doorPrice: 12000,
    skirtingPricePerMeter: 300,

    // bazı kalemlerde katsayı oynama (ayarlardan değişebilir)
    coefficients: {
      hilton: 1.0,
      tvUnit: 1.0,
      separator: 1.0,
    },

    accessories: [
      { id: uuid(), name: "Şişelik", unitPrice: 3500, isActive: true },
      { id: uuid(), name: "Döner mekanizma", unitPrice: 4500, isActive: true },
      { id: uuid(), name: "Çift aventos", unitPrice: 5500, isActive: true },
      { id: uuid(), name: "Tek aventos", unitPrice: 3500, isActive: true },
      { id: uuid(), name: "Çöp kovası", unitPrice: 1800, isActive: true },
    ],

    companyInfo: {
      name: "",
      address: "",
      phone: "",
      email: "",
      instagram: "",
      logoDataUrl: "",
    },

    nextProjectNumber: 2620,
  };
}

function defaultState() {
  return {
    projects: [],
    settings: defaultSettings(),
  };
}

function migrateState(st) {
  const base = defaultState();

  const merged = {
    ...base,
    ...(st || {}),
    settings: {
      ...base.settings,
      ...((st && st.settings) || {}),
      materialPrices: {
        ...base.settings.materialPrices,
        ...(((st && st.settings && st.settings.materialPrices) || {}) ?? {}),
      },
      coefficients: {
        ...base.settings.coefficients,
        ...(((st && st.settings && st.settings.coefficients) || {}) ?? {}),
      },
      accessories: Array.isArray(st?.settings?.accessories)
        ? st.settings.accessories
        : base.settings.accessories,
      companyInfo: {
        ...base.settings.companyInfo,
        ...((st?.settings?.companyInfo || {}) ?? {}),
      },
      nextProjectNumber:
        typeof st?.settings?.nextProjectNumber === "number"
          ? st.settings.nextProjectNumber
          : base.settings.nextProjectNumber,
    },
    projects: Array.isArray(st?.projects) ? st.projects : [],
  };

  return merged;
}

function loadLocalState() {
  const raw = localStorage.getItem(LS_KEY);
  return migrateState(safeParse(raw, defaultState()));
}

function saveLocalState(st) {
  localStorage.setItem(LS_KEY, JSON.stringify(st));
}

// ---- Routes
// { name: "projects" } | { name: "project", projectId } | { name: "settings" }
export default function App() {
  const [route, setRoute] = useState({ name: "projects" });
  const [state, setState] = useState(() => loadLocalState());

  // Auth
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Cloud boot flag (cloud’dan çekmeyi 1 kere yap)
  const [cloudBooted, setCloudBooted] = useState(false);

  // Login form
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [authErr, setAuthErr] = useState("");

  // 1) Local autosave
  useEffect(() => {
    saveLocalState(state);
  }, [state]);

  // 2) Session init + listener
  useEffect(() => {
    let sub;

    (async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data?.session ?? null);
      setAuthLoading(false);

      const res = supabase.auth.onAuthStateChange((_event, nextSession) => {
        setSession(nextSession ?? null);
        // kullanıcı değişirse cloud boot yeniden
        setCloudBooted(false);
      });

      sub = res?.data?.subscription;
    })();

    return () => {
      try {
        sub?.unsubscribe?.();
      } catch {}
    };
  }, []);

  // 3) Cloud: login olduktan sonra bir kere cloud’dan çek → state.projects’i doldur
  useEffect(() => {
    if (!session || cloudBooted) return;

    let ignore = false;

    (async () => {
      try {
        const cloudProjects = await loadProjectsFromCloud();
        if (!ignore && Array.isArray(cloudProjects)) {
          setState((prev) => ({ ...prev, projects: cloudProjects }));
        }
      } catch (e) {
        // cloud çekemezsek local ile devam
      } finally {
        if (!ignore) setCloudBooted(true);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [session, cloudBooted]);

  // 4) Cloud: projects değiştikçe cloud’a yaz (login varsa)
  useEffect(() => {
    if (!session) return;
    if (!cloudBooted) return; // önce pull yapsın
    saveProjectsToCloud(state.projects).catch(() => {});
  }, [session, cloudBooted, state.projects]);

  const envOk = Boolean(
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  async function signIn() {
    setAuthErr("");
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass,
      });
      if (error) setAuthErr(error.message);
    } catch (e) {
      setAuthErr("Login başarısız (network).");
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  // ---- UI: Auth Gate
  if (!envOk) {
    return (
      <Screen>
        <div style={{ maxWidth: 520, margin: "0 auto", padding: 18 }}>
          <div style={{ fontWeight: 900, fontSize: 18 }}>ENV eksik</div>
          <div style={{ marginTop: 8, color: "#555", lineHeight: 1.4 }}>
            Vercel (ve local) için şu iki değişken şart:
            <br />
            <b>VITE_SUPABASE_URL</b>
            <br />
            <b>VITE_SUPABASE_ANON_KEY</b>
          </div>
        </div>
      </Screen>
    );
  }

  if (authLoading) {
    return (
      <Screen>
        <div style={{ maxWidth: 520, margin: "0 auto", padding: 18 }}>
          <div style={{ fontWeight: 900 }}>Yükleniyor…</div>
        </div>
      </Screen>
    );
  }

  if (!session) {
    return (
      <Screen>
        <div style={{ minHeight: "100vh", background: "#f6f7fb" }}>
          <div style={{ maxWidth: 520, margin: "0 auto", padding: 18 }}>
            <div
              style={{
                background: "#fff",
                border: "1px solid #eee",
                borderRadius: 18,
                padding: 16,
                boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ fontWeight: 900, fontSize: 18 }}>
                Lavera Teklif — Giriş
              </div>
              <div style={{ marginTop: 6, color: "#666", fontSize: 13 }}>
                Email + şifre ile giriş yap.
              </div>

              <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: "#444" }}>
                  Email
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@mail.com"
                    style={{
                      width: "100%",
                      marginTop: 6,
                      padding: 12,
                      borderRadius: 12,
                      border: "1px solid #ddd",
                      outline: "none",
                    }}
                    autoComplete="email"
                  />
                </label>

                <label style={{ fontSize: 12, fontWeight: 800, color: "#444" }}>
                  Şifre
                  <input
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    placeholder="••••••••"
                    type="password"
                    style={{
                      width: "100%",
                      marginTop: 6,
                      padding: 12,
                      borderRadius: 12,
                      border: "1px solid #ddd",
                      outline: "none",
                    }}
                    autoComplete="current-password"
                  />
                </label>

                {authErr ? (
                  <div style={{ color: "#b00020", fontSize: 13 }}>
                    {authErr}
                  </div>
                ) : null}

                <button
                  onClick={signIn}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    border: 0,
                    background: "#111",
                    color: "#fff",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  Giriş Yap
                </button>

                <div style={{ color: "#666", fontSize: 12, lineHeight: 1.4 }}>
                  Not: Bu ekran Supabase Auth’tan geliyor. Cloud senkron bununla
                  çalışır.
                </div>
              </div>
            </div>
          </div>
        </div>
      </Screen>
    );
  }

  // ---- App Shell
  const headerRight = useMemo(() => {
    return (
      <button
        onClick={signOut}
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
    );
  }, []);

  return (
    <Screen>
      {/* küçük üst bar: sadece çıkış */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          backdropFilter: "blur(10px)",
          background: "rgba(246,247,251,0.85)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            maxWidth: 920,
            margin: "0 auto",
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <div style={{ fontWeight: 900 }}>Lavera Teklif</div>
          {headerRight}
        </div>
      </div>

      {route.name === "projects" && (
        <ProjectsScreen
          state={state}
          setState={setState}
          goSettings={() => setRoute({ name: "settings" })}
          openProject={(projectId) => setRoute({ name: "project", projectId })}
        />
      )}

      {route.name === "project" && (
        <ProjectScreen
          projectId={route.projectId}
          state={state}
          setState={setState}
          onBack={() => setRoute({ name: "projects" })}
        />
      )}

      {route.name === "settings" && (
        <SettingsScreen
          state={state}
          setState={setState}
          onBack={() => setRoute({ name: "projects" })}
        />
      )}
    </Screen>
  );
}