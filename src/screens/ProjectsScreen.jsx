import React, { useMemo, useState } from "react";

export default function ProjectsScreen({ state, setState, goSettings, openProject }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [name, setName] = useState("");
  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  function uid() {
    return (crypto?.randomUUID && crypto.randomUUID()) || String(Date.now() + Math.random());
  }

  function currency(n) {
    const x = Number(n || 0);
    try {
      return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(x);
    } catch {
      return `${Math.round(x)} ₺`;
    }
  }

  function formatDate(iso) {
    const d = iso ? new Date(iso) : new Date();
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = d.getFullYear();
    return `${dd}.${mm}.${yy}`;
  }

  const projectsSorted = useMemo(() => {
    return [...(state.projects || [])].sort((a, b) => String(b.createdAtISO || "").localeCompare(String(a.createdAtISO || "")));
  }, [state.projects]);

  function projectTotal(p) {
    const items = (p.items || []).reduce((s, it) => s + (Number(it.price) || 0), 0);
    let acc = 0;
    const defs = state.settings?.accessories || [];
    for (const r of p.accessories || []) {
      const def = defs.find((d) => d.id === r.accessoryId);
      if (!def) continue;
      acc += (Number(r.quantity) || 0) * (Number(def.unitPrice) || 0);
    }
    return items + acc;
  }

  function openNewProject() {
    setName("");
    setCustomer("");
    setPhone("");
    setAddress("");
    setDrawerOpen(true);
  }

  function createProject() {
    const pname = String(name).trim();
    const cname = String(customer).trim();
    if (!pname || !cname) return;

    const nextNo = Number(state.settings?.nextProjectNumber || 2620);
    const now = new Date().toISOString();

    const p = {
      id: uid(),
      projectNumber: nextNo,
      name: pname,
      customerName: cname,
      phone: String(phone).trim() || undefined,
      address: String(address).trim() || undefined,
      createdAtISO: now,
      offerDateISO: now,
      currentVersion: "A",
      items: [],
      accessories: [],
    };

    setState((prev) => ({
      ...prev,
      projects: [p, ...(prev.projects || [])],
      settings: { ...prev.settings, nextProjectNumber: nextNo + 1 },
    }));

    setDrawerOpen(false);
    openProject(p.id);
  }

  function deleteProject(id) {
    setState((prev) => ({ ...prev, projects: (prev.projects || []).filter((p) => p.id !== id) }));
  }

  // ✅ Revize: tarih otomatik güncellenir + versiyon A→B→C...
  function reviseProject(id) {
    const now = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      projects: (prev.projects || []).map((p) => {
        if (p.id !== id) return p;
        const cur = String(p.currentVersion || "A");
        const ch = cur.charCodeAt(0);
        const next = ch >= 65 && ch < 90 ? String.fromCharCode(ch + 1) : "A";
        return { ...p, offerDateISO: now, currentVersion: next };
      }),
    }));
    openProject(id);
  }

  const page = { minHeight: "100vh", background: "#f6f7fb" };
  const wrap = { maxWidth: 680, margin: "0 auto", padding: 16 };
  const card = { border: "1px solid rgba(0,0,0,0.08)", borderRadius: 18, padding: 14, background: "#fff", boxShadow: "0 10px 30px rgba(0,0,0,0.06)" };
  const btn = { padding: "10px 12px", borderRadius: 14, border: "1px solid rgba(0,0,0,0.12)", background: "#fff", fontWeight: 900, cursor: "pointer" };
  const btnPrimary = { ...btn, background: "#111", color: "#fff", border: "1px solid #111" };
  const btnDanger = { ...btn, borderColor: "rgba(220,38,38,0.25)", color: "#b91c1c" };

  return (
    <div style={page}>
      <div style={wrap}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div style={{ fontWeight: 950, fontSize: 16 }}>Projeler</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={btn} onClick={goSettings}>Ayarlar</button>
            <button style={btnPrimary} onClick={openNewProject}>+ Yeni Proje</button>
          </div>
        </div>

        <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
          {projectsSorted.length === 0 ? (
            <div style={card}>
              <div style={{ fontWeight: 950 }}>Henüz proje yok</div>
              <div style={{ marginTop: 6, color: "#666", fontWeight: 800, fontSize: 13 }}>“+ Yeni Proje” ile ilk teklifi oluştur.</div>
            </div>
          ) : (
            projectsSorted.map((p) => (
              <div key={p.id} style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 950, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: "#666", fontWeight: 800, lineHeight: 1.5 }}>
                      {p.customerName}
                      {p.phone ? <div>Tel: {p.phone}</div> : null}
                      {p.address ? <div>Adres: {p.address}</div> : null}
                      <div style={{ marginTop: 4 }}>
                        {formatDate(p.createdAtISO)} • Kod: <b>{p.projectNumber}{p.currentVersion}</b>
                      </div>
                      <div>Teklif Tarihi: <b>{formatDate(p.offerDateISO || p.createdAtISO)}</b></div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 950 }}>{currency(projectTotal(p))}</div>
                    <div style={{ fontSize: 12, color: "#666", fontWeight: 800 }}>Güncel toplam</div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 10 }}>
                  <button style={btnPrimary} onClick={() => openProject(p.id)}>Aç</button>
                  <button style={btn} onClick={() => reviseProject(p.id)}>Teklif / Revize</button>
                  <button style={btnDanger} onClick={() => deleteProject(p.id)}>Sil</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {drawerOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", justifyContent: "center", alignItems: "flex-end", zIndex: 50 }} onClick={() => setDrawerOpen(false)}>
          <div style={{ width: "100%", maxWidth: 760, background: "#fff", borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 14, boxShadow: "0 -16px 50px rgba(0,0,0,0.25)" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div style={{ fontWeight: 950 }}>Yeni Proje</div>
              <button style={btn} onClick={() => setDrawerOpen(false)}>Kapat</button>
            </div>

            <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 900, color: "#333" }}>
                Proje adı
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn: Çivril Villa"
                  style={{ width: "100%", marginTop: 6, padding: 12, borderRadius: 14, border: "1px solid rgba(0,0,0,0.14)", fontWeight: 900 }} />
              </label>

              <label style={{ fontSize: 12, fontWeight: 900, color: "#333" }}>
                Müşteri adı
                <input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Örn: Ahmet Yılmaz"
                  style={{ width: "100%", marginTop: 6, padding: 12, borderRadius: 14, border: "1px solid rgba(0,0,0,0.14)", fontWeight: 900 }} />
              </label>

              <label style={{ fontSize: 12, fontWeight: 900, color: "#333" }}>
                Telefon (opsiyonel)
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05xx..."
                  style={{ width: "100%", marginTop: 6, padding: 12, borderRadius: 14, border: "1px solid rgba(0,0,0,0.14)", fontWeight: 900 }} />
              </label>

              <label style={{ fontSize: 12, fontWeight: 900, color: "#333" }}>
                Adres (opsiyonel)
                <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Mahalle / Sokak / İlçe..."
                  style={{ width: "100%", marginTop: 6, padding: 12, borderRadius: 14, border: "1px solid rgba(0,0,0,0.14)", fontWeight: 900 }} />
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button style={btn} onClick={() => setDrawerOpen(false)}>İptal</button>
                <button style={btnPrimary} onClick={createProject} disabled={!String(name).trim() || !String(customer).trim()}>
                  Oluştur
                </button>
              </div>
            </div>

            <div style={{ height: 6 }} />
          </div>
        </div>
      )}
    </div>
  );
}