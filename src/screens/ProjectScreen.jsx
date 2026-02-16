import React, { useEffect, useLayoutEffect, useMemo, useRef, useState , useCallback } from "react";
import html2canvas from "html2canvas";

export default function ProjectScreen({ projectId, state, setState, onBack }) {
  const project = state.projects.find((p) => p.id === projectId);

  // ---------- SETTINGS ----------
  const settings = state?.settings || {};
  const materialPrices = settings.materialPrices || {
    MDFLAM: 100,
    HGloss: 120,
    LakPanel: 150,
    Lake: 200,
  };

  const coeff = settings.coefficients || {
    hilton: 1.0,
    tv: 1.0,
    seperator: 1.0,
    coffee: 1.0,
  };

  const accessoriesDefs = settings.accessories || [];
  const doorUnit = settings.doorPrice ?? 12000;
  const skirtingUnit = settings.skirtingPricePerMeter ?? 300;

  // ---------- UI STATE ----------
  const [tab, setTab] = useState("kalemler");
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Drawer form local state (KAYDETMEZSEK HİÇBİR ŞEY DEĞİŞMEZ)
  const [draftType, setDraftType] = useState("Mutfak");
  const [draftName, setDraftName] = useState("");
  const [draftData, setDraftData] = useState({});

  // ---------- HELPERS ----------
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
    const n = Number(String(v).replace(",", ".").replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  function roundUpThousands(n) {
    const x = Number(n || 0);
    return Math.ceil(x / 1000) * 1000;
  }
  function currency(n) {
    try {
      return new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
        maximumFractionDigits: 0,
      }).format(n);
    } catch {
      return `${Math.round(n)} ₺`;
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

  function updateProject(updater) {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => (p.id === projectId ? updater(p) : p)),
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

  // ---------- CALCULATORS ----------
  function factorFromDims(widthCm, heightCm, depthCm) {
    const w = Math.max(0, widthCm) / 100;
    const h = Math.max(0, heightCm) / 100;
    const d = Math.max(0, depthCm) / 100;
    return w * h * (1 + d);
  }

  function calcKitchenPrice(data) {
    const shape = data.shape || "Duz";
    const ceiling = toNum(data.ceilingCm || 260);

    const fridge = toNum(data.fridgeCm || 90);
    const tallOven = toNum(data.tallOvenCm || 60);
    const tallTotal = fridge + tallOven;

    const mat = data.material || "Lake";
    const unit = materialPrices[mat] || 0;

    const altDepthFactor = 1.6;

    let runAltCm = 0;

    if (shape === "Duz") {
      const totalWall = toNum(data.totalWallCm || 600);
      runAltCm = Math.max(0, totalWall - tallTotal);
    }
    if (shape === "L") {
      const a = toNum(data.wallAcm || 400);
      const b = toNum(data.wallBcm || 500);
      runAltCm = Math.max(0, a + b - tallTotal - 60);
    }
    if (shape === "U") {
      const a = toNum(data.wallAcm || 300);
      const b = toNum(data.wallBcm || 300);
      const c = toNum(data.wallCcm || 300);
      runAltCm = Math.max(0, a + b + c - tallTotal - 120);
    }

    const island = toNum(data.islandCm || 0);
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

    const runAltCm = toNum(data.runAltCm || 120);
    const ceiling = toNum(data.ceilingCm || 260);

    const altFactor = (runAltCm / 100) * 1.0 * 1.6;

    const tallCm = toNum(data.tallTotalCm || 0);
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
      extra += factorFromDims(toNum(data.wmW || 60), toNum(data.wmH || 200), toNum(data.wmD || 60));
      extra += factorFromDims(toNum(data.panW || 45), toNum(data.panH || 200), toNum(data.panD || 60));
    }

    const factor = (base + extra) * (coeff.hilton || 1);
    return { factor, price: factor * unit };
  }

  function calcSimplePrice(data) {
    const mat = data.material || "Lake";
    const unit = materialPrices[mat] || 0;
    const factor = factorFromDims(toNum(data.w || 100), toNum(data.h || 100), toNum(data.d || 60));
    return { factor, price: factor * unit };
  }

  function calcSeperatorPrice(data) {
    const mat = data.material || "Lake";
    const unit = materialPrices[mat] || 0;
    const factor = factorFromDims(toNum(data.w || 100), toNum(data.h || 250), toNum(data.d || 10)) * (coeff.seperator || 1);
    return { factor, price: factor * unit };
  }

  function calcTvPrice(data) {
    const mat = data.material || "Lake";
    const unit = materialPrices[mat] || 0;
    const factor = factorFromDims(toNum(data.w || 300), toNum(data.h || 250), toNum(data.d || 40)) * (coeff.tv || 1);
    return { factor, price: factor * unit };
  }

  function calcDoorPrice(data) {
    const qty = Math.max(0, Math.floor(toNum(data.qty || 1)));
    return { factor: qty, price: qty * doorUnit };
  }

  function calcSkirtingPrice(data) {
    const m = Math.max(0, toNum(data.m || 10));
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

  // ---------- ITEMS COMPUTED (for summaries & offer) ----------
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

  // ---------- ACCESSORIES TOTAL ----------
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
      const code = cur.charCodeAt(0);
      const next = code >= 65 && code < 90 ? String.fromCharCode(code + 1) : cur;
      return { ...p, currentVersion: next, offerDateISO: nowISO() };
    });
  }

  // ---------- STYLES ----------
  const S = {
    page: { minHeight: "100vh", background: "#f6f7fb", color: "#0f172a", padding: 16 },
    container: { maxWidth: 720, margin: "0 auto" },
    topRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 },
    btn: { padding: "10px 12px", borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff", fontWeight: 800, cursor: "pointer" },
    btnPrimary: { padding: "10px 12px", borderRadius: 12, border: 0, background: "#111827", color: "#fff", fontWeight: 900, cursor: "pointer" },
    tabs: { display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" },
    tab: (a) => ({ padding: "10px 12px", borderRadius: 999, border: "1px solid #e5e7eb", background: a ? "#111827" : "#fff", color: a ? "#fff" : "#111827", fontWeight: 900, cursor: "pointer" }),
    card: { marginTop: 12, borderRadius: 18, border: "1px solid #e5e7eb", background: "#fff", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" },
    cardBody: { padding: 14 },
    box: { borderRadius: 16, border: "1px solid #eef0f4", padding: 12, background: "#fff" },
    mini: { fontSize: 12, color: "#6b7280" },
    input: { width: "100%", padding: 10, borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff", color: "#111827", outline: "none" },
    select: { width: "100%", padding: 10, borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff", color: "#111827", outline: "none" },
    grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
    grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 },
    drawerBack: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 50 },
    drawer: { position: "fixed", top: 0, right: 0, height: "100vh", width: "min(520px, 92vw)", background: "#fff", borderLeft: "1px solid #e5e7eb", zIndex: 60, display: "flex", flexDirection: "column" },
    drawerHead: { padding: 14, borderBottom: "1px solid #eef0f4", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 },
    drawerBody: { padding: 14, overflow: "auto", flex: 1 },
    drawerFoot: { padding: 14, borderTop: "1px solid #eef0f4", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
    danger: { padding: "10px 12px", borderRadius: 12, border: "1px solid #fee2e2", background: "#fff", color: "#b91c1c", fontWeight: 900, cursor: "pointer" },
  };

  if (!project) {
    return (
      <div style={{ padding: 16 }}>
        <button onClick={onBack}>← Geri</button>
        <p>Proje bulunamadı.</p>
      </div>
    );
  }

  // ---------- DRAWER OPEN/CLOSE ----------
  const itemTypes = ["Mutfak", "Kahve Köşesi", "Hilton", "Sade Kalem", "Seperatör", "TV Ünitesi", "Kapı", "Süpürgelik"];

  // ✅ FIX: sayısal alanları STRING tutuyoruz (cursor/focus bozulmaz)
  function initDraft(type) {
    const t = normalizeType(type);
    setDraftType(t);
    setDraftName("");

    if (t === "Mutfak") {
      setDraftData({
        shape: "Duz",
        totalWallCm: "600",
        wallAcm: "400",
        wallBcm: "500",
        wallCcm: "300",
        ceilingCm: "260",
        fridgeCm: "90",
        tallOvenCm: "60",
        islandCm: "0",
        upperMode: "IkiKat",
        material: "Lake",
      });
    } else if (t === "Kahve Köşesi") {
      setDraftData({
        runAltCm: "120",
        ceilingCm: "260",
        tallTotalCm: "0",
        hasUpper: true,
        hasBazali: false,
        material: "Lake",
      });
    } else if (t === "Hilton") {
      setDraftData({
        tip: "Tip1",
        size: "80",
        mirrorCabinet: false,
        wmW: "60",
        wmH: "200",
        wmD: "60",
        panW: "45",
        panH: "200",
        panD: "60",
        material: "Lake",
      });
    } else if (t === "Seperatör") {
      setDraftData({ w: "100", h: "250", d: "10", material: "Lake" });
    } else if (t === "TV Ünitesi") {
      setDraftData({ w: "300", h: "250", d: "40", material: "Lake" });
    } else if (t === "Kapı") {
      setDraftData({ qty: "1" });
    } else if (t === "Süpürgelik") {
      setDraftData({ m: "10" });
    } else {
      setDraftData({ w: "100", h: "100", d: "60", material: "Lake" });
    }
  }

  function openDrawer(type) {
    initDraft(type);
    setDrawerOpen(true);
  }
  function closeDrawerNoSave() {
    setDrawerOpen(false);
  }

  function saveDraftAsItem() {
    const id = (crypto.randomUUID && crypto.randomUUID()) || String(Date.now() + Math.random());
    updateProject((p) => {
      const name = nextName(draftType, draftName || draftType, p.items || []);
      const newItem = { id, type: draftType, name, data: { ...draftData } };
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

function renderDraftMaterialPicker() {
  if (draftType === "Kapı" || draftType === "Süpürgelik") return null;
  return (
    <div>
      <div style={S.mini}>Malzeme</div>
      <select
        style={S.select}
        value={draftData.material || "Lake"}
        onChange={(e) => setDraftData((x) => ({ ...x, material: e.target.value }))}
      >
        <option value="MDFLAM">MDFLAM</option>
        <option value="HGloss">High Gloss</option>
        <option value="LakPanel">Lak Panel</option>
        <option value="Lake">Lake</option>
      </select>
    </div>
  );
}

  // ✅ FIX helper: input -> string update (cursor bozulmasın)
  function setDraftField(key) {
    return (e) => setDraftData((x) => ({ ...x, [key]: e.target.value }));
  }

  const DraftForm = React.memo(function DraftForm() {
    const t = draftType;
    const d = draftData;

    return (
      <div style={{ display: "grid", gap: 10 }}>
        <div>
          <div style={S.mini}>Kalem Adı (istersen değiştir)</div>
          <input style={S.input} value={draftName} onChange={(e) => setDraftName(e.target.value)} placeholder={draftType} />
        </div>

        {DraftMaterialPicker()}

        {t === "Mutfak" && (
          <>
            <div style={S.grid2}>
              <div>
                <div style={S.mini}>Şekil</div>
                <select style={S.select} value={d.shape || "Duz"} onChange={(e) => setDraftData((x) => ({ ...x, shape: e.target.value }))}>
                  <option value="Duz">Düz</option>
                  <option value="L">L</option>
                  <option value="U">U</option>
                </select>
              </div>
              <div>
                <div style={S.mini}>Tavan (cm)</div>
                <input style={S.input} value={d.ceilingCm ?? ""} onChange={setDraftField("ceilingCm")} />
              </div>
            </div>

            {String(d.shape || "Duz") === "Duz" && (
              <div>
                <div style={S.mini}>Toplam duvar (cm)</div>
                <input style={S.input} value={d.totalWallCm ?? ""} onChange={setDraftField("totalWallCm")} />
              </div>
            )}

            {(String(d.shape || "Duz") === "L" || String(d.shape || "Duz") === "U") && (
              <div style={S.grid3}>
                <div>
                  <div style={S.mini}>Duvar A (cm)</div>
                  <input style={S.input} value={d.wallAcm ?? ""} onChange={setDraftField("wallAcm")} />
                </div>
                <div>
                  <div style={S.mini}>Duvar B (cm)</div>
                  <input style={S.input} value={d.wallBcm ?? ""} onChange={setDraftField("wallBcm")} />
                </div>
                <div>
                  <div style={S.mini}>Duvar C (cm)</div>
                  <input
                    style={S.input}
                    value={d.wallCcm ?? ""}
                    onChange={setDraftField("wallCcm")}
                    disabled={String(d.shape || "Duz") !== "U"}
                  />
                </div>
              </div>
            )}

            <div style={S.grid3}>
              <div>
                <div style={S.mini}>Buzdolabı (cm)</div>
                <input style={S.input} value={d.fridgeCm ?? ""} onChange={setDraftField("fridgeCm")} />
              </div>
              <div>
                <div style={S.mini}>Boy ankastre (cm)</div>
                <input style={S.input} value={d.tallOvenCm ?? ""} onChange={setDraftField("tallOvenCm")} />
              </div>
              <div>
                <div style={S.mini}>Ada (cm)</div>
                <input style={S.input} value={d.islandCm ?? ""} onChange={setDraftField("islandCm")} />
              </div>
            </div>

            <div>
              <div style={S.mini}>Üst dolap modu</div>
              <select style={S.select} value={d.upperMode || "IkiKat"} onChange={(e) => setDraftData((x) => ({ ...x, upperMode: e.target.value }))}>
                <option value="IkiKat">2 Katman (70 + 40)</option>
                <option value="Full">Full</option>
                <option value="Yok">Yok / Raf</option>
              </select>
            </div>
          </>
        )}

        {t === "Kahve Köşesi" && (
          <>
            <div style={S.grid2}>
              <div>
                <div style={S.mini}>Alt dolap eni (cm)</div>
                <input style={S.input} value={d.runAltCm ?? ""} onChange={setDraftField("runAltCm")} />
              </div>
              <div>
                <div style={S.mini}>Tavan (cm)</div>
                <input style={S.input} value={d.ceilingCm ?? ""} onChange={setDraftField("ceilingCm")} />
              </div>
            </div>

            <div style={S.grid2}>
              <div>
                <div style={S.mini}>Boy dolap toplam eni (cm)</div>
                <input style={S.input} value={d.tallTotalCm ?? ""} onChange={setDraftField("tallTotalCm")} />
              </div>
              <div>
                <div style={S.mini}>Üst dolap</div>
                <select style={S.select} value={d.hasUpper ? "Evet" : "Hayır"} onChange={(e) => setDraftData((x) => ({ ...x, hasUpper: e.target.value === "Evet" }))}>
                  <option value="Evet">Var</option>
                  <option value="Hayır">Yok</option>
                </select>
              </div>
            </div>

            <div>
              <div style={S.mini}>Bazalı üst dolap</div>
              <select style={S.select} value={d.hasBazali ? "Evet" : "Hayır"} onChange={(e) => setDraftData((x) => ({ ...x, hasBazali: e.target.value === "Evet" }))}>
                <option value="Hayır">Yok</option>
                <option value="Evet">Var</option>
              </select>
            </div>
          </>
        )}

        {t === "Hilton" && (
          <>
            <div style={S.grid2}>
              <div>
                <div style={S.mini}>Tip</div>
                <select style={S.select} value={d.tip || "Tip1"} onChange={(e) => setDraftData((x) => ({ ...x, tip: e.target.value }))}>
                  <option value="Tip1">Tip 1</option>
                  <option value="Tip2">Tip 2</option>
                  <option value="Tip3">Tip 3</option>
                </select>
              </div>
              <div>
                <div style={S.mini}>Lavabo</div>
                <select style={S.select} value={String(d.size || "80")} onChange={(e) => setDraftData((x) => ({ ...x, size: e.target.value }))}>
                  <option value="60">60</option>
                  <option value="80">80</option>
                  <option value="100">100</option>
                  <option value="120">120</option>
                </select>
              </div>
            </div>

            <div>
              <div style={S.mini}>Ayna dolap</div>
              <select style={S.select} value={d.mirrorCabinet ? "Evet" : "Hayır"} onChange={(e) => setDraftData((x) => ({ ...x, mirrorCabinet: e.target.value === "Evet" }))}>
                <option value="Hayır">Yok</option>
                <option value="Evet">Var</option>
              </select>
            </div>

            {String(d.tip || "Tip1") === "Tip3" && (
              <>
                <div style={S.mini}>Çamaşır kabini (cm)</div>
                <div style={S.grid3}>
                  <input style={S.input} value={d.wmW ?? ""} onChange={setDraftField("wmW")} placeholder="En" />
                  <input style={S.input} value={d.wmH ?? ""} onChange={setDraftField("wmH")} placeholder="Boy" />
                  <input style={S.input} value={d.wmD ?? ""} onChange={setDraftField("wmD")} placeholder="Derinlik" />
                </div>

                <div style={S.mini}>Kiler dolabı (cm)</div>
                <div style={S.grid3}>
                  <input style={S.input} value={d.panW ?? ""} onChange={setDraftField("panW")} placeholder="En" />
                  <input style={S.input} value={d.panH ?? ""} onChange={setDraftField("panH")} placeholder="Boy" />
                  <input style={S.input} value={d.panD ?? ""} onChange={setDraftField("panD")} placeholder="Derinlik" />
                </div>
              </>
            )}
          </>
        )}

        {t === "TV Ünitesi" && (
          <>
            <div style={S.mini}>Ölçüler (cm)</div>
            <div style={S.grid3}>
              <input style={S.input} value={d.w ?? ""} onChange={setDraftField("w")} placeholder="En" />
              <input style={S.input} value={d.h ?? ""} onChange={setDraftField("h")} placeholder="Boy" />
              <input style={S.input} value={d.d ?? ""} onChange={setDraftField("d")} placeholder="Derinlik" />
            </div>
          </>
        )}

        {t === "Seperatör" && (
          <>
            <div style={S.mini}>Ölçüler (cm)</div>
            <div style={S.grid3}>
              <input style={S.input} value={d.w ?? ""} onChange={setDraftField("w")} placeholder="En" />
              <input style={S.input} value={d.h ?? ""} onChange={setDraftField("h")} placeholder="Boy" />
              <input style={S.input} value={d.d ?? ""} onChange={setDraftField("d")} placeholder="Derinlik" />
            </div>
          </>
        )}

        {t === "Kapı" && (
          <>
            <div style={S.mini}>Adet</div>
            <input style={S.input} value={d.qty ?? ""} onChange={setDraftField("qty")} />
            <div style={S.mini}>Detay: Lake</div>
          </>
        )}

        {t === "Süpürgelik" && (
          <>
            <div style={S.mini}>Metre</div>
            <input style={S.input} value={d.m ?? ""} onChange={setDraftField("m")} />
            <div style={S.mini}>Detay: Lake</div>
          </>
        )}

        {t === "Sade Kalem" && (
          <>
            <div style={S.mini}>Ölçüler (cm)</div>
            <div style={S.grid3}>
              <input style={S.input} value={d.w ?? ""} onChange={setDraftField("w")} placeholder="En" />
              <input style={S.input} value={d.h ?? ""} onChange={setDraftField("h")} placeholder="Boy" />
              <input style={S.input} value={d.d ?? ""} onChange={setDraftField("d")} placeholder="Derinlik" />
            </div>
          </>
        )}

        {/* PREVIEW PRICE */}
        <div style={{ ...S.box, background: "#f9fafb" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={S.mini}>Ön İzleme</div>
            <div style={{ fontWeight: 950 }}>
              {(() => {
                const tmp = computeItem({ type: draftType, data: draftData });
                return currency(roundUpThousands(tmp.price));
              })()}
            </div>
          </div>
          <div style={S.mini}>
            {draftType === "Kapı"
              ? "Malzeme: Lake"
              : draftType === "Süpürgelik"
              ? "Malzeme: Lake"
              : `Malzeme: ${materialLabel(draftData.material || "Lake")}`}
          </div>
        </div>
      </div>
    );
  });

  function Drawer() {
    if (!drawerOpen) return null;

    return (
      <>
        <div style={S.drawerBack} onClick={closeDrawerNoSave} />
        <div style={S.drawer}>
          <div style={S.drawerHead}>
            <div>
              <div style={{ fontWeight: 950 }}>Kalem Ekle</div>
              <div style={S.mini}>{draftType}</div>
            </div>
            <button style={S.btn} onClick={closeDrawerNoSave}>
              Kapat
            </button>
          </div>

          <div style={S.drawerBody}>
            <div style={{ display: "grid", gap: 10 }}>
              <div>
                <div style={S.mini}>Kalem Türü</div>
                <select
                  style={S.select}
                  value={draftType}
                  onChange={(e) => {
                    initDraft(e.target.value);
                  }}
                >
                  {itemTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {renderDraftForm()}
            </div>
          </div>

          <div style={S.drawerFoot}>
            <button style={S.btn} onClick={closeDrawerNoSave}>
              İptal
            </button>
            <button style={S.btnPrimary} onClick={saveDraftAsItem}>
              Kaydet
            </button>
          </div>
        </div>
      </>
    );
  }

  // ---------- OFFER VIEW (A4'e OTOMATİK SIĞDIR + LOGO + DİPNOT + İMZA) ----------
  function OfferView() {
    const company = settings.companyInfo || {};
    const logoUrl = company.logoDataUrl || "";

    // A4 px (yaklaşık)
    const A4_W = 794;
    const A4_H = 1123;

    const sheetRef = useRef(null);
    const contentRef = useRef(null);
    const [fitScale, setFitScale] = useState(1);
    const [exporting, setExporting] = useState(false);

    // İçerik ne kadar uzunsa A4 içine sığacak şekilde küçült
    useLayoutEffect(() => {
      const el = contentRef.current;
      if (!el) return;

      const h = el.scrollHeight || el.getBoundingClientRect().height || 0;
      if (!h) return;

      const s = Math.min(1, A4_H / h);
      // çok uzun listede bile okunur kalsın:
      setFitScale(Math.max(0.78, s));
    }, [
      itemsComputed.length,
      (project?.accessories || []).length,
      company.logoDataUrl,
      project?.customerName,
      project?.phone,
      project?.address,
    ]);

    async function exportJpg() {
      try {
        setExporting(true);
        await new Promise((r) => setTimeout(r, 50));

        const node = sheetRef.current;
        if (!node) return;

        const canvas = await html2canvas(node, {
          backgroundColor: "#ffffff",
          scale: 3, // kalite ↑
          useCORS: true,
        });

        const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `${project?.projectNumber || "teklif"}${project?.currentVersion || "A"}-${project?.customerName || "musteri"}.jpg`;
        a.click();
      } finally {
        setExporting(false);
      }
    }

    const ST = {
      shell: {
        width: A4_W,
        minHeight: A4_H,
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 18,
        boxShadow: "0 14px 45px rgba(0,0,0,0.08)",
        overflow: "hidden",
      },
      pad: { padding: 20 },
      headerGrid: {
        display: "grid",
        gridTemplateColumns: "1.2fr 1.1fr 0.9fr",
        gap: 14,
        alignItems: "start",
      },
      logoBox: {
        width: 120,
        height: 56,
        borderRadius: 12,
        border: "1px solid #eef0f4",
        background: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      },
      logoImg: { maxWidth: "100%", maxHeight: "100%", objectFit: "contain" },

      companyName: { fontWeight: 950, fontSize: 13, color: "#0f172a" },
      companyLine: { fontSize: 10.8, color: "#475569", fontWeight: 700, lineHeight: 1.45 },

      midTitle: { fontWeight: 950, fontSize: 15, color: "#0f172a", textAlign: "center", marginTop: 2 },
      midCustomer: { fontWeight: 900, fontSize: 12, color: "#334155", textAlign: "center", marginTop: 4 },
      midSmall: { fontSize: 10.8, color: "#475569", fontWeight: 700, textAlign: "center", marginTop: 4 },

      rightTitle: { fontWeight: 950, letterSpacing: 1, fontSize: 13, color: "#0f172a", textAlign: "right" },
      rightMeta: { fontSize: 10.8, color: "#475569", fontWeight: 800, textAlign: "right", marginTop: 4 },

      divider: { marginTop: 12, borderTop: "1px solid #eef0f4" },

      tableWrap: { marginTop: 12, border: "1px solid #eef0f4", borderRadius: 14, overflow: "hidden" },
      head: { display: "grid", gridTemplateColumns: "1fr 160px", background: "#f8fafc" },
      th: { padding: 10, fontWeight: 900, fontSize: 11, color: "#334155" },
      row: { display: "grid", gridTemplateColumns: "1fr 160px", borderTop: "1px solid #eef0f4" },
      td: { padding: 10, fontSize: 11, color: "#0f172a" },
      tdRight: { padding: 10, fontSize: 11, color: "#0f172a", textAlign: "right", fontWeight: 950 },

      totals: { marginTop: 12, display: "grid", gap: 6 },
      totalRow: { display: "flex", justifyContent: "space-between", fontSize: 11, color: "#334155", fontWeight: 800 },
      grandRow: { display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 950, color: "#0f172a", marginTop: 2 },

      footerGrid: { marginTop: 14, display: "grid", gridTemplateColumns: "1.3fr 0.7fr", gap: 12, alignItems: "end" },
      notes: { fontSize: 10.6, color: "#475569", fontWeight: 700, lineHeight: 1.45, whiteSpace: "pre-line" },
      signBox: { border: "1px dashed #cbd5e1", borderRadius: 14, padding: 12, minHeight: 70 },
      signTitle: { fontSize: 10.6, fontWeight: 900, color: "#334155" },
      actionBar: { marginTop: 10, display: "flex", justifyContent: "flex-end" },
      exportBtn: {
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        background: "#fff",
        fontWeight: 900,
        cursor: "pointer",
      },
    };

    return (
      <div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div ref={sheetRef} style={ST.shell}>
            <div
              ref={contentRef}
              style={{
                ...ST.pad,
                transform: `scale(${fitScale})`,
                transformOrigin: "top left",
                width: A4_W / fitScale, // scale sonrası taşma olmasın
              }}
            >
              {/* HEADER: logo + proje/müşteri (logo ile hizalı) + teklif meta */}
              <div style={ST.headerGrid}>
                <div>
                  <div style={ST.logoBox}>
                    {logoUrl ? (
                      <img src={logoUrl} alt="logo" style={ST.logoImg} />
                    ) : (
                      <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 900 }}>LOGO</div>
                    )}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <div style={ST.companyName}>{company.name || "Şirket Adı"}</div>
                    {company.address ? <div style={ST.companyLine}>{company.address}</div> : null}
                    {company.phone ? <div style={ST.companyLine}>{company.phone}</div> : null}
                    {company.email ? <div style={ST.companyLine}>{company.email}</div> : null}
                  </div>
                </div>

                <div>
                  <div style={ST.midTitle}>{project.name}</div>
                  <div style={ST.midCustomer}>{project.customerName}</div>
                  {project.phone || project.address ? (
                    <div style={ST.midSmall}>
                      {project.phone ? `Tel: ${project.phone}` : ""}
                      {project.phone && project.address ? " • " : ""}
                      {project.address ? `Adres: ${project.address}` : ""}
                    </div>
                  ) : null}
                </div>

                <div>
                  <div style={ST.rightTitle}>TEKLİF</div>
                  <div style={ST.rightMeta}>Tarih: {formatDate(offerDate)}</div>
                  <div style={ST.rightMeta}>Kod: {code}</div>
                </div>
              </div>

              <div style={ST.divider} />

              {/* TABLE */}
              <div style={ST.tableWrap}>
                <div style={ST.head}>
                  <div style={ST.th}>Kalem / Detay</div>
                  <div style={{ ...ST.th, textAlign: "right" }}>Tutar</div>
                </div>

                {itemsComputed.map((it) => {
                  const t = normalizeType(it.type);
                  const d = it.data || {};
                  let detail = "";

                  if (t === "Kapı") detail = "Lake";
                  else if (t === "Süpürgelik") detail = "Lake";
                  else if (d.material) detail = materialLabel(d.material);

                  if (t === "Mutfak") detail = `${detail}${detail ? " • " : ""}${d.shape || "Düz"}`;
                  if (t === "Hilton") detail = `${detail}${detail ? " • " : ""}${d.tip || "Tip1"} • ${d.size || "80"}`;

                  return (
                    <div key={it.id} style={ST.row}>
                      <div style={ST.td}>
                        <div style={{ fontWeight: 950, fontSize: 11.6 }}>{it.name}</div>
                        {detail ? <div style={{ fontSize: 10.6, color: "#475569", fontWeight: 700, marginTop: 2 }}>{detail}</div> : null}
                      </div>
                      <div style={ST.tdRight}>{currency(it._price || 0)}</div>
                    </div>
                  );
                })}

                {/* Aksesuar satırı */}
                {project.accessories?.length > 0 && (
                  <div style={ST.row}>
                    <div style={ST.td}>
                      <div style={{ fontWeight: 950, fontSize: 11.6 }}>Aksesuarlar</div>
                      <div style={{ fontSize: 10.6, color: "#475569", fontWeight: 700, marginTop: 2 }}>
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
              <div style={ST.totals}>
                <div style={ST.totalRow}>
                  <div>Kalemler Toplamı</div>
                  <div>{currency(itemsTotal)}</div>
                </div>
                <div style={ST.totalRow}>
                  <div>Aksesuar Toplamı</div>
                  <div>{currency(accessoriesTotal)}</div>
                </div>
                <div style={ST.grandRow}>
                  <div>Genel Toplam</div>
                  <div>{currency(grandTotal)}</div>
                </div>
              </div>

              {/* FOOTER */}
              <div style={ST.footerGrid}>
                <div style={ST.notes}>
                  {"KDV dahil değildir.\nTermin/Montaj süresi teklif onaylandığı andan itibaren 60 gündür.\nMutfak tezgahı, evye, batarya ve lavabo taşı fiyata dahil değildir."}
                </div>

                <div style={ST.signBox}>
                  <div style={ST.signTitle}>Müşteri İmza</div>
                  <div style={{ height: 34, marginTop: 10 }} />
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

  // ---------- RENDER ----------
  return (
    <div style={S.page}>
      <div style={S.container}>
        <div style={S.topRow}>
          <button style={S.btn} onClick={onBack}>
            ← Projeler
          </button>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 950 }}>{project.name}</div>
            <div style={S.mini}>
              {project.customerName} • Kod: {code}
            </div>
          </div>
        </div>

        <div style={S.tabs}>
          <button style={S.tab(tab === "kalemler")} onClick={() => setTab("kalemler")}>
            Kalemler
          </button>
          <button style={S.tab(tab === "aksesuarlar")} onClick={() => setTab("aksesuarlar")}>
            Aksesuarlar
          </button>
          <button style={S.tab(tab === "teklif")} onClick={() => setTab("teklif")}>
            Teklif
          </button>
        </div>

        {tab === "kalemler" && (
          <>
            <div style={S.card}>
              <div style={S.cardBody}>
                <div style={{ display: "flex", gap: 10, justifyContent: "space-between", flexWrap: "wrap" }}>
                  <button style={S.btnPrimary} onClick={() => openDrawer("Mutfak")}>
                    + Kalem Ekle
                  </button>
                  <button style={S.btn} onClick={bumpVersion}>
                    Teklif Revize (+)
                  </button>
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
                  <div style={S.mini}>“+ Kalem Ekle” ile ekle, ölçüleri drawer’da doldur, Kaydet.</div>
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                {itemsComputed.map((it) => {
                  const t = normalizeType(it.type);
                  const d = it.data || {};
                  let detail = "";

                  if (t === "Kapı") detail = `Lake • Adet: ${d.qty || 1}`;
                  else if (t === "Süpürgelik") detail = `Lake • ${d.m || 0} m`;
                  else if (d.material) detail = materialLabel(d.material);

                  if (t === "Mutfak") detail = `${detail}${detail ? " • " : ""}${d.shape || "Düz"}`;
                  if (t === "Hilton") detail = `${detail}${detail ? " • " : ""}${d.tip || "Tip1"} • ${d.size || "80"}`;

                  return (
                    <div key={it.id} style={S.box}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 950 }}>{it.name}</div>
                          {detail ? <div style={S.mini}>{detail}</div> : null}
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontWeight: 950 }}>{currency(it._price || 0)}</div>
                          <button style={{ ...S.danger, marginTop: 8 }} onClick={() => removeItem(it.id)}>
                            Sil
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
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

            <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
              {accessoriesDefs
                .filter((a) => a.isActive || (project.accessories || []).some((x) => x.accessoryId === a.id))
                .sort((a, b) => String(a.name).localeCompare(String(b.name), "tr"))
                .map((a) => {
                  const qty = (project.accessories || []).find((x) => x.accessoryId === a.id)?.quantity || 0;
                  return (
                    <div key={a.id} style={S.box}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                        <div>
                          <div style={{ fontWeight: 950 }}>{a.name}</div>
                          <div style={S.mini}>
                            {a.isActive ? "Aktif" : "Pasif"} • {a.unitPrice} ₺
                          </div>
                        </div>
                        <div style={{ width: 120 }}>
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