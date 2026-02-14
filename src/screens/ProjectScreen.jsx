import { useMemo, useState } from "react";

export default function ProjectScreen({ projectId, state, setState, onBack }) {
  const project = state.projects.find((p) => p.id === projectId);

  const [tab, setTab] = useState("kalemler");

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  const total = useMemo(() => {
    if (!project) return 0;
    const itemsTotal = (project.items || []).reduce((sum, it) => sum + (Number(it.price) || 0), 0);
    const accTotal = (project.accessories || []).reduce((sum, a) => sum + (Number(a.total) || 0), 0);
    return itemsTotal + accTotal;
  }, [project]);

  if (!project) {
    return (
      <div style={{ padding: 16 }}>
        <button onClick={onBack}>← Projeler</button>
        <h2>Proje bulunamadı</h2>
        <p>ID: {projectId}</p>
      </div>
    );
  }

  function addItem() {
    const n = name.trim() || `Kalem ${(project.items?.length || 0) + 1}`;
    const p = Number(price) || 0;

    const newItem = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      name: n,
      price: p,
    };

    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((x) =>
        x.id === projectId ? { ...x, items: [newItem, ...(x.items || [])] } : x
      ),
    }));

    setName("");
    setPrice("");
  }

  function deleteItem(itemId) {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((x) =>
        x.id === projectId ? { ...x, items: (x.items || []).filter((i) => i.id !== itemId) } : x
      ),
    }));
  }

  return (
    <div style={{ padding: 16, maxWidth: 520, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <button onClick={onBack}>← Projeler</button>
        <div>
          <b>
            {project.projectNumber}
            {project.currentVersion}
          </b>
        </div>
      </div>

      <h2 style={{ marginTop: 12 }}>{project.name}</h2>
      <div style={{ color: "#666", marginBottom: 12 }}>{project.customerName}</div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button onClick={() => setTab("kalemler")} style={{ fontWeight: tab === "kalemler" ? 700 : 400 }}>
          Kalemler
        </button>
        <button onClick={() => setTab("aksesuarlar")} style={{ fontWeight: tab === "aksesuarlar" ? 700 : 400 }}>
          Aksesuarlar
        </button>
        <button onClick={() => setTab("teklif")} style={{ fontWeight: tab === "teklif" ? 700 : 400 }}>
          Teklif
        </button>
      </div>

      {tab === "kalemler" && (
        <>
          <div style={{ display: "grid", gap: 8, marginBottom: 10 }}>
            <input
              placeholder="Kalem adı (örn: Mutfak)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
            />
            <input
              placeholder="Tutar (₺)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="numeric"
              style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
            />
            <button onClick={addItem} style={{ padding: 10, borderRadius: 10 }}>
              + Kalem Ekle
            </button>
          </div>

          {(project.items || []).length === 0 ? (
            <div style={{ color: "#666" }}>Henüz kalem yok.</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {(project.items || []).map((it) => (
                <div
                  key={it.id}
                  style={{
                    border: "1px solid #eee",
                    borderRadius: 12,
                    padding: 12,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700 }}>{it.name}</div>
                    <div style={{ color: "#666" }}>{Number(it.price || 0).toLocaleString("tr-TR")} ₺</div>
                  </div>
                  <button onClick={() => deleteItem(it.id)} style={{ color: "crimson" }}>
                    Sil
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "aksesuarlar" && <div style={{ color: "#666" }}>Aksesuar ekranı (şimdilik boş).</div>}

      {tab === "teklif" && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 18 }}>Toplam: {total.toLocaleString("tr-TR")} ₺</div>
          <div style={{ color: "#666", marginTop: 6 }}>Teklif sayfaları sonraki adımda geri eklenir.</div>
        </div>
      )}
    </div>
  );
}