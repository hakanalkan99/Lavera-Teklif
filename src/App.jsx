import { useEffect, useState } from "react";
import { supabase } from "./core/supabaseClient";
import { cloudLoadState, cloudSaveState, defaultState } from "./core/cloudStorage";

import ProjectsScreen from "./screens/ProjectsScreen";
import ProjectScreen from "./screens/ProjectScreen";
import SettingsScreen from "./screens/SettingsScreen";

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const [route, setRoute] = useState({ name: "projects" });
  const [state, setState] = useState(defaultState());

  // 1) Auth session dinle
  useEffect(() => {
    let alive = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!alive) return;
        setSession(data.session || null);
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setSession(null);
        setLoading(false);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // 2) Session varsa cloud’dan state çek
  useEffect(() => {
    if (!session) return;

    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const st = await cloudLoadState();
        if (!alive) return;
        setState(st);
      } catch (e) {
        console.error(e);
        alert("Cloud verisi okunamadı. Console'a bak.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [session]);

  // 3) State değişince cloud’a yaz (debounce)
  useEffect(() => {
    if (!session) return;
    const t = setTimeout(() => {
      cloudSaveState(state).catch((e) => console.error("cloudSaveState error", e));
    }, 400);
    return () => clearTimeout(t);
  }, [state, session]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f6f7fb" }}>
        <div style={{ fontWeight: 900 }}>Yükleniyor...</div>
      </div>
    );
  }

  if (!session) {
    return <LoginScreen />;
  }

  return (
    <div>
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
    </div>
  );
}

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);

  async function login() {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });
      if (error) alert(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f6f7fb" }}>
      <div style={{ width: 360, background: "#fff", padding: 18, borderRadius: 16, border: "1px solid #eee" }}>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>Giriş</div>

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #ddd", marginBottom: 8 }}
        />

        <input
          placeholder="Şifre"
          type="password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #ddd", marginBottom: 10 }}
        />

        <button
          onClick={login}
          disabled={busy}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 12,
            border: 0,
            background: "#111",
            color: "#fff",
            fontWeight: 900,
          }}
        >
          {busy ? "..." : "Giriş Yap"}
        </button>
      </div>
    </div>
  );
}