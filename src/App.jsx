import React, { useEffect, useMemo, useState } from "react";
import AuthGate from "./AuthGate";
import { Screen, TopBar, Button } from "./ui/ui";
import ProjectsScreen from "./screens/ProjectsScreen";
import ProjectScreen from "./screens/ProjectScreen";
import SettingsScreen from "./screens/SettingsScreen";
import { loadCloudState, saveCloudState } from "./core/cloudStore";

function defaultState() {
  return {
    projects: [],
    settings: {
      nextProjectNumber: 2620,
      materialPrices: { MDFLAM: 100, HGloss: 120, LakPanel: 150, Lake: 200 },
      doorPrice: 12000,
      skirtingPricePerMeter: 300,
      // katsayı ayarları (sen istemiştin)
      factors: {
        hilton: 1.0,
        separator: 1.0,
        tvunit: 1.0,
      },
      accessories: [
        { id: crypto.randomUUID(), name: "Şişelik", unitPrice: 3500, isActive: true },
        { id: crypto.randomUUID(), name: "Çöp kovası", unitPrice: 1800, isActive: true },
      ],
      company: {
        name: "Lavera Mutfak",
        address: "",
        phone: "",
        logoDataUrl: "",
      },
    },
  };
}

export default function App() {
  const [route, setRoute] = useState({ name: "projects" });
  const [state, setState] = useState(defaultState());
  const [cloudStatus, setCloudStatus] = useState("Cloud: bekliyor…");

  // İlk girişte cloud’dan çek
  useEffect(() => {
    (async () => {
      try {
        const cloud = await loadCloudState();
        if (cloud) setState(cloud);
        setCloudStatus("Cloud: yüklendi ✅");
      } catch (e) {
        console.error(e);
        setCloudStatus("Cloud: yüklenemedi (env/sql?) ❌");
      }
    })();
  }, []);

  // State değiştikçe cloud’a yaz (debounce)
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        await saveCloudState(state);
        setCloudStatus("Cloud: kaydedildi ✅");
      } catch (e) {
        console.error(e);
        setCloudStatus("Cloud: kaydetme hatası ❌");
      }
    }, 700);
    return () => clearTimeout(t);
  }, [state]);

  const headerRight = useMemo(() => {
    return <div className="text-xs text-white/60">{cloudStatus}</div>;
  }, [cloudStatus]);

  return (
    <AuthGate>
      <Screen>
        {route.name === "projects" && (
          <>
            <TopBar title="Projeler" right={headerRight} />
            <ProjectsScreen
              state={state}
              setState={setState}
              goSettings={() => setRoute({ name: "settings" })}
              openProject={(projectId) => setRoute({ name: "project", projectId })}
            />
          </>
        )}

        {route.name === "project" && (
          <>
            <TopBar
              title="Proje"
              right={
                <Button variant="ghost" onClick={() => setRoute({ name: "projects" })}>
                  Projeler
                </Button>
              }
            />
            <ProjectScreen
              projectId={route.projectId}
              state={state}
              setState={setState}
              onBack={() => setRoute({ name: "projects" })}
            />
          </>
        )}

        {route.name === "settings" && (
          <>
            <TopBar
              title="Ayarlar"
              right={
                <Button variant="ghost" onClick={() => setRoute({ name: "projects" })}>
                  Geri
                </Button>
              }
            />
            <SettingsScreen state={state} setState={setState} onBack={() => setRoute({ name: "projects" })} />
          </>
        )}
      </Screen>
    </AuthGate>
  );
}