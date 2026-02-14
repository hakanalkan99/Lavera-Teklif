import React, { useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function ProjectScreen({ projectId, state, setState, onBack }) {
  const project = state.projects.find((p) => p.id === projectId);
  const settings = state.settings || {};

  const [tab, setTab] = useState("kalemler");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const offerRef = useRef(null);

  function toNum(v) {
    const n = Number(String(v ?? "").replace(",", ".").replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }

  function currency(n) {
    const x = Number(n || 0);
    try {
      return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(x);
    } catch {
      return `${Math.round(x)} ₺`;
    }
  }

  // ✅ Teklifte yukarı yuvarla: binlere
  function roundUp1000(n) {
    const x = Number(n || 0);
    if (!Number.isFinite(x)) return 0;
    return Math.ceil(x / 1000) * 1000;
  }

  function uid() {
    return (crypto?.randomUUID && crypto.randomUUID()) || String(Date.now() + Math.random());
  }

  function formatDate(iso) {
    const d = iso ? new Date(iso) : new Date();
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = d.getFullYear();
    return `${dd}.${mm}.${yy}`;
  }

  // ✅ Katsayılar (default=1)
  const coeffs = settings.coeffs || {};
  const K_HILTON = Number(coeffs.hilton ?? 1) || 1;
  const K_SEP = Number(coeffs.seperator ?? 1) || 1;
  const K_TV = Number(coeffs.tv ?? 1) || 1;

  const materialPrices = settings.materialPrices || { MDFLAM: 100, HGloss: 120, LakPanel: 150, Lake: 200 };
  const accessoriesDefs = settings.accessories || [];
  const company = settings.companyInfo || {}; // ✅ teklif anteti

  function factorFromDims(widthCm, heightCm, depthCm) {
    const w = Math.max(0, widthCm) / 100;
    const h = Math.max(0, heightCm) / 100;
    const d = Math.max(0, depthCm) / 100;
    return w * h * (1 + d);
  }

  function normalizeName(s) {
    return String(s || "").trim().replace(/\s+/g, " ");
  }

  function uniqueName(baseName) {
    const base = normalizeName(baseName) || "Kalem";
    const existing = new Set((project?.items || []).map((x) => normalizeName(x.name)));
    if (!existing.has(base)) return base;
    let i = 2;
    while (existing.has(`${base} ${i}`)) i++;
    return `${base} ${i}`;
  }

  const totalItems = useMemo(() => {
    if (!project) return 0;
    return (project.items || []).reduce((sum, it) => sum + (Number(it.price) || 0), 0);
  }, [project]);

  const totalAccessories = useMemo(() => {
    if (!project) return 0;
    const rows = project.accessories || [];
    let total = 0;
    for (const r of rows) {
      const def = accessoriesDefs.find((a) => a.id === r.accessoryId);
      if (!def) continue;
      total += (Number(r.quantity) || 0) * (Number(def.unitPrice) || 0);
    }
    return total;
  }, [project, accessoriesDefs]);

  const visibleAccessories = useMemo(() => {
    if (!project) return [];
    const used = new Set((project.accessories || []).map((x) => x.accessoryId));
    const vis = (accessoriesDefs || []).filter((a) => a.isActive || used.has(a.id));
    return vis.slice().sort((a, b) => String(a.name).localeCompare(String(b.name), "tr"));
  }, [project, accessoriesDefs]);

  function setAccessoryQty(accessoryId, qty) {
    const q = Math.max(0, Math.floor(qty || 0));
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id !== projectId) return p;
        const cur = p.accessories || [];
        const exist = cur.find((x) => x.accessoryId === accessoryId);

        let next = cur.slice();
        if (!exist) {
          if (q > 0) next = [{ accessoryId, quantity: q }, ...next];
        } else {
          next = next.map((x) => (x.accessoryId === accessoryId ? { ...x, quantity: q } : x));
          next = next.filter((x) => x.quantity > 0);
        }
        return { ...p, accessories: next };
      }),
    }));
  }

  // Drawer drafts
  const [draftType, setDraftType] = useState("sade");
  const [draftName, setDraftName] = useState("");
  const [material, setMaterial] = useState("Lake");

  const [wCm, setWCm] = useState("");
  const [hCm, setHCm] = useState("");
  const [dCm, setDCm] = useState("");

  const [doorQty, setDoorQty] = useState("");
  const [skM, setSkM] = useState("");

  // Hilton
  const [hQty, setHQty] = useState("1");
  const [hHasMirror, setHHasMirror] = useState(true);

  // ✅ 60 eklendi
  const HILTON_TYPES = [
    { key: "H60", label: "Hilton 60 cm", widthCm: 60 },
    { key: "H80", label: "Hilton 80 cm", widthCm: 80 },
    { key: "H100", label: "Hilton 100 cm", widthCm: 100 },
    { key: "H120", label: "Hilton 120 cm", widthCm: 120 },
  ];
  const [hTypeKey, setHTypeKey] = useState("H100");
  function hiltonType() {
    return HILTON_TYPES.find((x) => x.key === hTypeKey) || HILTON_TYPES[2];
  }

  function resetDrawer(nextType = "sade") {
    setDraftType(nextType);
    setDraftName("");
    setMaterial("Lake");

    setWCm("");
    setHCm("");
    setDCm("");

    setDoorQty("");
    setSkM("");

    setHQty("1");
    setHHasMirror(true);
    setHTypeKey("H100");
  }

  function openDrawer() {
    resetDrawer("sade");
    setDrawerOpen(true);
  }

  function autoName(t) {
    const list = (project?.items || []).filter((x) => x.type === t).length + 1;
    if (t === "hilton") return `Hilton ${list}`;
    if (t === "sade") return `Sade Kalem ${list}`;
    if (t === "seperator") return `Seperatör ${list}`;
    if (t === "tv") return `TV Ünitesi ${list}`;
    if (t === "kapi") return `Kapı ${list}`;
    if (t === "supurgelik") return `Süpürgelik ${list}`;
    return `Kalem ${list}`;
  }

  function hiltonCalc() {
    const qty = Math.max(0, Math.floor(toNum(hQty)));
    const w = hiltonType().widthCm;

    const baseFactor = factorFromDims(w, 90, 55);
    const mirrorFactor = hHasMirror ? factorFromDims(w, 70, 20) : 0;

    // ✅ 60'lık: 80'in katsayısından 0.5 eksik gibi davranır (bizde temel katsayı K_HILTON)
    const k = hTypeKey === "H60" ? Math.max(0.1, K_HILTON - 0.5) : K_HILTON;

    const perUnitFactor = (baseFactor + mirrorFactor) * k;
    return { qty, w, perUnitFactor, factor: qty * perUnitFactor, kUsed: k };
  }

  function addItem() {
    if (!project) return;

    const baseName = normalizeName(draftName) || autoName(draftType);
    const name = uniqueName(baseName);

    const unit = Number(materialPrices[material] || 0);
    let price = 0;
    let item = { id: uid(), type: draftType, name, price: 0, meta: {} };

    if (draftType === "sade" || draftType === "seperator" || draftType === "tv") {
      const w = toNum(wCm);
      const h = toNum(hCm);
      const d = toNum(dCm);

      let k = 1;
      if (draftType === "seperator") k = K_SEP;
      if (draftType === "tv") k = K_TV;

      const raw = factorFromDims(w, h, d);
      const factor = raw * k;

      price = factor * unit;
      item = { ...item, price, meta: { material, unit, factor, rawFactor: raw, k, w, h, d } };
    }

    if (draftType === "hilton") {
      const { qty, w, perUnitFactor, factor, kUsed } = hiltonCalc();
      price = factor * unit;
      item = {
        ...item,
        price,
        meta: {
          material,
          unit,
          factor,
          qty,
          widthCm: w,
          typeKey: hTypeKey,
          typeLabel: hiltonType().label,
          perUnitFactor,
          hasMirror: hHasMirror,
          k: kUsed,
        },
      };
    }

    if (draftType === "kapi") {
      const qty = Math.max(0, Math.floor(toNum(doorQty)));
      const doorUnit = Number(settings.doorPrice || 12000);
      price = qty * doorUnit;
      item = { ...item, price, meta: { qty, unit: doorUnit } };
    }

    if (draftType === "supurgelik") {
      const m = Math.max(0, toNum(skM));
      const skUnit = Number(settings.skirtingPricePerMeter || 300);
      price = m * skUnit;
      item = { ...item, price, meta: { m, unit: skUnit } };
    }

    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => (p.id === projectId ? { ...p, items: [item, ...(p.items || [])] } : p)),
    }));

    setDrawerOpen(false);
  }

  function deleteItem(itemId) {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => (p.id === projectId ? { ...p, items: (p.items || []).filter((x) => x.id !== itemId) } : p)),
    }));
  }

  // ✅ Teklif satırları (Hilton aynı tipleri grupla)
  const offerRows = useMemo(() => {
    if (!project) return [];
    const items = project.items || [];

    const hiltons = items.filter((x) => String(x.type).toLowerCase() === "hilton");
    const others = items.filter((x) => String(x.type).toLowerCase() !== "hilton");

    const rows = [];

    if (hiltons.length > 0) {
      const map = new Map();
      for (const h of hiltons) {
        const key = h?.meta?.typeKey || "H100";
        const label = h?.meta?.typeLabel || "Hilton";
        const qty = Number(h?.meta?.qty) || 1;
        const total = Number(h.price) || 0;
        const detail = h?.meta?.material || "-";

        const cur = map.get(key);
        if (!cur) map.set(key, { label, total, qty, detail });
        else map.set(key, { ...cur, total: cur.total + total, qty: cur.qty + qty });
      }

      for (const [, v] of map) {
        rows.push({
          key: `hilton-${v.label}`,
          label: `${v.label} (${v.qty} adet)`,
          detail: v.detail,
          total: v.total,
          isGroup: true,
        });
      }
    }

    for (const it of others) {
      const t = String(it.type || "").toLowerCase();
      const detail = t === "kapi" || t === "supurgelik" ? "Lake" : it?.meta?.material ? it.meta.material : "-";
      rows.push({ key: it.id, label: it.name, detail, total: Number(it.price) || 0, isGroup: false });
    }

    return rows;
  }, [project]);

  // ✅ Teklifte yuvarlanmış hesaplar
  const offerRowsRounded = useMemo(() => {
    return (offerRows || []).map((r) => ({
      ...r,
      roundedTotal: roundUp1000(r.total),
    }));
  }, [offerRows]);

  const teklifKalemlerRoundedTotal = useMemo(() => {
    return offerRowsRounded.reduce((s, r) => s + (Number(r.roundedTotal) || 0), 0);
  }, [offerRowsRounded]);

  const teklifAccessoriesRoundedTotal = useMemo(() => {
    return roundUp1000((project?.accessories || []).reduce((sum, a) => {
      const def = accessoriesDefs.find((x) => x.id === a.accessoryId);
      if (!def) return sum;
      return sum + (Number(a.quantity) || 0) * (Number(def.unitPrice) || 0);
    }, 0));
  }, [project, accessoriesDefs]);

  const teklifGrandRoundedTotal = teklifKalemlerRoundedTotal + teklifAccessoriesRoundedTotal;

  // ✅ Export helpers
  async function captureOfferCanvas() {
    if (!offerRef.current) return null;
    const canvas = await html2canvas(offerRef.current, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
    });
    return canvas;
  }

  async function downloadJPG() {
    const canvas = await captureOfferCanvas();
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
    const a = document.createElement("a");
    const code = `${project.projectNumber}${project.currentVersion || "A"}`;
    a.download = `${code}-${project.name}-teklif.jpg`.replace(/[\\/:*?"<>|]/g, "-");
    a.href = dataUrl;
    a.click();
  }

  async function downloadPDF() {
    const canvas = await captureOfferCanvas();
    if (!canvas) return;

    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    // A4 mm
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidthPx = canvas.width;
    const imgHeightPx = canvas.height;

    // px -> mm ölçekle (oran koru, sayfaya sığdır)
    const ratio = Math.min(pageWidth / imgWidthPx, pageHeight / imgHeightPx);
    const w = imgWidthPx * ratio;
    const h = imgHeightPx * ratio;

    const x = (pageWidth - w) / 2;
    const y = (pageHeight - h) / 2;

    pdf.addImage(imgData, "JPEG", x, y, w, h, undefined, "FAST");

    const code = `${project.projectNumber}${project.currentVersion || "A"}`;
    pdf.save(`${code}-${project.name}-teklif.pdf`.replace(/[\\/:*?"<>|]/g, "-"));
  }

  if (!project) {
    return (
      <div style={{ padding: 16 }}>
        <button onClick={onBack}>← Projeler</button>
        <p>Proje bulunamadı.</p>
      </div>
    );
  }

  const offerDateISO = project.offerDateISO || project.createdAtISO || new Date().toISOString();
  const rev = project.currentVersion || "A";

  const page = { minHeight: "100vh", background: "#f6f7fb" };
  const wrap = { maxWidth: 860, margin: "0 auto", padding: 16 };
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
    fontWeight: 800,
    cursor: "pointer",
  };
  const btnPrimary = { ...btn, background: "#111", color: "#fff", border: "1px solid #111" };
  const pill = (active) => ({
    padding: "10px 12px",
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.12)",
    background: active ? "#111" : "#fff",
    color: active ? "#fff" : "#111",
    fontWeight: 900,
    cursor: "pointer",
    whiteSpace: "nowrap",
  });

  function typeLabel(t) {
    const x = String(t || "").toLowerCase();
    if (x === "hilton") return "Hilton";
    if (x === "sade") return "Sade Kalem";
    if (x === "seperator") return "Seperatör";
    if (x === "tv") return "TV Ünitesi";
    if (x === "kapi") return "Kapı";
    if (x === "supurgelik") return "Süpürgelik";
    return t;
  }

  // ✅ Teklif anteti (çıktı gibi)
  function OfferHeader() {
    const hasAnyCompany =
      company.logoDataUrl ||
      company.name ||
      company.address ||
      company.phone ||
      company.email ||
      company.instagram;

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 1.2fr 0.7fr",
          gap: 12,
          alignItems: "stretch",
        }}
      >
        {/* Sol üst: Logo + Firma */}
        <div
          style={{
            border: "1px dashed rgba(0,0,0,0.18)",
            borderRadius: 14,
            padding: 12,
            minHeight: 90,
          }}
        >
          {company.logoDataUrl ? (
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <img
                src={company.logoDataUrl}
                alt="Logo"
                style={{ width: 54, height: 54, objectFit: "contain", borderRadius: 10, background: "#fff" }}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 950, lineHeight: 1.2 }}>{company.name || "Firma Adı"}</div>
                <div style={{ fontSize: 12, color: "#555", fontWeight: 800, marginTop: 2 }}>
                  {company.phone ? <div>{company.phone}</div> : null}
                  {company.email ? <div>{company.email}</div> : null}
                </div>
              </div>
            </div>
          ) : hasAnyCompany ? (
            <div style={{ display: "grid", gap: 2 }}>
              <div style={{ fontWeight: 950 }}>{company.name || "Firma Adı"}</div>
              {company.address ? <div style={{ fontSize: 12, color: "#555", fontWeight: 800 }}>{company.address}</div> : null}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 12, color: "#555", fontWeight: 800 }}>
                {company.phone ? <span>{company.phone}</span> : null}
                {company.email ? <span>{company.email}</span> : null}
                {company.instagram ? <span>{company.instagram}</span> : null}
              </div>
            </div>
          ) : (
            <div style={{ color: "#666", fontWeight: 900, fontSize: 12 }}>
              Logo / Firma Bilgileri
              <div style={{ fontWeight: 800, color: "#888", marginTop: 6 }}>
                (Ayarlar &gt; Firma Bilgileri)
              </div>
            </div>
          )}
        </div>

        {/* Orta: Proje + Müşteri */}
        <div
          style={{
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 14,
            padding: 12,
            display: "grid",
            alignContent: "center",
            textAlign: "center",
            minHeight: 90,
          }}
        >
          <div style={{ fontWeight: 1000, fontSize: 16, letterSpacing: 0.2 }}>{project.name}</div>
          <div style={{ fontWeight: 950, marginTop: 4 }}>{project.customerName}</div>
          <div style={{ marginTop: 4, fontSize: 12, color: "#555", fontWeight: 800 }}>
            {project.phone ? <span>Tel: {project.phone}</span> : null}
            {project.phone && project.address ? <span> • </span> : null}
            {project.address ? <span>Adres: {project.address}</span> : null}
          </div>
        </div>

        {/* Sağ: Tarih + Kod */}
        <div
          style={{
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 14,
            padding: 12,
            minHeight: 90,
            display: "grid",
            gap: 6,
            alignContent: "center",
            textAlign: "right",
          }}
        >
          <div style={{ fontSize: 12, color: "#666", fontWeight: 900 }}>Teklif Tarihi</div>
          <div style={{ fontWeight: 1000 }}>{formatDate(offerDateISO)}</div>

          <div style={{ fontSize: 12, color: "#666", fontWeight: 900, marginTop: 2 }}>Kod / Revize</div>
          <div style={{ fontWeight: 1000 }}>
            {project.projectNumber}
            {rev} <span style={{ color: "#666", fontWeight: 900 }}>({rev})</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={page}>
      <div style={wrap}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <button onClick={onBack} style={btn}>
            ← Projeler
          </button>
          <div style={{ fontWeight: 950, fontSize: 16, textAlign: "right" }}>
            {project.name}
            <div style={{ fontSize: 12, color: "#666", fontWeight: 700, lineHeight: 1.4 }}>
              {project.customerName} • Kod: {project.projectNumber}
              {project.currentVersion}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12, overflowX: "auto", paddingBottom: 4 }}>
          <button style={pill(tab === "kalemler")} onClick={() => setTab("kalemler")}>
            Kalemler
          </button>
          <button style={pill(tab === "aksesuarlar")} onClick={() => setTab("aksesuarlar")}>
            Aksesuarlar
          </button>
          <button style={pill(tab === "teklif")} onClick={() => setTab("teklif")}>
            Teklif
          </button>
        </div>

        {tab === "kalemler" && (
          <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 950 }}>Kalemler</div>
                  <div style={{ color: "#666", fontSize: 12, fontWeight: 700 }}>Toplam: {currency(totalItems)}</div>
                </div>
                <button style={btnPrimary} onClick={openDrawer}>
                  + Kalem Ekle
                </button>
              </div>
              <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", gap: 10 }}>
                <button style={btn} onClick={() => setTab("aksesuarlar")}>
                  → Aksesuarlara Geç
                </button>
                <button style={btn} onClick={() => setTab("teklif")}>
                  → Teklife Geç
                </button>
              </div>
            </div>

            {(project.items || []).length === 0 ? (
              <div style={card}>
                <div style={{ fontWeight: 950 }}>Kalem yok</div>
                <div style={{ color: "#666", fontSize: 13, marginTop: 4 }}>“+ Kalem Ekle” ile başlayalım.</div>
              </div>
            ) : (
              (project.items || []).map((it) => (
                <div key={it.id} style={card}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 950, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.name}</div>
                      <div style={{ fontSize: 12, color: "#666", fontWeight: 700 }}>
                        Tip: {typeLabel(it.type)}
                        {it?.meta?.material ? ` • Malzeme: ${it.meta.material}` : ""}
                        {String(it.type).toLowerCase() === "hilton" && it?.meta?.typeLabel ? ` • ${it.meta.typeLabel}` : ""}
                        {String(it.type).toLowerCase() === "kapi" ? ` • (${it?.meta?.qty || 0} adet)` : ""}
                        {String(it.type).toLowerCase() === "supurgelik" ? ` • (${it?.meta?.m || 0} m)` : ""}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 950 }}>{currency(it.price)}</div>
                      <button
                        onClick={() => deleteItem(it.id)}
                        style={{ ...btn, marginTop: 8, borderColor: "rgba(220,38,38,0.25)", color: "#b91c1c" }}
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "aksesuarlar" && (
          <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
            <div style={card}>
              <div style={{ fontWeight: 950 }}>Aksesuarlar</div>
              <div style={{ color: "#666", fontSize: 13, marginTop: 4 }}>Adet gir. Teklifte toplam yuvarlanarak gösterilir.</div>

              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 10 }}>
                <button style={btn} onClick={() => setTab("kalemler")}>
                  ← Kalemlere Dön
                </button>
                <button style={btnPrimary} onClick={() => setTab("teklif")}>
                  → Teklife Geç
                </button>
              </div>

              <div style={{ marginTop: 10, fontWeight: 900, color: "#111" }}>Aksesuar Toplamı: {currency(totalAccessories)}</div>
            </div>

            {visibleAccessories.length === 0 ? (
              <div style={card}>
                <div style={{ fontWeight: 950 }}>Aksesuar listesi boş</div>
                <div style={{ color: "#666", fontSize: 13, marginTop: 4 }}>Ayarlar’dan aksesuar ekle veya aktif et.</div>
              </div>
            ) : (
              visibleAccessories.map((a) => {
                const qty = (project.accessories || []).find((x) => x.accessoryId === a.id)?.quantity || 0;
                return (
                  <div key={a.id} style={card}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 950, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.name}</div>
                        <div style={{ fontSize: 12, color: "#666", fontWeight: 700 }}>{a.isActive ? "Aktif" : "Pasif"}</div>
                      </div>

                      <div style={{ width: 120 }}>
                        <input
                          value={String(qty)}
                          onChange={(e) => setAccessoryQty(a.id, Math.floor(toNum(e.target.value)))}
                          inputMode="numeric"
                          style={{
                            width: "100%",
                            padding: 12,
                            borderRadius: 14,
                            border: "1px solid rgba(0,0,0,0.14)",
                            textAlign: "right",
                            fontWeight: 900,
                          }}
                        />
                        <div style={{ fontSize: 11, color: "#666", fontWeight: 700, textAlign: "right", marginTop: 4 }}>adet</div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === "teklif" && (
          <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
            {/* ✅ Export butonları */}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button style={btn} onClick={downloadJPG}>JPG Kaydet</button>
              <button style={btnPrimary} onClick={downloadPDF}>PDF Kaydet</button>
            </div>

            {/* ✅ Burayı screenshot alıyoruz */}
            <div ref={offerRef} style={{ ...card, background: "#fff" }}>
              <OfferHeader />

              <div style={{ marginTop: 12, border: "1px solid rgba(0,0,0,0.08)", borderRadius: 14, overflow: "hidden" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 180px 160px",
                    background: "#f1f2f6",
                    padding: 10,
                    fontSize: 12,
                    fontWeight: 950,
                  }}
                >
                  <div>Kalem</div>
                  <div style={{ textAlign: "right" }}>Detay</div>
                  <div style={{ textAlign: "right" }}>Tutar</div>
                </div>

                {offerRowsRounded.length === 0 ? (
                  <div style={{ padding: 12, fontWeight: 800, color: "#666" }}>Kalem yok.</div>
                ) : (
                  offerRowsRounded.map((r) => (
                    <div
                      key={r.key}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 180px 160px",
                        padding: 10,
                        borderTop: "1px solid rgba(0,0,0,0.06)",
                      }}
                    >
                      <div style={{ fontWeight: r.isGroup ? 1000 : 900 }}>{r.label}</div>
                      <div style={{ textAlign: "right", fontWeight: 850, color: "#555" }}>{r.detail}</div>
                      <div style={{ textAlign: "right", fontWeight: 1000 }}>{currency(r.roundedTotal)}</div>
                    </div>
                  ))
                )}
              </div>

              <div style={{ marginTop: 14, display: "grid", gap: 6, fontWeight: 900, color: "#111" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Kalemler</span>
                  <span>{currency(teklifKalemlerRoundedTotal)}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Aksesuarlar</span>
                  <span>{currency(teklifAccessoriesRoundedTotal)}</span>
                </div>

                <div style={{ height: 1, background: "rgba(0,0,0,0.08)", margin: "6px 0" }} />

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18 }}>
                  <span>Genel Toplam</span>
                  <span>{currency(teklifGrandRoundedTotal)}</span>
                </div>
              </div>

              <div style={{ marginTop: 10, fontSize: 12, color: "#666", fontWeight: 800, lineHeight: 1.6 }}>
                • KDV dahil değildir. <br />
                • Montaj dahildir. <br />
                • Kapılar standart seri üzerinden hesaplanmıştır, kapı kolu hariçtir.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Drawer */}
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
              <div style={{ fontWeight: 950 }}>Kalem Ekle</div>
              <button style={btn} onClick={() => setDrawerOpen(false)}>
                Kapat
              </button>
            </div>

            <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 900, color: "#333" }}>
                Kalem Türü
                <select
                  value={draftType}
                  onChange={(e) => {
                    const t = e.target.value;
                    resetDrawer(t);
                    setDraftType(t);
                  }}
                  style={{
                    width: "100%",
                    marginTop: 6,
                    padding: 12,
                    borderRadius: 14,
                    border: "1px solid rgba(0,0,0,0.14)",
                    fontWeight: 900,
                  }}
                >
                  <option value="hilton">Hilton</option>
                  <option value="sade">Sade Kalem (Vestiyer/Kiler/Yüklük vb.)</option>
                  <option value="seperator">Seperatör</option>
                  <option value="tv">TV Ünitesi</option>
                  <option value="kapi">Kapı (adet)</option>
                  <option value="supurgelik">Süpürgelik (metre)</option>
                </select>
              </label>

              <label style={{ fontSize: 12, fontWeight: 900, color: "#333" }}>
                Kalem adı (istersen değiştir)
                <input
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder={autoName(draftType)}
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

              {draftType !== "kapi" && draftType !== "supurgelik" && (
                <label style={{ fontSize: 12, fontWeight: 900, color: "#333" }}>
                  Malzeme
                  <select
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    style={{
                      width: "100%",
                      marginTop: 6,
                      padding: 12,
                      borderRadius: 14,
                      border: "1px solid rgba(0,0,0,0.14)",
                      fontWeight: 900,
                    }}
                  >
                    <option value="MDFLAM">MDFLAM</option>
                    <option value="HGloss">High Gloss</option>
                    <option value="LakPanel">Lak Panel</option>
                    <option value="Lake">Lake</option>
                  </select>
                </label>
              )}

              {(draftType === "sade" || draftType === "seperator" || draftType === "tv") && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  <input value={wCm} onChange={(e) => setWCm(e.target.value)} placeholder="En (cm)" inputMode="numeric" style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(0,0,0,0.14)", fontWeight: 900 }} />
                  <input value={hCm} onChange={(e) => setHCm(e.target.value)} placeholder="Yükseklik (cm)" inputMode="numeric" style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(0,0,0,0.14)", fontWeight: 900 }} />
                  <input value={dCm} onChange={(e) => setDCm(e.target.value)} placeholder="Derinlik (cm)" inputMode="numeric" style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(0,0,0,0.14)", fontWeight: 900 }} />
                </div>
              )}

              {draftType === "hilton" && (
                <div style={{ display: "grid", gap: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 900, color: "#333" }}>
                    Hilton tipi
                    <select value={hTypeKey} onChange={(e) => setHTypeKey(e.target.value)} style={{ width: "100%", marginTop: 6, padding: 12, borderRadius: 14, border: "1px solid rgba(0,0,0,0.14)", fontWeight: 900 }}>
                      {HILTON_TYPES.map((t) => (
                        <option key={t.key} value={t.key}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <input value={hQty} onChange={(e) => setHQty(e.target.value)} placeholder="Adet" inputMode="numeric" style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(0,0,0,0.14)", fontWeight: 900 }} />
                  <label style={{ display: "flex", alignItems: "center", gap: 10, padding: 12, borderRadius: 14, border: "1px solid rgba(0,0,0,0.14)" }}>
                    <input type="checkbox" checked={hHasMirror} onChange={(e) => setHHasMirror(e.target.checked)} />
                    <span style={{ fontWeight: 900 }}>Ayna dolabı var</span>
                  </label>
                </div>
              )}

              {draftType === "kapi" && (
                <input value={doorQty} onChange={(e) => setDoorQty(e.target.value)} placeholder="Adet" inputMode="numeric" style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(0,0,0,0.14)", fontWeight: 900 }} />
              )}

              {draftType === "supurgelik" && (
                <input value={skM} onChange={(e) => setSkM(e.target.value)} placeholder="Metre (m)" inputMode="numeric" style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(0,0,0,0.14)", fontWeight: 900 }} />
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
                <button style={btn} onClick={() => setDrawerOpen(false)}>
                  İptal
                </button>
                <button style={btnPrimary} onClick={addItem}>
                  Kaydet
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