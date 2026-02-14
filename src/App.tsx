import React, { useEffect, useState } from "react";
import type { PersistedState } from "./core/types";
import { loadState, saveState } from "./core/storage";
import { Screen } from "./ui/ui";
import ProjectsScreen from "./screens/ProjectsScreen";
import ProjectScreen from "./screens/ProjectScreen";
import SettingsScreen from "./screens/SettingsScreen";

type Route =
  | { name: "projects" }
  | { name: "project"; projectId: string }
  | { name: "settings" };

export default function App() {
  const [route, setRoute] = useState<Route>({ name: "projects" });
  const [state, setState] = useState<PersistedState>(() => loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  return (
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
  );
}