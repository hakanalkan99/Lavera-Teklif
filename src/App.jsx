import { useEffect, useState } from "react";
import { loadState, saveState } from "./core/storage";

import ProjectsScreen from "./screens/ProjectsScreen";
import ProjectScreen from "./screens/ProjectScreen";
import SettingsScreen from "./screens/SettingsScreen";

export default function App() {
  const [route, setRoute] = useState({ name: "projects" });
  const [state, setState] = useState(() => loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  return (
    <div style={{ minHeight: "100vh" }}>
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
    </div>
  );
}