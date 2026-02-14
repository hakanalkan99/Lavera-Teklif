import React, { useMemo, useState } from "react";
import type { PersistedState } from "../core/types";

type ProjectStatus = "Teklif" | "Beklemede" | "Onaylandı" | "İptal";

export default function ProjectsScreen({
  state,
  setState,
  goSettings,
  openProject,
}: {
  state: PersistedState;
  setState: React.Dispatch<React.SetStateAction<PersistedState>>;
  goSettings: () => void;
  openProject: (id: string) => void;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("Teklif");

  const projectsSorted = useMemo(() => {
    return [...state.projects].sort((a, b) =>
      b.createdAtISO.localeCompare(a.createdAtISO)
    );
  }, [state.projects]);

  function projectTotal(p: any) {
    const items =
      p.items?.reduce((sum: number, i: any) => sum + (i.price || 0), 0) || 0;

    const accessories =
      p.accessories?.reduce((sum: number, a: any) => {
        const def = state.settings.accessories.find(
          (x) => x.id === a.accessoryId
        );
        return sum + (a.quantity || 0) * (def?.unitPrice || 0);
      }, 0) || 0;

    return items + accessories;
  }

  const totalCiro = projectsSorted.reduce((sum, p) => sum + projectTotal(p), 0);
  const ortalama = projectsSorted.length
    ? Math.round(totalCiro / projectsSorted.length)
    : 0;

  function createProject() {
    if (!projectName.trim() || !customerName.trim()) return;

    const newProject: any = {
      id: crypto.randomUUID(),
      name: projectName.trim(),
      customerName: customerName.trim(),
      createdAtISO: new Date().toISOString(),
      projectNumber: state.settings.nextProjectNumber,
      currentVersion: "A",
      status, // ✅ yeni alan
      items: [],
      accessories: [],
    };

    setState((prev) => ({
      ...prev,
      projects: [newProject, ...prev.projects],
      settings: {
        ...prev.settings,
        nextProjectNumber: prev.settings.nextProjectNumber + 1,
      },
    }));

    setProjectName("");
    setCustomerName("");
    setStatus("Teklif");
    setDrawerOpen(false);
  }

  function deleteProject(id: string) {
    if (!confirm("Projeyi silmek istiyor musun?")) return;
    setState((prev) => ({
      ...prev,
      projects: prev.projects.filter((p) => p.id !== id),
    }));
  }

  function revizeProject(id: string) {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id !== id) return p;
        const cur = p.currentVersion.charCodeAt(0);
        return { ...p, currentVersion: String.fromCharCode(cur + 1) };
      }),
    }));
  }

  function setProjectStatus(id: string, nextStatus: ProjectStatus) {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p: any) =>
        p.id === id ? { ...p, status: nextStatus } : p
      ),
    }));
  }

  function statusStyle(s: ProjectStatus): React.CSSProperties {
    // Renkleri sabit veriyoruz (CSS ile uğraştırmıyor)
    if (s === "Onaylandı")
      return {
        background: "rgba(34,197,94,0.12)",
        border: "1px solid rgba(34,197,94,0.30)",
        color: "#166534",
      };
    if (s === "Beklemede")
      return {
        background: "rgba(245,158,11,0.14)",
        border: "1px solid rgba(245,158,11,0.35)",
        color: "#92400e",
      };
    if (s === "İptal")
      return {
        background: "rgba(239,68,68,0.12)",
        border: "1px solid rgba(239,68,68,0.30)",
        color: "#991b1b",
      };
    return {
      background: "rgba(99,102,241,0.12)",
      border: "1px solid rgba(99,102,241,0.30)",
      color: "#3730a3",
    }; // Teklif
  }

  return (
    <div style={S.page}>
      {/* TOP BAR */}
      <div style={S.topBar}>
        <div>
          <div style={S.kicker}>Lavera Teklif Paneli</div>
          <div style={S.title}>Dashboard</div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button style={S.ghostBtn} onClick={goSettings}>
            Ayarlar
          </button>
          <button style={S.primaryBtn} onClick={() => setDrawerOpen(true)}>
            + Yeni Proje
          </button>
        </div>
      </div>

      {/* DASHBOARD METRICS */}
      <div style={S.metricsRow}>
        <div style={S.metricCard}>
          <div style={S.metricTitle}>Toplam Ciro</div>
          <div style={S.metricValue}>{totalCiro.toLocaleString()} ₺</div>
        </div>

        <div style={S.metricCard}>
          <div style={S.metricTitle}>Proje Sayısı</div>
          <div style={S.metricValue}>{projectsSorted.length}</div>
        </div>

        <div style={S.metricCard}>
          <div style={S.metricTitle}>Ortalama Teklif</div>
          <div style={S.metricValue}>{ortalama.toLocaleString()} ₺</div>
        </div>
      </div>

      {/* PROJECT LIST */}
      <div style={S.container}>
        {projectsSorted.map((p: any) => {
          const pStatus: ProjectStatus = (p.status || "Teklif") as ProjectStatus;

          return (
            <div
              key={p.id}
              style={S.card}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "translateY(-6px)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "translateY(0)")
              }
            >
              {/* küçük glow (sadece “aktif” hissi) */}
              <div style={S.activeGlow} />

              <div style={S.cardTop}>
                <div>
                  <div style={S.projectName}>{p.name}</div>
                  <div style={S.customerName}>{p.customerName}</div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
                  <div style={S.codeBadge}>
                    {p.projectNumber}
                    {p.currentVersion}
                  </div>

                  {/* ✅ DURUM ETİKETİ + DROPDOWN */}
                  <select
                    value={pStatus}
                    onChange={(e) =>
                      setProjectStatus(p.id, e.target.value as ProjectStatus)
                    }
                    style={{
                      ...S.statusSelect,
                      ...statusStyle(pStatus),
                    }}
                    title="Durum"
                  >
                    <option value="Teklif">Teklif</option>
                    <option value="Beklemede">Beklemede</option>
                    <option value="Onaylandı">Onaylandı</option>
                    <option value="İptal">İptal</option>
                  </select>
                </div>
              </div>

              <div style={S.totalText}>{projectTotal(p).toLocaleString()} ₺</div>

              <div style={S.cardActions}>
                <button style={S.cardBtn} onClick={() => openProject(p.id)}>
                  Aç
                </button>
                <button style={S.cardBtn} onClick={() => revizeProject(p.id)}>
                  Revize
                </button>
                <button style={S.dangerBtn} onClick={() => deleteProject(p.id)}>
                  Sil
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* DRAWER */}
      {drawerOpen && (
        <div style={S.overlay} onClick={() => setDrawerOpen(false)} />
      )}

      <div
        style={{
          ...S.drawer,
          transform: drawerOpen ? "translateX(0)" : "translateX(110%)",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Yeni Proje</h3>

        <input
          style={S.input}
          placeholder="Proje adı"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && createProject()}
        />

        <input
          style={S.input}
          placeholder="Müşteri adı"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && createProject()}
        />

        {/* ✅ Yeni proje durum seçimi */}
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>
            Proje Durumu
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus)}
            style={{
              ...S.input,
              marginTop: 0,
              cursor: "pointer",
            }}
          >
            <option value="Teklif">Teklif</option>
            <option value="Beklemede">Beklemede</option>
            <option value="Onaylandı">Onaylandı</option>
            <option value="İptal">İptal</option>
          </select>
        </div>

        <button
          style={S.primaryBtn}
          onClick={createProject}
          disabled={!projectName.trim() || !customerName.trim()}
        >
          Kaydet
        </button>
      </div>
    </div>
  );
}

