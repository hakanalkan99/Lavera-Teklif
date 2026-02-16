import React, { useMemo, useState } from "react";

export default function ProjectsScreen({ state, setState, goSettings, openProject }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [name, setName] = useState("");
  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Durum filtre sekmesi
  const [statusFilter, setStatusFilter] = useState("Tümü"); // "Tümü" | "Teklif" | "Beklemede" | "Onaylandı" | "Revize"

  function uid() {
    return (crypto?.randomUUID && crypto.randomUUID()) || String(Date.now() + Math.random());
  }

  function toNum(v) {
    const n = Number(String(v ?? "").replace(",", ".").replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }

  function roundUpThousands(n) {
    const x = Number(n || 0);
    return Math.ceil(x / 1000) * 1000;
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

  // ---------- SETTINGS (same as ProjectScreen) ----------
  const settings = state?.settings || {};
  const materialPrices = settings.materialPrices || { MDFLAM: 100, HGloss: 120, LakPanel: 150, Lake: 200 };
  const coeff = settings.coefficients || { hilton: 1.0, tv: 1.0, seperator: 1.0, coffee: 1.0 };
  const accessoriesDefs = settings.accessories || [];
  const doorUnit = settings.doorPrice ?? 12000;
  const skirtingUnit = settings.skirtingPricePerMeter ?? 300;

  function normalizeType(t) {
    const x = String(t || "").toLowerCase().trim();
    if (x.includes("mutfak") || x.includes("kitchen")) return "Mutfak";
    if (x.includes("kahve") || x.includes("coffee")) return "Kahve Köşesi";
    if (x.includes("hilton")) return "Hilton";
    if (x.includes("seper") || x.includes("separat") || x.includes("divider")) return "Seperatör";
    if (x.includes("tv")) return "TV Ünitesi";
    if (x.includes("kapı") || x.includes("kapi") || x.includes("door")) return "Kapı";
    if (x.includes("süpür") || x.includes("supur") || x.includes("skirting")) return "Süpürgelik";
    if (x.includes("revize")) return "Revize";
    return "Sade Kalem";
  }

  function factorFromDims(widthCm, heightCm, depthCm) {
    const w = Math.max(0, widthCm) / 100;
    const h = Math.max(0, heightCm) / 100;
    const d = Math.max(0, depthCm) / 100;
    return w * h * (1 + d);
  }

  function calcKitchenPrice(data) {
    const shape = data.shape || "Duz";
    const ceiling = toNum(data.ceilingCm ?? 260);

    const fridge = toNum(data.fridgeCm ?? 90);
    const tallOven = toNum(data.tallOvenCm ?? 60);
    const tallTotal = fridge + tallOven;

    const mat = data.material || "Lake";
    const unit = materialPrices[mat] || 0;

    const altDepthFactor = 1.6;

    let runAltCm = 0;

    if (shape === "Duz") {
      const totalWall = toNum(data.totalWallCm ?? 600);
      runAltCm = Math.max(0, totalWall - tallTotal);
    }
    if (shape === "L") {
      const a = toNum(data.wallAcm ?? 400);
      const b = toNum(data.wallBcm ?? 500);
      runAltCm = Math.max(0, a + b - tallTotal - 60);
    }
    if (shape === "U") {
      const a = toNum(data.wallAcm ?? 300);
      const b = toNum(data.wallBcm ?? 300);
      const c = toNum(data.wallCcm ?? 300);
      runAltCm = Math.max(0, a + b + c - tallTotal - 120);
    }

    const island = toNum(data.islandCm ?? 0);
    runAltCm += Math.max(0, island);

    const altFactor = (runAltCm / 100) * 1.0 * altDepthFactor;
    const tallFactor = (tallTotal / 100) * (ceiling / 100) * altDepthFactor;

    const upperMode = data.upperMode || "IkiKat";
    let upperFactor = 0;
    if (upperMode === "IkiKat") upperFactor = (runAltCm / 100) * 1.1 * 1.35;
    else if (upperMode === "Full") upperFactor = (runAltCm / 100) * 1.1 * 1.35;
    else upperFactor = 0;

    const totalFactor = altFactor + tallFactor + upperFactor;
    return { factor: totalFactor, price: totalFactor * unit };
  }

  function calcCoffeePrice(data) {
    const mat = data.material || "Lake";
    const unit = materialPrices[mat] || 0;

    const runAltCm = toNum(data.runAltCm ?? 120);
    const ceiling = toNum(data.ceilingCm ?? 260);

    const altFactor = (runAltCm / 100) * 1.0 * 1.6;

    const tallCm = toNum(data.tallTotalCm ?? 0);
    const tallFactor = (tallCm / 100) * (ceiling / 100) * 1.6;

    const hasUpper = data.hasUpper === true;
    const hasBazali = data.hasBazali === true;

    let upperFactor = 0;
    if (hasUpper) upperFactor += (runAltCm / 100) * 0.7 * 1.35;
    if (hasBazali) upperFactor += (runAltCm / 100) * 0.4 * 1.6;

    const totalFactor = (altFactor + tallFactor + upperFactor) * (coeff.coffee || 1);
    return { factor: totalFactor, price: totalFactor * unit };
  }

  function calcHiltonPrice(data) {
    const mat = data.material || "Lake";
    const unit = materialPrices[mat] || 0;

    const tip = data.tip || "Tip1";
    const size = String(data.size || "80");
    const mirrorCabinet = data.mirrorCabinet === true;

    let base = 1.5; // 80
    if (size === "60") base = 1.0; // 80'in 0.5 eksiği
    if (size === "100") base = 2.0;
    if (size === "120") base = 2.5;

    if (mirrorCabinet) base += 0.5;
    if (tip === "Tip2" || tip === "Tip3") base += 1.0;

    let extra = 0;
    if (tip === "Tip3") {
      extra += factorFromDims(toNum(data.wmW ?? 60), toNum(data.wmH ?? 200), toNum(data.wmD ?? 60));
      extra += factorFromDims(toNum(data.panW ?? 45), toNum(data.panH ?? 200), toNum(data.panD ?? 60));
    }

    const factor = (base + extra) * (coeff.hilton || 1);
    return { factor, price: factor * unit };
  }

  function calcSimplePrice(data) {
    const mat = data.material || "Lake";
    const unit = materialPrices[mat] || 0;
    const factor = factorFromDims(toNum(data.w ?? 100), toNum(data.h ?? 100), toNum(data.d ?? 60));
    return { factor, price: factor * unit };
  }

  function calcSeperatorPrice(data) {
    const mat = data.material || "Lake";
    const unit = materialPrices[mat] || 0;
    const factor = factorFromDims(toNum(data.w ?? 100), toNum(data.h ?? 250), toNum(data.d ?? 10)) * (coeff.seperator || 1);
    return { factor, price: factor * unit };
  }

  function calcTvPrice(data) {
    const mat = data.material || "Lake";
    const unit = materialPrices[mat] || 0;
    const factor = factorFromDims(toNum(data.w ?? 300), toNum(data.h ?? 250), toNum(data.d ?? 40)) * (coeff.tv || 1);
    return { factor, price: factor * unit };
  }

  function calcDoorPrice(data) {
    const qty = Math.max(0, Math.floor(toNum(data.qty ?? 1)));
    return { factor: qty, price: qty * doorUnit };
  }

  function calcSkirtingPrice(data) {
    const m = Math.max(0, toNum(data.m ?? 10));
    return { factor: m, price: m * skirtingUnit };
  }

  function computeItemPrice(it) {
    const type = normalizeType(it.type);
    const data = it.data || {};
    if (type === "Mutfak") return calcKitchenPrice(data).price;
    if (type === "Kahve Köşesi") return calcCoffeePrice(data).price;
    if (type === "Hilton") return calcHiltonPrice(data).price;
    if (type === "Seperatör") return calcSeperatorPrice(data).price;
    if (type === "TV Ünitesi") return calcTvPrice(data).price;
    if (type === "Kapı") return calcDoorPrice(data).price;
    if (type === "Süpürgelik") return calcSkirtingPrice(data).price;
    return calcSimplePrice(data).price;
  }

  function projectTotal(p) {
    const itemsSumRaw = (p.items || []).reduce((s, it) => s + (computeItemPrice(it) || 0), 0);
    const itemsSum = roundUpThousands(itemsSumRaw);

    let accRaw = 0;
    for (const r of p.accessories || []) {
      const def = accessoriesDefs.find((d) => d.id === r.accessoryId);
      if (!def) continue;
      accRaw += (Number(r.quantity) || 0) * (Number(def.unitPrice) || 0);
    }
    const acc = roundUpThousands(accRaw);

    return roundUpThousands(itemsSum + acc);
  }

  function getStatus(p) {
    return p?.status || "Teklif";
  }

  function setStatus(projectId, status) {
    setState((prev) => ({
      ...prev,
      projects: (prev.projects || []).map((p) => (p.id === projectId ? { ...p, status } : p)),
    }));
  }

  const projectsSorted = useMemo(() => {
    return [...(state.projects || [])].sort((a, b) => String(b.createdAtISO || "").localeCompare(String(a.createdAtISO || "")));
  }, [state.projects]);

  const filteredProjects = useMemo(() => {
    if (statusFilter === "Tümü") return projectsSorted;
    return projectsSorted.filter((p) => getStatus(p) === statusFilter);
  }, [projectsSorted, statusFilter]);

  const approvedRevenue = useMemo(() => {
    const approved = (state.projects || []).filter((p) => getStatus(p) === "Onaylandı");
    const sum = approved.reduce((s, p) => s + projectTotal(p), 0);
    return roundUpThousands(sum);
  }, [state.projects, state.settings]);

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
      status: "Teklif",
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

  // Revize: tarih otomatik güncellenir + versiyon A→B→C... + durum "Revize"
  function reviseProject(id) {
    const now = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      projects: (prev.projects || []).map((p) => {
        if (p.id !== id) return p;
        const cur = String(p.currentVersion || "A");
        const ch = cur.charCodeAt(0);
        const next = ch >= 65 && ch < 90 ? String.fromCharCode(ch + 1) : "A";
        return { ...p, offerDateISO: now, currentVersion: next, status: "Revize" };
      }),
    }));
    openProject(id);
  }

  // ---------- UI STYLES ----------
  const page = { minHeight: "100vh", background: "#f6f7fb" };
  const wrap = { maxWidth: 720, margin: "0 auto", padding: 16 };

  const card = {
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 18,
    padding: 14,
    background: "#fff",
    boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
  };

  const btn = {
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  };
  const btnPrimary = { ...btn, background: "#111", color: "#fff", border: "1px solid #111" };
  const btnDanger = { ...btn, borderColor: "rgba(220,38,38,0.25)", color: "#b91c1c" };

  const chip = (active) => ({
    padding: "8px 10px",
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.12)",
    background: active ? "#111" : "#fff",
    color: active ? "#fff" : "#111",
    fontWeight: 950,
    cursor: "pointer",
    fontSize: 12,
  });

  const statusPill = (active) => ({
    padding: "7px 10px",
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.12)",
    background: active ? "#111" : "#fff",
    color: active ? "#fff" : "#111",
    fontWeight: 950,
    cursor: "pointer",
    fontSize: 12,
  });

  const statuses = ["Teklif", "Beklemede", "Onaylandı", "Revize"];

  return (
    <div style={page}>
      <div style={wrap}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div style={{ fontWeight: 950, fontSize: 16 }}>Projeler</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={btn} onClick={goSettings}>
              Ayarlar
            </button>
            <button style={btnPrimary} onClick={openNewProject}>
              + Yeni Proje
            </button>
          </div>
        </div>

        {/* ONAYLANAN CİRO */}
        <div style={{ ...card, marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 950 }}>Onaylanan Ciro</div>
            <div style={{ fontSize: 12, color: "#666", fontWeight: 800 }}>Sadece “Onaylandı” durumundakiler</div>
          </div>
          <div style={{ fontWeight: 950, fontSize: 18 }}>{currency(approvedRevenue)}</div>
        </div>

        {/* DURUM FİLTRE SEKME */}
        <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button style={chip(statusFilter === "Tümü")} onClick={() => setStatusFilter("Tümü")}>
            Tümü
          </button>
          {statuses.map((s) => (
            <button key={s} style={chip(statusFilter === s)} onClick={() => setStatusFilter(s)}>
              {s}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
          {filteredProjects.length === 0 ? (
            <div style={card}>
              <div style={{ fontWeight: 950 }}>Henüz proje yok</div>
              <div style={{ marginTop: 6, color: "#666", fontWeight: 800, fontSize: 13 }}>“+ Yeni Proje” ile ilk teklifi oluştur.</div>
            </div>
          ) : (
            filteredProjects.map((p) => {
              const total = projectTotal(p);
              const st = getStatus(p);

              return (
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
                        <div>
                          Teklif Tarihi: <b>{formatDate(p.offerDateISO || p.createdAtISO)}</b>
                        </div>
                      </div>

                      {/* DURUM DEĞİŞTİR */}
                      <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {statuses.map((x) => (
                          <button key={x} style={statusPill(st === x)} onClick={() => setStatus(p.id, x)}>
                            {x}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 950 }}>{currency(total)}</div>
                      <div style={{ fontSize: 12, color: "#666", fontWeight: 800 }}>Toplam</div>
                      <div style={{ marginTop: 8, fontSize: 12, fontWeight: 950, color: st === "Onaylandı" ? "#047857" : "#111" }}>
                        Durum: {st}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                    <button style={btnPrimary} onClick={() => openProject(p.id)}>
                      Aç
                    </button>
                    <button style={btn} onClick={() => reviseProject(p.id)}>
                      Teklif / Revize
                    </button>
                    <button style={btnDanger} onClick={() => deleteProject(p.id)}>
                      Sil
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* DRAWER - YENİ PROJE */}
      {drawerOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
            zIndex: 50,
          }}
          onClick={() => setDrawerOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 760,
              background: "#fff",
              borderTopLeftRadius: 22,
              borderTopRightRadius: 22,
              padding: 14,
              boxShadow: "0 -16px 50px rgba(0,0,0,0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div style={{ fontWeight: 950 }}>Yeni Proje</div>
              <button style={btn} onClick={() => setDrawerOpen(false)}>
                Kapat
              </button>
            </div>

            <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 900, color: "#333" }}>
                Proje adı
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Örn: Çivril Villa"
                  style={{
                    width: "100%",
                    marginTop: 6,
                    padding: 12,
                    borderRadius: 14,
                    border: "1px solid rgba(0,0,0,0.14)",
                    fontWeight: 900,
                  }}
                />
              </label>

              <label style={{ fontSize: 12, fontWeight: 900, color: "#333" }}>
                Müşteri adı
                <input
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  placeholder="Örn: Ahmet Yılmaz"
                  style={{
                    width: "100%",
                    marginTop: 6,
                    padding: 12,
                    borderRadius: 14,
                    border: "1px solid rgba(0,0,0,0.14)",
                    fontWeight: 900,
                  }}
                />
              </label>

              <label style={{ fontSize: 12, fontWeight: 900, color: "#333" }}>
                Telefon (opsiyonel)
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="05xx..."
                  style={{
                    width: "100%",
                    marginTop: 6,
                    padding: 12,
                    borderRadius: 14,
                    border: "1px solid rgba(0,0,0,0.14)",
                    fontWeight: 900,
                  }}
                />
              </label>

              <label style={{ fontSize: 12, fontWeight: 900, color: "#333" }}>
                Adres (opsiyonel)
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Mahalle / Sokak / İlçe..."
                  style={{
                    width: "100%",
                    marginTop: 6,
                    padding: 12,
                    borderRadius: 14,
                    border: "1px solid rgba(0,0,0,0.14)",
                    fontWeight: 900,
                  }}
                />
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button style={btn} onClick={() => setDrawerOpen(false)}>
                  İptal
                </button>
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