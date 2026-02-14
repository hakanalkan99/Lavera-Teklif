import { useMemo, useState } from "react";

export default function ProjectsScreen({ state, setState, goSettings, openProject }) {
  const [name, setName] = useState("");
  const [customer, setCustomer] = useState("");

  const projects = useMemo(() => {
    return [...(state.projects || [])].reverse();
  }, [state.projects]);

  function createProject() {
    if (!name.trim() || !customer.trim()) return;

    const newProject = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      name: name.trim(),
      customerName: customer.trim(),
      projectNumber: state.settings.nextProjectNumber,
      currentVersion: "A",
      items: [],
      accessories: [],
      status: "Teklif",
    };

    setState((prev) => ({
      ...prev,
      projects: [newProject, ...(prev.projects || [])],
      settings: {
        ...prev.settings,
        nextProjectNumber: prev.settings.nextProjectNumber + 1,
      },
    }));

    setName("");
    setCustomer("");
  }

  function deleteProject(id) {
    setState((prev) => ({
      ...prev,
      projects: (prev.projects || []).filter((p) => p.id !== id),
    }));
  }

  function bumpVersion(id) {
    setState((prev) => ({
      ...prev,
      projects: (prev.projects || []).map((p) => {
        if (p.id !== id) return p;
        const nextChar = String.fromCharCode(p.currentVersion.charCodeAt(0) + 1);
        return { ...p, currentVersion: nextChar };
      }),
    }));
  }

  return (
    <div style={{ padding: 16, maxWidth: 520, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <h2>Projeler</h2>
        <button onClick={goSettings}>Ayarlar</button>
      </div>

      <div style={{ display: "grid", gap: 8, marginBottom: 20 }}>
        <input
          placeholder="Proje adı"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
        />
        <input
          placeholder="Müşteri adı"
          value={customer}
          onChange={(e) => setCustomer(e.target.value)}
          style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
        />
        <button onClick={createProject} style={{ padding: 10, borderRadius: 10 }}>
          + Yeni Proje
        </button>
      </div>

      {projects.length === 0 && <div style={{ color: "#666" }}>Henüz proje yok.</div>}

      <div style={{ display: "grid", gap: 12 }}>
        {projects.map((p) => (
          <div
            key={p.id}
            style={{
              border: "1px solid #eee",
              borderRadius: 14,
              padding: 14,
              background: "white",
            }}
          >
            <div style={{ fontWeight: 700 }}>{p.name}</div>
            <div style={{ color: "#666", marginBottom: 6 }}>{p.customerName}</div>

            <div style={{ fontSize: 14, marginBottom: 8 }}>
              Kod: {p.projectNumber}
              {p.currentVersion}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => openProject(p.id)}>Aç</button>
              <button onClick={() => bumpVersion(p.id)}>Revize</button>
              <button onClick={() => deleteProject(p.id)} style={{ color: "crimson" }}>
                Sil
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}