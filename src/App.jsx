import { useEffect, useMemo, useRef, useState } from "react";
import AuthGate from "./AuthGate";
import { supabase } from "./core/supabaseClient";
import { loadCloudState, saveCloudState } from "./core/cloudStore";
import { Screen } from "./ui/ui";

import ProjectsScreen from "./screens/ProjectsScreen";
import ProjectScreen from "./screens/ProjectScreen";
import SettingsScreen from "./screens/SettingsScreen";

// -----------------------------
// Route
// -----------------------------
function makeRouteProjects() {
  return { name: "projects" };
}
function makeRouteProject(projectId) {
  return { name: "project", projectId };
}
function makeRouteSettings() {
  return { name: "settings" };
}

// -----------------------------
// App
// -----------------------------
export default function App() {
  const [route, setRoute] = useState(makeRouteProjects());

  // Cloud state
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);

  // Header durumları
  const [cloudSaved, setCloudSaved] = useState(false);
  const cloudSavedTimerRef = useRef(null);

  // Cloud save debounce
  const saveTimerRef = useRef(null);
  const lastSavedHashRef = useRef("");

  // Kullanıcı bilgisi
  const [userEmail, setUserEmail] = useState("");

  function hashState(obj) {
    try {
      return JSON.stringify(obj);
    } catch {
      return String(Date.now());
    }
  }

  // İlk açılış: cloud’dan yükle
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const userRes = await supabase.auth.getUser();
        const email = userRes?.data?.user?.email || "";
        if (alive) setUserEmail(email);

        const loaded = await loadCloudState();
        if (alive) {
          setState(loaded);
          setLoading(false);
          lastSavedHashRef.current = hashState(loaded);
        }
      } catch (e) {
        console.error("Cloud load error:", e);
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // State değişince: cloud’a kaydet (debounce)
  useEffect(() => {
    if (!state) return;

    const h = hashState(state);
    if (h === lastSavedHashRef.current) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await saveCloudState(state);
        lastSavedHashRef.current = h;

        setCloudSaved(true);
        if (cloudSavedTimerRef.current) clearTimeout(cloudSavedTimerRef.current);
        cloudSavedTimerRef.current = setTimeout(() => setCloudSaved(false), 2200);
      } catch (e) {
        console.error("Cloud save error:", e);
      }
    }, 650);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [state]);

  const header = useMemo(() => {
    return (
      <>
        {/* küçük animasyon css’i */}
        <style>{`
          @keyframes fadeInOut {
            0% { opacity: 0; transform: translateY(-6px); }
            10% { opacity: 1; transform: translateY(0); }
            80% { opacity: 1; }
            100% { opacity: 0; }
          }

          /* ✅ ÇÖZÜM: header dışındaki tüm "Çıkış" butonlarını gizle */
          button[title="Çıkış"]:not(#header-logout),
          button[aria-label="Çıkış"]:not(#header-logout) {
            display: none !important;
            visibility: hidden !important;
            pointer-events: none !important;
          }
        `}</style>

        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            background: "linear-gradient(90deg,#0f172a,#1e293b)",
            color: "white",
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ fontWeight: 900, fontSize: 18, letterSpacing: 0.2 }}>
              Lavera Teklif Sistemi
            </div>
            {userEmail ? (
              <div style={{ fontSize: 12, opacity: 0.8 }}>{userEmail}</div>
            ) : (
              <div style={{ fontSize: 12, opacity: 0.8 }}>Cloud aktif</div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {cloudSaved && (
              <div
                style={{
                  background: "#16a34a",
                  padding: "6px 12px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                  animation: "fadeInOut 2.2s ease",
                  whiteSpace: "nowrap",
                }}
              >
                ✔ Cloud Kaydedildi
              </div>
            )}

            <button
              id="header-logout"
              onClick={async () => {
                try {
                  await supabase.auth.signOut();
                } catch {}
                window.location.reload();
              }}
              style={{
                background: "#ef4444",
                border: "none",
                color: "white",
                padding: "8px 14px",
                borderRadius: 12,
                fontWeight: 800,
                cursor: "pointer",
              }}
              title="Çıkış"
              aria-label="Çıkış"
            >
              Çıkış
            </button>
          </div>
        </div>
      </>
    );
  }, [cloudSaved, userEmail]);

  return (
    <AuthGate>
      <Screen>
        {header}

        {loading || !state ? (
          <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
            <div
              style={{
                background: "#fff",
                border: "1px solid #eee",
                borderRadius: 16,
                padding: 16,
                boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Yükleniyor…</div>
              <div style={{ color: "#666" }}>Cloud verileri getiriliyor.</div>
            </div>
          </div>
        ) : (
          <>
            {route.name === "projects" && (
              <ProjectsScreen
                state={state}
                setState={setState}
                goSettings={() => setRoute(makeRouteSettings())}
                openProject={(projectId) => setRoute(makeRouteProject(projectId))}
              />
            )}

            {route.name === "project" && (
              <ProjectScreen
                projectId={route.projectId}
                state={state}
                setState={setState}
                onBack={() => setRoute(makeRouteProjects())}
              />
            )}

            {route.name === "settings" && (
              <SettingsScreen
                state={state}
                setState={setState}
                onBack={() => setRoute(makeRouteProjects())}
              />
            )}
          </>
        )}
      </Screen>
    </AuthGate>
  );
}