import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";

/**
 * ProjectScreen.jsx
 * - Corporate UI
 * - Offer A4 auto-fit + logo + notes + signature + high quality JPEG export
 * - Drawer inputs: NO setState on every keystroke (fixes focus/keyboard drop on Win+mobile)
 */

export default function ProjectScreen({ projectId, state, setState, onBack }) {
  const project = (state.projects || []).find((p) => p.id === projectId);

  // ---------------- SETTINGS ----------------
  const settings = state?.settings || {};
  const materialPrices = settings.materialPrices || { MDFLAM: 100, HGloss: 120, LakPanel: 150, Lake: 200 };
  const coeff = settings.coefficients || { hilton: 1.0, tv: 1.0, seperator: 1.0, coffee: 1.0 };
  const accessoriesDefs = settings.accessories || [];
  const doorUnit = settings.doorPrice ?? 12000;
  const skirtingUnit = settings.skirtingPricePerMeter ?? 300;

  // ---------------- UI STATE ----------------
  const [tab, setTab] = useState("kalemler");
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Drawer state
  const [draftType, setDraftType] = useState("Mutfak");
  const [draftName, setDraftName] = useState("");
  const [draftData, setDraftData] = useState({}); // committed data only (blur/enter)
  const draftDataRef = useRef({}); // live typing data (no rerender each key)

  // ---------------- HELPERS ----------------
  function nowISO() {
    return new Date().toISOString();
  }
  function formatDate(iso) {
    try {
      const d = new Date(iso);
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yy = d.getFullYear();
      return `${dd}.${mm}.${yy}`;
    } catch {
      return "";
    }
  }
  function toNum(v) {
    const n = Number(String(v ?? "").replace(",", ".").replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  function toInt(v) {
    return Math.max(0, Math.floor(toNum(v)));
  }
  function roundUpThousands(n) {
    const x = Number(n || 0);
    return Math.ceil(x / 1000) * 1000;
  }
  function currency(n) {
    try {
      return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(Number(n || 0));
    } catch {
      return `${Math.round(Number(n || 0))} ₺`;
    }
  }

  function normalizeType(t) {
    const x = String(t || "").toLowerCase().trim();
    if (x.includes("mutfak") || x.includes("kitchen")) return "Mutfak";
    if (x.includes("kahve") || x.includes("coffee")) return "Kahve Köşesi";
    if (x.includes("hilton")) return "Hilton";
    if (x.includes("seper") || x.includes("separat") || x.includes("divider")) return "Seperatör";
    if (x.includes("tv")) return "TV Ünitesi";
    if (x.includes("kapı") || x.includes("kapi") || x.includes("door")) return "Kapı";
    if (x.includes("süpür") || x.includes("supur") || x.includes("skirting")) return "Süpürgelik";
    if (x.includes("sade") || x.includes("other") || x.includes("custom")) return "Sade Kalem";
    return t || "Sade Kalem";
  }

  function materialLabel(m) {
    if (m === "MDFLAM") return "MDFLAM";
    if (m === "HGloss") return "High Gloss";
    if (m === "LakPanel") return "Lak Panel";
    return "Lake";
  }

  function uid() {
    return (crypto?.randomUUID && crypto.randomUUID()) || String(Date.now() + Math.random());
  }

  function updateProject(updater) {
    setState((prev) => ({
      ...prev,
      projects: (prev.projects || []).map((p) => (p.id === projectId ? updater(p) : p)),
    }));
  }

  function removeItem(itemId) {
    updateProject((p) => ({
      ...p,
      items: (p.items || []).filter((i) => i.id !== itemId),
    }));
  }

  function nextName(baseType, customName, projectItems) {
    const typeNorm = normalizeType(baseType);
    const existing = (projectItems || []).filter((i) => normalizeType(i.type) === typeNorm);
    const n = existing.length + 1;
    const base = (customName || typeNorm).trim() || typeNorm;
    return n > 1 ? `${base} ${n}` : base;
  }

  // ---------------- CALCULATORS ----------------
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

    let base = 1.5;
    if (size === "60") base = 1.0;
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

  function computeItem(item) {
    const type = normalizeType(item.type);
    const data = item.data || {};
    if (type === "Mutfak") return calcKitchenPrice(data);
    if (type === "Kahve Köşesi") return calcCoffeePrice(data);
    if (type === "Hilton") return calcHiltonPrice(data);
    if (type === "Seperatör") return calcSeperatorPrice(data);
    if (type === "TV Ünitesi") return calcTvPrice(data);
    if (type === "Kapı") return calcDoorPrice(data);
    if (type === "Süpürgelik") return calcSkirtingPrice(data);
    return calcSimplePrice(data);
  }

  // ---------------- COMPUTEDS ----------------
  const itemsComputed = useMemo(() => {
    return (project?.items || []).map((it) => {
      const r = computeItem(it);
      return {
        ...it,
        type: normalizeType(it.type),
        _rawPrice: r.price,
        _price: roundUpThousands(r.price),
        _factor: r.factor,
      };
    });
  }, [project?.items, state.settings]);

  const accessoriesTotalRaw = useMemo(() => {
    let total = 0;
    for (const pa of project?.accessories || []) {
      const def = accessoriesDefs.find((a) => a.id === pa.accessoryId);
      if (!def) continue;
      total += (pa.quantity || 0) * (def.unitPrice || 0);
    }
    return total;
  }, [project?.accessories, accessoriesDefs]);

  const accessoriesTotal = useMemo(() => roundUpThousands(accessoriesTotalRaw), [accessoriesTotalRaw]);
  const itemsTotal = useMemo(() => roundUpThousands(itemsComputed.reduce((s, it) => s + (it._price || 0), 0)), [itemsComputed]);
  const grandTotal = useMemo(() => roundUpThousands(itemsTotal + accessoriesTotal), [itemsTotal, accessoriesTotal]);

  const offerDate = project?.offerDateISO || project?.createdAtISO || nowISO();
  const code = `${project?.projectNumber || ""}${project?.currentVersion || "A"}`;

  function bumpVersion() {
    updateProject((p) => {
      const cur = String(p.currentVersion || "A").toUpperCase();
      const cc = cur.charCodeAt(0);
      const next = cc >= 65 && cc < 90 ? String.fromCharCode(cc + 1) : cur;
      return { ...p, currentVersion: next, offerDateISO: nowISO() };
    });
  }

  // ---------------- STYLES (Corporate / White) ----------------
  const S = {
    page: { minHeight: "100vh", background: "#f7f8fb", color: "#0b1220", padding: 16 },
    container: { maxWidth: 820, margin: "0 auto" },

    topBar: {
      display: "flex",
      justifyContent: "space-between",
      gap: 12,
      alignItems: "flex-start",
      background: "#fff",
      border: "1px solid #e9edf3",
      borderRadius: 18,
      padding: 14,
      boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
    },

    title: { fontWeight: 950, fontSize: 16, letterSpacing: 0.2 },
    sub: { fontSize: 12, color: "#5b6472", fontWeight: 800, marginTop: 4 },

    btn: {
      padding: "10px 12px",
      borderRadius: 12,
      border: "1px solid #e5e9f0",
      background: "#fff",
      fontWeight: 900,
      cursor: "pointer",
    },
    btnPrimary: {
      padding: "10px 12px",
      borderRadius: 12,
      border: "1px solid #111827",
      background: "#111827",
      color: "#fff",
      fontWeight: 950,
      cursor: "pointer",
    },
    btnGhost: {
      padding: "10px 12px",
      borderRadius: 12,
      border: "1px solid transparent",
      background: "transparent",
      fontWeight: 950,
      cursor: "pointer",
      color: "#111827",
    },
    danger: {
      padding: "10px 12px",
      borderRadius: 12,
      border: "1px solid rgba(220,38,38,0.20)",
      background: "#fff",
      color: "#b91c1c",
      fontWeight: 950,
      cursor: "pointer",
    },

    tabsWrap: { display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" },
    tab: (a) => ({
      padding: "10px 12px",
      borderRadius: 999,
      border: "1px solid #e5e9f0",
      background: a ? "#111827" : "#fff",
      color: a ? "#fff" : "#111827",
      fontWeight: 950,
      cursor: "pointer",
    }),

    card: {
      marginTop: 12,
      borderRadius: 18,
      border: "1px solid #e9edf3",
      background: "#fff",
      boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
    },
    cardBody: { padding: 14 },

    list: { display: "grid", gap: 10, marginTop: 12 },
    itemCard: { borderRadius: 16, border: "1px solid #eef1f6", background: "#fff", padding: 12 },

    mini: { fontSize: 12, color: "#5b6472", fontWeight: 800 },

    fieldLabel: { fontSize: 12, color: "#334155", fontWeight: 950 },
    input: {
      width: "100%",
      padding: 11,
      borderRadius: 12,
      border: "1px solid #e5e9f0",
      background: "#fff",
      color: "#111827",
      outline: "none",
      fontWeight: 900,
    },
    select: {
      width: "100%",
      padding: 11,
      borderRadius: 12,
      border: "1px solid #e5e9f0",
      background: "#fff",
      color: "#111827",
      outline: "none",
      fontWeight: 900,
    },
    grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
    grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 },

    drawerBack: { position: "fixed", inset: 0, background: "rgba(2,6,23,0.35)", zIndex: 50 },
    drawer: {
      position: "fixed",
      top: 0,
      right: 0,
      height: "100vh",
      width: "min(520px, 94vw)",
      background: "#fff",
      borderLeft: "1px solid #e9edf3",
      zIndex: 60,
      display: "flex",
      flexDirection: "column",
      boxShadow: "-20px 0 60px rgba(0,0,0,0.15)",
    },
    drawerHead: { padding: 14, borderBottom: "1px solid #eef1f6", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 },
    drawerBody: { padding: 14, overflow: "auto", flex: 1 },
    drawerFoot: { padding: 14, borderTop: "1px solid #eef1f6", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
    badge: { display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 999, border: "1px solid #e5e9f0", background: "#fff", fontWeight: 950, fontSize: 12, color: "#111827" },
  };

  if (!project) {
    return (
      <div style={S.page}>
        <div style={S.container}>
          <button style={S.btn} onClick={onBack}>← Projeler</button>
          <div style={{ marginTop: 10 }}>Proje bulunamadı.</div>
        </div>
      </div>
    );
  }

  // ---------------- DRAWER: TYPES & INIT ----------------
  const itemTypes = ["Mutfak", "Kahve Köşesi", "Hilton", "Sade Kalem", "Seperatör", "TV Ünitesi", "Kapı", "Süpürgelik"];

  function initDraft(type) {
    const t = normalizeType(type);
    setDraftType(t);
    setDraftName("");

    let base = {};
    if (t === "Mutfak") {
      base = {
        shape: "Duz",
        totalWallCm: 600,
        wallAcm: 400,
        wallBcm: 500,
        wallCcm: 300,
        ceilingCm: 260,
        fridgeCm: 90,
        tallOvenCm: 60,
        islandCm: 0,
        upperMode: "IkiKat",
        material: "Lake",
      };
    } else if (t === "Kahve Köşesi") {
      base = { runAltCm: 120, ceilingCm: 260, tallTotalCm: 0, hasUpper: true, hasBazali: false, material: "Lake" };
    } else if (t === "Hilton") {
      base = { tip: "Tip1", size: "80", mirrorCabinet: false, wmW: 60, wmH: 200, wmD: 60, panW: 45, panH: 200, panD: 60, material: "Lake" };
    } else if (t === "Seperatör") {
      base = { w: 100, h: 250, d: 10, material: "Lake" };
    } else if (t === "TV Ünitesi") {
      base = { w: 300, h: 250, d: 40, material: "Lake" };
    } else if (t === "Kapı") {
      base = { qty: 1 };
    } else if (t === "Süpürgelik") {
      base = { m: 10 };
    } else {
      base = { w: 100, h: 100, d: 60, material: "Lake" };
    }

    // Important: keep both ref + committed state in sync
    draftDataRef.current = { ...base };
    setDraftData({ ...base });
  }

  function openDrawer(type) {
    initDraft(type);
    setDrawerOpen(true);
  }
  function closeDrawerNoSave() {
    setDrawerOpen(false);
  }

  // ---------------- INPUT COMPONENT (FIX FOCUS) ----------------
  /**
   * DraftInput:
   * - Local value while typing (no parent state updates on each key)
   * - Commit to parent draftData on Blur or Enter
   * This prevents "typing 1 char -> keyboard closes" on Windows/mobile.
   */
  function DraftInput({ label, field, placeholder, numeric = false, integer = false, disabled = false }) {
    const initial = draftDataRef.current?.[field];
    const [val, setVal] = useState(initial === undefined || initial === null ? "" : String(initial));
    const mountedRef = useRef(false);

    // When drawer type changes / re-init, update local
    useEffect(() => {
      const next = draftDataRef.current?.[field];
      setVal(next === undefined || next === null ? "" : String(next));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draftType, drawerOpen]);

    // keep ref in sync while typing (still no rerender)
    useEffect(() => {
      if (!mountedRef.current) {
        mountedRef.current = true;
        return;
      }
      // live typing into ref:
      draftDataRef.current = { ...draftDataRef.current, [field]: val };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [val]);

    function commit() {
      const raw = val;
      let committed = raw;

      if (numeric) committed = toNum(raw);
      if (integer) committed = toInt(raw);

      draftDataRef.current = { ...draftDataRef.current, [field]: committed };
      setDraftData((p) => ({ ...p, [field]: committed }));
    }

    return (
      <label style={{ display: "grid", gap: 6 }}>
        <div style={S.fieldLabel}>{label}</div>
        <input
          style={S.input}
          value={val}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => setVal(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
              // keep focus (don’t close keyboard)
              e.currentTarget.focus();
            }
          }}
        />
      </label>
    );
  }

  function saveDraftAsItem() {
    const id = uid();

    // commit all live ref fields into state one last time:
    const live = draftDataRef.current || {};
    // normalize numeric fields by type (so future computations are stable)
    let data = { ...live };

    if (draftType === "Kapı") data.qty = toInt(live.qty);
    if (draftType === "Süpürgelik") data.m = toNum(live.m);

    // For numeric dimension-based types, convert common fields
    const numFields = ["totalWallCm","wallAcm","wallBcm","wallCcm","ceilingCm","fridgeCm","tallOvenCm","islandCm","runAltCm","tallTotalCm","wmW","wmH","wmD","panW","panH","panD","w","h","d"];
    for (const k of numFields) {
      if (data[k] !== undefined && data[k] !== null && data[k] !== "" && typeof data[k] !== "number") {
        data[k] = toNum(data[k]);
      }
    }

    updateProject((p) => {
      const name = nextName(draftType, draftName || draftType, p.items || []);
      const newItem = { id, type: draftType, name, data };
      return { ...p, items: [...(p.items || []), newItem] };
    });

    setDrawerOpen(false);
  }

  function setAccessoryQty(accessoryId, qty) {
    const safeQty = Math.max(0, Math.floor(qty));
    updateProject((p) => {
      const list = [...(p.accessories || [])];
      const idx = list.findIndex((x) => x.accessoryId === accessoryId);
      if (idx === -1) {
        if (safeQty > 0) list.push({ accessoryId, quantity: safeQty });
      } else {
        if (safeQty <= 0) list.splice(idx, 1);
        else list[idx] = { ...list[idx], quantity: safeQty };
      }
      return { ...p, accessories: list };
    });
  }

  // ---------------- DRAWER UI ----------------
  function DraftMaterialPicker() {
    if (draftType === "Kapı" || draftType === "Süpürgelik") return null;
    const v = draftDataRef.current?.material || "Lake";
    return (
      <label style={{ display: "grid", gap: 6 }}>
        <div style={S.fieldLabel}>Malzeme</div>
        <select
          style={S.select}
          value={v}
          onChange={(e) => {
            const next = e.target.value;
            draftDataRef.current = { ...draftDataRef.current, material: next };
            setDraftData((p) => ({ ...p, material: next }));
          }}
        >
          <option value="MDFLAM">MDFLAM</option>
          <option value="HGloss">High Gloss</option>
          <option value="LakPanel">Lak Panel</option>
          <option value="Lake">Lake</option>
        </select>
      </label>
    );
  }

  function DraftPreview() {
    const tmp = computeItem({ type: draftType, data: draftData });
    return (
      <div style={{ borderRadius: 16, border: "1px solid #eef1f6", background: "#fbfcfe", padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={S.mini}>Ön İzleme</div>
          <div style={{ fontWeight: 950 }}>{currency(roundUpThousands(tmp.price))}</div>
        </div>
        <div style={{ marginTop: 6, ...S.mini }}>
          {draftType === "Kapı" ? "Malzeme: Lake" : draftType === "Süpürgelik" ? "Malzeme: Lake" : `Malzeme: ${materialLabel(draftData.material || "Lake")}`}
        </div>
      </div>
    );
  }

  function DraftForm() {
    const d = draftDataRef.current || {};

    return (
      <div style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <div style={S.fieldLabel}>Kalem Adı</div>
          <input style={S.input} value={draftName} onChange={(e) => setDraftName(e.target.value)} placeholder={draftType} />
        </label>

        <DraftMaterialPicker />

        {draftType === "Mutfak" && (
          <>
            <div style={S.grid2}>
              <label style={{ display: "grid", gap: 6 }}>
                <div style={S.fieldLabel}>Şekil</div>
                <select
                  style={S.select}
                  value={d.shape || "Duz"}
                  onChange={(e) => {
                    const next = e.target.value;
                    draftDataRef.current = { ...draftDataRef.current, shape: next };
                    setDraftData((p) => ({ ...p, shape: next }));
                  }}
                >
                  <option value="Duz">Düz</option>
                  <option value="L">L</option>
                  <option value="U">U</option>
                </select>
              </label>

              <DraftInput label="Tavan (cm)" field="ceilingCm" numeric />
            </div>

            {(d.shape || "Duz") === "Duz" && <DraftInput label="Toplam duvar (cm)" field="totalWallCm" numeric />}

            {((d.shape || "Duz") === "L" || (d.shape || "Duz") === "U") && (
              <div style={S.grid3}>
                <DraftInput label="Duvar A (cm)" field="wallAcm" numeric />
                <DraftInput label="Duvar B (cm)" field="wallBcm" numeric />
                <DraftInput label="Duvar C (cm)" field="wallCcm" numeric disabled={(d.shape || "Duz") !== "U"} />
              </div>
            )}

            <div style={S.grid3}>
              <DraftInput label="Buzdolabı (cm)" field="fridgeCm" numeric />
              <DraftInput label="Boy ankastre (cm)" field="tallOvenCm" numeric />
              <DraftInput label="Ada (cm)" field="islandCm" numeric />
            </div>

            <label style={{ display: "grid", gap: 6 }}>
              <div style={S.fieldLabel}>Üst dolap modu</div>
              <select
                style={S.select}
                value={d.upperMode || "IkiKat"}
                onChange={(e) => {
                  const next = e.target.value;
                  draftDataRef.current = { ...draftDataRef.current, upperMode: next };
                  setDraftData((p) => ({ ...p, upperMode: next }));
                }}
              >
                <option value="IkiKat">2 Katman (70 + 40)</option>
                <option value="Full">Full</option>
                <option value="Yok">Yok / Raf</option>
              </select>
            </label>
          </>
        )}

        {draftType === "Kahve Köşesi" && (
          <>
            <div style={S.grid2}>
              <DraftInput label="Alt dolap eni (cm)" field="runAltCm" numeric />
              <DraftInput label="Tavan (cm)" field="ceilingCm" numeric />
            </div>

            <div style={S.grid2}>
              <DraftInput label="Boy dolap toplam eni (cm)" field="tallTotalCm" numeric />
              <label style={{ display: "grid", gap: 6 }}>
                <div style={S.fieldLabel}>Üst dolap</div>
                <select
                  style={S.select}
                  value={d.hasUpper ? "Evet" : "Hayır"}
                  onChange={(e) => {
                    const next = e.target.value === "Evet";
                    draftDataRef.current = { ...draftDataRef.current, hasUpper: next };
                    setDraftData((p) => ({ ...p, hasUpper: next }));
                  }}
                >
                  <option value="Evet">Var</option>
                  <option value="Hayır">Yok</option>
                </select>
              </label>
            </div>

            <label style={{ display: "grid", gap: 6 }}>
              <div style={S.fieldLabel}>Bazalı üst dolap</div>
              <select
                style={S.select}
                value={d.hasBazali ? "Evet" : "Hayır"}
                onChange={(e) => {
                  const next = e.target.value === "Evet";
                  draftDataRef.current = { ...draftDataRef.current, hasBazali: next };
                  setDraftData((p) => ({ ...p, hasBazali: next }));
                }}
              >
                <option value="Hayır">Yok</option>
                <option value="Evet">Var</option>
              </select>
            </label>
          </>
        )}

        {draftType === "Hilton" && (
          <>
            <div style={S.grid2}>
              <label style={{ display: "grid", gap: 6 }}>
                <div style={S.fieldLabel}>Tip</div>
                <select
                  style={S.select}
                  value={d.tip || "Tip1"}
                  onChange={(e) => {
                    const next = e.target.value;
                    draftDataRef.current = { ...draftDataRef.current, tip: next };
                    setDraftData((p) => ({ ...p, tip: next }));
                  }}
                >
                  <option value="Tip1">Tip 1</option>
                  <option value="Tip2">Tip 2</option>
                  <option value="Tip3">Tip 3</option>
                </select>
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <div style={S.fieldLabel}>Lavabo</div>
                <select
                  style={S.select}
                  value={String(d.size || "80")}
                  onChange={(e) => {
                    const next = e.target.value;
                    draftDataRef.current = { ...draftDataRef.current, size: next };
                    setDraftData((p) => ({ ...p, size: next }));
                  }}
                >
                  <option value="60">60</option>
                  <option value="80">80</option>
                  <option value="100">100</option>
                  <option value="120">120</option>
                </select>
              </label>
            </div>

            <label style={{ display: "grid", gap: 6 }}>
              <div style={S.fieldLabel}>Ayna dolap</div>
              <select
                style={S.select}
                value={d.mirrorCabinet ? "Evet" : "Hayır"}
                onChange={(e) => {
                  const next = e.target.value === "Evet";
                  draftDataRef.current = { ...draftDataRef.current, mirrorCabinet: next };
                  setDraftData((p) => ({ ...p, mirrorCabinet: next }));
                }}
              >
                <option value="Hayır">Yok</option>
                <option value="Evet">Var</option>
              </select>
            </label>

            {(d.tip || "Tip1") === "Tip3" && (
              <>
                <div style={S.fieldLabel}>Çamaşır kabini (cm)</div>
                <div style={S.grid3}>
                  <DraftInput label="En" field="wmW" numeric placeholder="60" />
                  <DraftInput label="Boy" field="wmH" numeric placeholder="200" />
                  <DraftInput label="Derinlik" field="wmD" numeric placeholder="60" />
                </div>

                <div style={S.fieldLabel}>Kiler dolabı (cm)</div>
                <div style={S.grid3}>
                  <DraftInput label="En" field="panW" numeric placeholder="45" />
                  <DraftInput label="Boy" field="panH" numeric placeholder="200" />
                  <DraftInput label="Derinlik" field="panD" numeric placeholder="60" />
                </div>
              </>
            )}
          </>
        )}

        {(draftType === "TV Ünitesi" || draftType === "Seperatör" || draftType === "Sade Kalem") && (
          <>
            <div style={S.fieldLabel}>Ölçüler (cm)</div>
            <div style={S.grid3}>
              <DraftInput label="En" field="w" numeric />
              <DraftInput label="Boy" field="h" numeric />
              <DraftInput label="Derinlik" field="d" numeric />
            </div>
          </>
        )}

        {draftType === "Kapı" && (
          <>
            <DraftInput label="Adet" field="qty" integer placeholder="1" />
            <div style={S.mini}>Detay: Lake</div>
          </>
        )}

        {draftType === "Süpürgelik" && (
          <>
            <DraftInput label="Metre" field="m" numeric placeholder="10" />
            <div style={S.mini}>Detay: Lake</div>
          </>
        )}

        <DraftPreview />
      </div>
    );
  }

  function Drawer() {
    if (!drawerOpen) return null;

    return (
      <>
        <div style={S.drawerBack} onClick={closeDrawerNoSave} />
        <div style={S.drawer} onClick={(e) => e.stopPropagation()}>
          <div style={S.drawerHead}>
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontWeight: 950, fontSize: 14 }}>Kalem Ekle</div>
              <div style={S.badge}>Tür: {draftType}</div>
            </div>
            <button style={S.btn} onClick={closeDrawerNoSave}>Kapat</button>
          </div>

          <div style={S.drawerBody}>
            <div style={{ display: "grid", gap: 12 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <div style={S.fieldLabel}>Kalem Türü</div>
                <select
                  style={S.select}
                  value={draftType}
                  onChange={(e) => initDraft(e.target.value)}
                >
                  {itemTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>

              <DraftForm />
            </div>
          </div>

          <div style={S.drawerFoot}>
            <button style={S.btn} onClick={closeDrawerNoSave}>İptal</button>
            <button style={S.btnPrimary} onClick={saveDraftAsItem}>Kaydet</button>
          </div>
        </div>
      </>
    );
  }

// ---------- OFFER VIEW (A4 SABİT: antet sabit + dipnot/imza sabit + içerik ortada ölçeklenir) ----------
function OfferView() {
  const company = settings.companyInfo || {};
  const logoUrl = company.logoDataUrl || "";

  // A4 px (yaklaşık, 96dpi)
  const A4_W = 794;
  const A4_H = 1123;

  // sabit yükseklikler
  const PAD = 22;
  const HEADER_H = 168; // üst çerçeve + nefes
  const FOOTER_H = 150;

  const sheetRef = useRef(null);
  const middleRef = useRef(null);
  const middleContentRef = useRef(null);

  const [fitScale, setFitScale] = useState(1);
  const [exporting, setExporting] = useState(false);

  // Hilton tek satır: hesaplar
  const hiltonPack = useMemo(() => {
    const list = itemsComputed.filter((x) => normalizeType(x.type) === "Hilton");
    const total = list.reduce((s, x) => s + (x._price || 0), 0);

    const details = list.map((it) => {
      const d = it.data || {};
      const mat =
        d.material ? materialLabel(d.material) : "Lake";
      const tip = d.tip || "Tip1";
      const size = d.size || "80";
      // isim önemli değil ama açıklamada görmek iyi (istersen kaldırırız)
      return `${it.name} • ${tip} • ${size} • ${mat}`;
    });

    return { list, total, details, has: list.length > 0 };
  }, [itemsComputed]);

  // Ortadaki içerik A4'ün ortasına sığsın diye ölçek
  useLayoutEffect(() => {
    const mid = middleRef.current;
    const content = middleContentRef.current;
    if (!mid || !content) return;

    const available = mid.clientHeight;
    const need = content.scrollHeight || content.getBoundingClientRect().height || 0;
    if (!available || !need) return;

    const s = Math.min(1, available / need);
    setFitScale(Math.max(0.72, s));
  }, [
    itemsComputed.length,
    hiltonPack.total,
    hiltonPack.has,
    (project?.accessories || []).length,
    project?.customerName,
    project?.phone,
    project?.address,
    company.logoDataUrl,
    accessoriesTotal,
    itemsTotal,
    grandTotal,
  ]);

  async function exportJpg() {
    try {
      setExporting(true);
      await new Promise((r) => setTimeout(r, 60));

      const node = sheetRef.current;
      if (!node) return;

      const canvas = await html2canvas(node, {
        backgroundColor: "#ffffff",
        scale: 3,
        useCORS: true,
      });

      const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${project?.projectNumber || "teklif"}${project?.currentVersion || "A"}-${(project?.customerName || "musteri")
        .toString()
        .replace(/[^\w\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")}.jpg`;
      a.click();
    } finally {
      setExporting(false);
    }
  }

  const F = {
    fontFamily:
      'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif',
  };

  const ST = {
    shell: {
      width: A4_W,
      height: A4_H,
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 16,
      boxShadow: "0 12px 42px rgba(0,0,0,0.08)",
      overflow: "hidden",
      ...F,
    },
    frame: {
      height: "100%",
      display: "flex",
      flexDirection: "column",
      padding: PAD,
      boxSizing: "border-box",
    },

    // HEADER FRAME (tek çerçeve)
    headerFrame: {
      height: HEADER_H,
      border: "1px solid #eef0f4",
      borderRadius: 16,
      background: "#fff",
      padding: 14,
      boxSizing: "border-box",
      display: "grid",
      gridTemplateColumns: "1fr 1.35fr 1fr",
      gap: 12,
      alignItems: "center",
    },

    // logo kare
    logoBox: {
      width: 82,
      height: 82,
      borderRadius: 14,
      border: "1px solid #eef0f4",
      background: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    logoImg: { maxWidth: "100%", maxHeight: "100%", objectFit: "contain" },

    leftCol: { display: "flex", flexDirection: "column", alignItems: "center" },
    companyName: { fontWeight: 900, fontSize: 12.8, color: "#0f172a", marginTop: 8, textAlign: "center" },
    companyLine: { fontSize: 10.8, color: "#475569", fontWeight: 600, lineHeight: 1.35, textAlign: "center" },

    // müşteri ortası gerçekten ortalı
    centerCol: { textAlign: "center" },
    centerTitle: { fontWeight: 900, fontSize: 15.3, color: "#0f172a" },
    centerCustomer: { fontWeight: 850, fontSize: 12.8, color: "#334155", marginTop: 6 },
    centerSmall: { fontSize: 10.9, color: "#475569", fontWeight: 600, marginTop: 6, lineHeight: 1.25 },

    rightCol: { textAlign: "right" },
    rightTitle: { fontWeight: 900, letterSpacing: 1, fontSize: 13.2, color: "#0f172a" },
    rightMeta: { fontSize: 10.9, color: "#475569", fontWeight: 700, marginTop: 6 },

    // ORTA
    middle: {
      flex: 1,
      minHeight: 0,
      paddingTop: 10,     // biraz yukarı
      paddingBottom: 12,
      display: "flex",
      flexDirection: "column",
      gap: 10,
    },

    tableWrap: {
      border: "1px solid #eef0f4",
      borderRadius: 14,
      overflow: "hidden",
      background: "#fff",
    },
    head: {
      display: "grid",
      gridTemplateColumns: "1fr 170px",
      background: "#f8fafc",
    },
    th: { padding: "8px 12px", fontWeight: 800, fontSize: 11.4, color: "#334155" }, // biraz yukarı
    row: {
      display: "grid",
      gridTemplateColumns: "1fr 170px",
      borderTop: "1px solid #eef0f4",
    },
    td: { padding: "9px 12px", fontSize: 11.5, color: "#0f172a" },
    tdRight: {
      padding: "9px 12px",
      fontSize: 11.5,
      color: "#0f172a",
      textAlign: "right",
      fontWeight: 900,
      whiteSpace: "nowrap",
    },

    itemName: { fontWeight: 900, fontSize: 12.1, color: "#0f172a" },
    itemDetail: { marginTop: 3, fontSize: 10.9, color: "#475569", fontWeight: 600, lineHeight: 1.25, whiteSpace: "pre-line" },

    totalsBox: {
      border: "1px solid #eef0f4",
      borderRadius: 14,
      padding: 12,
      background: "#fff",
    },
    totalRow: { display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "#334155", fontWeight: 800, marginTop: 6 },
    grandRow: { display: "flex", justifyContent: "space-between", fontSize: 16.5, color: "#0f172a", fontWeight: 950, marginTop: 10 },

    // FOOTER
    footer: {
      height: FOOTER_H,
      display: "grid",
      gridTemplateColumns: "1.35fr 0.65fr",
      gap: 12,
      alignItems: "end",
      paddingTop: 12,
      borderTop: "1px solid #eef0f4",
    },
    notes: {
      fontSize: 11,
      color: "#475569",
      fontWeight: 600,
      lineHeight: 1.45,
      whiteSpace: "pre-line",
    },
    signBox: {
      border: "1px dashed #cbd5e1",
      borderRadius: 14,
      padding: 12,
      height: 98,
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-start",
      gap: 10,
    },
    signTitle: { fontSize: 11, fontWeight: 900, color: "#334155" },

    actionBar: { marginTop: 10, display: "flex", justifyContent: "flex-end", paddingRight: 6 },
    exportBtn: {
      padding: "10px 12px",
      borderRadius: 12,
      border: "1px solid #e5e7eb",
      background: "#fff",
      fontWeight: 900,
      cursor: "pointer",
      ...F,
    },
  };

  // Hilton harici satırları bas
  const rowsNonHilton = itemsComputed.filter((it) => normalizeType(it.type) !== "Hilton");

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div ref={sheetRef} style={ST.shell}>
          <div style={ST.frame}>
            {/* HEADER FRAME */}
            <div style={ST.headerFrame}>
              <div style={ST.leftCol}>
                <div style={ST.logoBox}>
                  {logoUrl ? (
                    <img src={logoUrl} alt="logo" style={ST.logoImg} />
                  ) : (
                    <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 900 }}>LOGO</div>
                  )}
                </div>

                <div style={ST.companyName}>{company.name || "Şirket Adı"}</div>
                {company.address ? <div style={ST.companyLine}>{company.address}</div> : null}
                {company.phone ? <div style={ST.companyLine}>{company.phone}</div> : null}
                {company.email ? <div style={ST.companyLine}>{company.email}</div> : null}
              </div>

              <div style={ST.centerCol}>
                <div style={ST.centerTitle}>{project.name}</div>
                <div style={ST.centerCustomer}>{project.customerName}</div>
                {(project.phone || project.address) ? (
                  <div style={ST.centerSmall}>
                    {project.phone ? `Tel: ${project.phone}` : ""}
                    {project.phone && project.address ? " • " : ""}
                    {project.address ? `Adres: ${project.address}` : ""}
                  </div>
                ) : null}
              </div>

              <div style={ST.rightCol}>
                <div style={ST.rightTitle}>TEKLİF</div>
                <div style={ST.rightMeta}>Tarih: {formatDate(offerDate)}</div>
                <div style={ST.rightMeta}>Kod: {code}</div>
              </div>
            </div>

            {/* MIDDLE */}
            <div ref={middleRef} style={ST.middle}>
              <div
                ref={middleContentRef}
                style={{
                  transform: `scale(${fitScale})`,
                  transformOrigin: "top left",
                  width: `${100 / fitScale}%`,
                }}
              >
                {/* TABLE */}
                <div style={ST.tableWrap}>
                  <div style={ST.head}>
                    <div style={ST.th}>Kalem / Detay</div>
                    <div style={{ ...ST.th, textAlign: "right" }}>Tutar</div>
                  </div>

                  {/* Hilton tek satır */}
                  {hiltonPack.has && (
                    <div style={ST.row}>
                      <div style={ST.td}>
                        <div style={ST.itemName}>Hilton</div>
                        <div style={ST.itemDetail}>
                          {hiltonPack.details.join("\n")}
                        </div>
                      </div>
                      <div style={ST.tdRight}>{currency(hiltonPack.total)}</div>
                    </div>
                  )}

                  {/* Diğer kalemler */}
                  {rowsNonHilton.map((it) => {
                    const t = normalizeType(it.type);
                    const d = it.data || {};
                    let detail = "";

                    if (t === "Kapı") detail = "Lake";
                    else if (t === "Süpürgelik") detail = "Lake";
                    else if (d.material) detail = materialLabel(d.material);

                    if (t === "Mutfak") detail = `${detail}${detail ? " • " : ""}${d.shape || "Düz"}`;

                    return (
                      <div key={it.id} style={ST.row}>
                        <div style={ST.td}>
                          <div style={ST.itemName}>{it.name}</div>
                          {detail ? <div style={ST.itemDetail}>{detail}</div> : null}
                        </div>
                        <div style={ST.tdRight}>{currency(it._price || 0)}</div>
                      </div>
                    );
                  })}

                  {/* Aksesuar satırı */}
                  {project.accessories?.length > 0 && (
                    <div style={ST.row}>
                      <div style={ST.td}>
                        <div style={ST.itemName}>Aksesuarlar</div>
                        <div style={ST.itemDetail}>
                          {(project.accessories || [])
                            .map((r) => {
                              const def = accessoriesDefs.find((a) => a.id === r.accessoryId);
                              if (!def) return null;
                              return `${def.name} x${r.quantity || 0}`;
                            })
                            .filter(Boolean)
                            .join(" • ")}
                        </div>
                      </div>
                      <div style={ST.tdRight}>{currency(accessoriesTotal)}</div>
                    </div>
                  )}
                </div>

                {/* TOTALS */}
                <div style={{ marginTop: 10, ...ST.totalsBox }}>
                  <div style={ST.totalRow}>
                    <div>Kalemler Toplamı</div>
                    <div style={{ fontWeight: 900, whiteSpace: "nowrap" }}>{currency(itemsTotal)}</div>
                  </div>

                  <div style={ST.totalRow}>
                    <div>Aksesuar Toplamı</div>
                    <div style={{ fontWeight: 900, whiteSpace: "nowrap" }}>{currency(accessoriesTotal)}</div>
                  </div>

                  <div style={ST.grandRow}>
                    <div>Genel Toplam</div>
                    <div style={{ whiteSpace: "nowrap" }}>{currency(grandTotal)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div style={ST.footer}>
              <div style={ST.notes}>
                {"KDV dahil değildir.\nTermin/Montaj süresi teklif onaylandığı andan itibaren 60 gündür.\nMutfak tezgahı, evye, batarya ve lavabo taşı fiyata dahil değildir."}
              </div>

              <div style={ST.signBox}>
                <div style={ST.signTitle}>Müşteri İmza</div>
                <div style={{ flex: 1 }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* export butonu (export sırasında gizlenir) */}
      <div style={{ ...ST.actionBar, opacity: exporting ? 0 : 1, pointerEvents: exporting ? "none" : "auto" }}>
        <button style={ST.exportBtn} onClick={exportJpg}>
          JPEG Çıktı Al
        </button>
      </div>
    </div>
  );
}

  // ---------------- ITEMS LIST DETAILS ----------------
  function itemDetailText(it) {
    const t = normalizeType(it.type);
    const d = it.data || {};
    let detail = "";

    if (t === "Kapı") detail = `Lake • Adet: ${d.qty || 1}`;
    else if (t === "Süpürgelik") detail = `Lake • ${d.m || 0} m`;
    else if (d.material) detail = materialLabel(d.material);

    if (t === "Mutfak") detail = `${detail}${detail ? " • " : ""}${d.shape || "Düz"}`;
    if (t === "Hilton") detail = `${detail}${detail ? " • " : ""}${d.tip || "Tip1"} • ${d.size || "80"}`;

    return detail;
  }

  // ---------------- RENDER ----------------
  return (
    <div style={S.page}>
      <div style={S.container}>
        <div style={S.topBar}>
          <div>
            <button style={S.btnGhost} onClick={onBack}>← Projeler</button>
            <div style={S.title}>{project.name}</div>
            <div style={S.sub}>
              {project.customerName} • Kod: <b>{code}</b>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <div style={S.badge}>Kalemler: {currency(itemsTotal)}</div>
            <div style={S.badge}>Genel: {currency(grandTotal)}</div>
          </div>
        </div>

        <div style={S.tabsWrap}>
          <button style={S.tab(tab === "kalemler")} onClick={() => setTab("kalemler")}>Kalemler</button>
          <button style={S.tab(tab === "aksesuarlar")} onClick={() => setTab("aksesuarlar")}>Aksesuarlar</button>
          <button style={S.tab(tab === "teklif")} onClick={() => setTab("teklif")}>Teklif</button>
        </div>

        {tab === "kalemler" && (
          <>
            <div style={S.card}>
              <div style={S.cardBody}>
                <div style={{ display: "flex", gap: 10, justifyContent: "space-between", flexWrap: "wrap" }}>
                  <button style={S.btnPrimary} onClick={() => openDrawer("Mutfak")}>+ Kalem Ekle</button>
                  <button style={S.btn} onClick={bumpVersion}>Teklif Revize (+)</button>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
                  <div style={S.mini}>Kalemler Toplamı</div>
                  <div style={{ fontWeight: 950 }}>{currency(itemsTotal)}</div>
                </div>
              </div>
            </div>

            {itemsComputed.length === 0 ? (
              <div style={S.card}>
                <div style={S.cardBody}>
                  <div style={{ fontWeight: 950 }}>Henüz kalem yok</div>
                  <div style={S.mini}>“+ Kalem Ekle” ile ekle. Drawer’da ölçüleri gir, Kaydet.</div>
                </div>
              </div>
            ) : (
              <div style={S.list}>
                {itemsComputed.map((it) => (
                  <div key={it.id} style={S.itemCard}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 950, fontSize: 13 }}>{it.name}</div>
                        <div style={{ marginTop: 4, ...S.mini }}>{itemDetailText(it)}</div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 950 }}>{currency(it._price || 0)}</div>
                        <button style={{ ...S.danger, marginTop: 8 }} onClick={() => removeItem(it.id)}>Sil</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Drawer />
          </>
        )}

        {tab === "aksesuarlar" && (
          <>
            <div style={S.card}>
              <div style={S.cardBody}>
                <div style={{ fontWeight: 950 }}>Aksesuar Adetleri</div>
                <div style={S.mini}>Ayarlar’dan aksesuar ekle/sil. Burada sadece adet gir.</div>
              </div>
            </div>

            <div style={S.list}>
              {accessoriesDefs
                .filter((a) => a.isActive || (project.accessories || []).some((x) => x.accessoryId === a.id))
                .sort((a, b) => String(a.name).localeCompare(String(b.name), "tr"))
                .map((a) => {
                  const qty = (project.accessories || []).find((x) => x.accessoryId === a.id)?.quantity || 0;
                  return (
                    <div key={a.id} style={S.itemCard}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                        <div>
                          <div style={{ fontWeight: 950 }}>{a.name}</div>
                          <div style={S.mini}>{a.isActive ? "Aktif" : "Pasif"} • {a.unitPrice} ₺</div>
                        </div>
                        <div style={{ width: 140 }}>
                          <input style={S.input} value={String(qty)} onChange={(e) => setAccessoryQty(a.id, toNum(e.target.value))} />
                          <div style={{ ...S.mini, textAlign: "right", marginTop: 6 }}>adet</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div style={S.card}>
              <div style={S.cardBody}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div style={S.mini}>Aksesuar Toplamı</div>
                  <div style={{ fontWeight: 950 }}>{currency(accessoriesTotal)}</div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                  <div style={S.mini}>Genel Toplam</div>
                  <div style={{ fontWeight: 950 }}>{currency(grandTotal)}</div>
                </div>
              </div>
            </div>
          </>
        )}

        {tab === "teklif" && <OfferView />}
      </div>
    </div>
  );
}