// src/core/calc.js
export function toNum(v) {
  const n = Number(String(v ?? "").replace(",", ".").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function roundUpThousands(n) {
  const x = Number(n || 0);
  return Math.ceil(x / 1000) * 1000;
}

export function normalizeType(t) {
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

export function materialLabel(m) {
  if (m === "MDFLAM") return "MDFLAM";
  if (m === "HGloss") return "High Gloss";
  if (m === "LakPanel") return "Lak Panel";
  return "Lake";
}

function factorFromDims(widthCm, heightCm, depthCm) {
  const w = Math.max(0, widthCm) / 100;
  const h = Math.max(0, heightCm) / 100;
  const d = Math.max(0, depthCm) / 100;
  return w * h * (1 + d);
}

export function getSettings(state) {
  const settings = state?.settings || {};
  const materialPrices = settings.materialPrices || { MDFLAM: 100, HGloss: 120, LakPanel: 150, Lake: 200 };
  const coeff = settings.coefficients || { hilton: 1.0, tv: 1.0, seperator: 1.0, coffee: 1.0 };
  const accessoriesDefs = settings.accessories || [];
  const doorUnit = settings.doorPrice ?? 12000;
  const skirtingUnit = settings.skirtingPricePerMeter ?? 300;

  return { settings, materialPrices, coeff, accessoriesDefs, doorUnit, skirtingUnit };
}

export function computeItemPrice(state, item) {
  const { materialPrices, coeff, doorUnit, skirtingUnit } = getSettings(state);
  const type = normalizeType(item.type);
  const data = item.data || {};

  function calcKitchenPrice(d) {
    const shape = d.shape || "Duz";
    const ceiling = toNum(d.ceilingCm || 260);

    const fridge = toNum(d.fridgeCm || 90);
    const tallOven = toNum(d.tallOvenCm || 60);
    const tallTotal = fridge + tallOven;

    const mat = d.material || "Lake";
    const unit = materialPrices[mat] || 0;

    const altDepthFactor = 1.6;
    let runAltCm = 0;

    if (shape === "Duz") {
      const totalWall = toNum(d.totalWallCm || 600);
      runAltCm = Math.max(0, totalWall - tallTotal);
    }
    if (shape === "L") {
      const a = toNum(d.wallAcm || 400);
      const b = toNum(d.wallBcm || 500);
      runAltCm = Math.max(0, a + b - tallTotal - 60);
    }
    if (shape === "U") {
      const a = toNum(d.wallAcm || 300);
      const b = toNum(d.wallBcm || 300);
      const c = toNum(d.wallCcm || 300);
      runAltCm = Math.max(0, a + b + c - tallTotal - 120);
    }

    const island = toNum(d.islandCm || 0);
    runAltCm += Math.max(0, island);

    const altFactor = (runAltCm / 100) * 1.0 * altDepthFactor;
    const tallFactor = (tallTotal / 100) * (ceiling / 100) * altDepthFactor;

    const upperMode = d.upperMode || "IkiKat";
    let upperFactor = 0;
    if (upperMode === "IkiKat") upperFactor = (runAltCm / 100) * 1.1 * 1.35;
    else if (upperMode === "Full") upperFactor = (runAltCm / 100) * 1.1 * 1.35;
    else upperFactor = 0;

    const totalFactor = altFactor + tallFactor + upperFactor;
    return { factor: totalFactor, price: totalFactor * unit };
  }

  function calcCoffeePrice(d) {
    const mat = d.material || "Lake";
    const unit = materialPrices[mat] || 0;

    const runAltCm = toNum(d.runAltCm || 120);
    const ceiling = toNum(d.ceilingCm || 260);

    const altFactor = (runAltCm / 100) * 1.0 * 1.6;

    const tallCm = toNum(d.tallTotalCm || 0);
    const tallFactor = (tallCm / 100) * (ceiling / 100) * 1.6;

    const hasUpper = d.hasUpper === true || String(d.hasUpper) === "true";
    const hasBazali = d.hasBazali === true || String(d.hasBazali) === "true";

    let upperFactor = 0;
    if (hasUpper) upperFactor += (runAltCm / 100) * 0.7 * 1.35;
    if (hasBazali) upperFactor += (runAltCm / 100) * 0.4 * 1.6;

    const totalFactor = (altFactor + tallFactor + upperFactor) * (coeff.coffee || 1);
    return { factor: totalFactor, price: totalFactor * unit };
  }

  function calcHiltonPrice(d) {
    const mat = d.material || "Lake";
    const unit = materialPrices[mat] || 0;

    const tip = d.tip || "Tip1";
    const size = String(d.size || "80");
    const mirrorCabinet = d.mirrorCabinet === true || String(d.mirrorCabinet) === "true";

    let base = 1.5; // 80
    if (size === "60") base = 1.0; // 80'in 0.5 eksiği
    if (size === "100") base = 2.0;
    if (size === "120") base = 2.5;

    if (mirrorCabinet) base += 0.5;
    if (tip === "Tip2" || tip === "Tip3") base += 1.0;

    let extra = 0;
    if (tip === "Tip3") {
      extra += factorFromDims(toNum(d.wmW || 60), toNum(d.wmH || 200), toNum(d.wmD || 60));
      extra += factorFromDims(toNum(d.panW || 45), toNum(d.panH || 200), toNum(d.panD || 60));
    }

    const factor = (base + extra) * (coeff.hilton || 1);
    return { factor, price: factor * unit };
  }

  function calcSimplePrice(d) {
    const mat = d.material || "Lake";
    const unit = materialPrices[mat] || 0;
    const factor = factorFromDims(toNum(d.w || 100), toNum(d.h || 100), toNum(d.d || 60));
    return { factor, price: factor * unit };
  }

  function calcSeperatorPrice(d) {
    const mat = d.material || "Lake";
    const unit = materialPrices[mat] || 0;
    const factor = factorFromDims(toNum(d.w || 100), toNum(d.h || 250), toNum(d.d || 10)) * (coeff.seperator || 1);
    return { factor, price: factor * unit };
  }

  function calcTvPrice(d) {
    const mat = d.material || "Lake";
    const unit = materialPrices[mat] || 0;
    const factor = factorFromDims(toNum(d.w || 300), toNum(d.h || 250), toNum(d.d || 40)) * (coeff.tv || 1);
    return { factor, price: factor * unit };
  }

  function calcDoorPrice(d) {
    const qty = Math.max(0, Math.floor(toNum(d.qty || 1)));
    return { factor: qty, price: qty * doorUnit };
  }

  function calcSkirtingPrice(d) {
    const m = Math.max(0, toNum(d.m || 10));
    return { factor: m, price: m * skirtingUnit };
  }

  if (type === "Mutfak") return calcKitchenPrice(data);
  if (type === "Kahve Köşesi") return calcCoffeePrice(data);
  if (type === "Hilton") return calcHiltonPrice(data);
  if (type === "Seperatör") return calcSeperatorPrice(data);
  if (type === "TV Ünitesi") return calcTvPrice(data);
  if (type === "Kapı") return calcDoorPrice(data);
  if (type === "Süpürgelik") return calcSkirtingPrice(data);
  return calcSimplePrice(data);
}

export function computeProjectTotals(state, project) {
  const { accessoriesDefs } = getSettings(state);

  const items = (project?.items || []).map((it) => {
    const r = computeItemPrice(state, it);
    const rounded = roundUpThousands(r.price);
    return { ...it, _rawPrice: r.price, _price: rounded, _factor: r.factor, type: normalizeType(it.type) };
  });

  const itemsTotal = roundUpThousands(items.reduce((s, it) => s + (it._price || 0), 0));

  let accRaw = 0;
  for (const pa of project?.accessories || []) {
    const def = accessoriesDefs.find((a) => a.id === pa.accessoryId);
    if (!def) continue;
    accRaw += (Number(pa.quantity) || 0) * (Number(def.unitPrice) || 0);
  }
  const accessoriesTotal = roundUpThousands(accRaw);
  const grandTotal = roundUpThousands(itemsTotal + accessoriesTotal);

  return { items, itemsTotal, accessoriesTotal, grandTotal };
}