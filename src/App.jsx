import React, { useEffect, useState } from "react";

import ProjectsScreen from "./screens/ProjectsScreen.jsx";
import ProjectScreen from "./screens/ProjectScreen.jsx";
import SettingsScreen from "./screens/SettingsScreen.jsx";

import { loadState, saveState } from "./core/storage.js";

/** Basit error boundary: runtime patlarsa beyaz ekran yerine hata yazar */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, err: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, err: error };
  }
  componentDidCatch(error, info) {
    // console'a da basalım
    console.error("ErrorBoundary:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16, fontFamily: "system-ui" }}>
          <h2>Uygulama Hatası</h2>
          <p style={{ color: "#666" }}>
            Beyaz ekran yerine hatayı gösteriyorum. Bu yazıyı at bana.
          </p>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              background: "#111",
              color: "#fff",
              padding: 12,
              borderRadius: 12,
              overflow: "auto",
            }}
          >
            {String(this.state.err?.stack || this.state.err)}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function Screen({ children }) {
  return <div style={{ minHeight: "100vh", background: "#f6f7fb" }}>{children}</div>;
}

export default function App() {
  /** ROUTE */
  const [route, setRoute] = useState({ name: "projects" }); // {name:'projects'} | {name:'project', projectId} | {name:'settings'}

  /** STATE */
  const [state, setState] = useState(() => loadState());

  /** persist */
  useEffect(() => {
    saveState(state);
  }, [state]);

  /** ENV CHECK (Vercel/Supabase) */
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Eğer supabase entegrasyonlu build aldıysan ve env boşsa BEYAZ yerine bunu göster
  // (Localde env yoksa ama supabase kullanmıyorsan bunu kapatabilirsin. Şimdilik açık kalsın.)
  if (!supabaseUrl || !supabaseKey) {
    return (
      <Screen>
        <div style={{ maxWidth: 560, margin: "0 auto", padding: 16, fontFamily: "system-ui" }}>
          <div
            style={{
              background: "#fff",
              border: "1px solid #eee",
              borderRadius: 18,
              padding: 14,
              boxShadow: "0 10px 22px rgba(0,0,0,0.05)",
            }}
          >
            <h2 style={{ margin: 0 }}>ENV HATASI</h2>
            <p style={{ color: "#666" }}>
              Vercel Environment Variables boş geliyor. Bu yüzden Supabase client çalışmıyor ve beyaz ekran oluyordu.
            </p>
            <pre style={{ whiteSpace: "pre-wrap", background: "#f2f3f6", padding: 12, borderRadius: 12 }}>
VITE_SUPABASE_URL: {String(supabaseUrl)}
VITE_SUPABASE_ANON_KEY: {supabaseKey ? supabaseKey.slice(0, 22) + "..." : String(supabaseKey)}
            </pre>
            <p style={{ marginTop: 10, color: "#666" }}>
              Vercel → Project → Settings → Environment Variables:
              <br />• VITE_SUPABASE_URL = https://xxxx.supabase.co
              <br />• VITE_SUPABASE_ANON_KEY = sb_publishable_...
              <br />
              Sonra Redeploy (Clear cache).
            </p>
          </div>
        </div>
      </Screen>
    );
  }

  return (
    <ErrorBoundary>
      <Screen>
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
          <SettingsScreen state={state} setState={setState} onBack={() => setRoute({ name: "projects" })} />
        )}
      </Screen>
    </ErrorBoundary>
  );
}