/* PREMIUM STYLES */

const S: any = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg,#eef1f6,#f7f9fc)",
    padding: 40,
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 40,
    alignItems: "center",
  },
  kicker: { fontSize: 12, color: "#777" },
  title: { fontSize: 30, fontWeight: 800 },
  metricsRow: {
    display: "flex",
    gap: 20,
    marginBottom: 40,
    flexWrap: "wrap",
  },
  metricCard: {
    flex: 1,
    minWidth: 220,
    background: "white",
    padding: 20,
    borderRadius: 20,
    boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
  },
  metricTitle: { fontSize: 13, color: "#777" },
  metricValue: { fontSize: 24, fontWeight: 800, marginTop: 8 },
  container: { maxWidth: 980, margin: "0 auto" },
  card: {
    position: "relative",
    background: "white",
    padding: 24,
    borderRadius: 24,
    marginBottom: 24,
    boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
    transition: "all .25s ease",
  },
  activeGlow: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 12,
    height: 12,
    background: "#4CAF50",
    borderRadius: "50%",
    boxShadow: "0 0 12px #4CAF50",
    opacity: 0.55,
  },
  cardTop: { display: "flex", justifyContent: "space-between", gap: 14 },
  projectName: { fontWeight: 800, fontSize: 20 },
  customerName: { fontSize: 14, color: "#666", marginTop: 6 },
  totalText: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: 800,
    color: "#111",
  },
  codeBadge: {
    background: "#111",
    color: "white",
    padding: "6px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    alignSelf: "flex-end",
  },
  statusSelect: {
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    outline: "none",
    cursor: "pointer",
    appearance: "none",
    WebkitAppearance: "none",
  },
  cardActions: { marginTop: 18, display: "flex", gap: 12, flexWrap: "wrap" },
  cardBtn: {
    padding: "8px 14px",
    borderRadius: 12,
    border: "1px solid #ddd",
    background: "white",
    cursor: "pointer",
    fontWeight: 700,
  },
  dangerBtn: {
    padding: "8px 14px",
    borderRadius: 12,
    border: "none",
    background: "#e74c3c",
    color: "white",
    cursor: "pointer",
    fontWeight: 800,
  },
  primaryBtn: {
    padding: "10px 18px",
    borderRadius: 16,
    border: "none",
    background: "#111",
    color: "white",
    cursor: "pointer",
    marginTop: 20,
    fontWeight: 800,
  },
  ghostBtn: {
    padding: "10px 18px",
    borderRadius: 16,
    border: "1px solid #ccc",
    background: "white",
    cursor: "pointer",
    fontWeight: 800,
  },
  drawer: {
    position: "fixed",
    top: 0,
    right: 0,
    width: 420,
    maxWidth: "92vw",
    height: "100vh",
    background: "white",
    padding: 30,
    boxShadow: "-10px 0 40px rgba(0,0,0,0.2)",
    transition: "transform .3s ease",
    zIndex: 10,
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.3)",
    zIndex: 9,
  },
  input: {
    width: "100%",
    padding: 14,
    marginTop: 15,
    borderRadius: 14,
    border: "1px solid #ddd",
    outline: "none",
  },
};