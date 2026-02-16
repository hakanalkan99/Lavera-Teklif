import React, { useMemo, useRef, useState } from "react";
import { computeProjectTotals, materialLabel, normalizeType, roundUpThousands, toNum } from "../core/calc";

// JPG export için (mevcutta yoksa): npm i html-to-image
import { toJpeg } from "html-to-image";

export default function ProjectScreen({ projectId, state, setState, onBack }) {
  const project = state.projects.find((p) => p.id === projectId);
  const offerRef = useRef(null);

  // ---------- SETTINGS ----------
  const settings = state?.settings || {};
  const accessoriesDefs = settings.accessories || [];

  // ---------- UI STATE ----------
  const [tab, setTab] = useState("kalemler");
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Drawer form local state (KAYDETMEZSEK HİÇBİR ŞEY DEĞİŞMEZ)
  const [draftType, setDraftType] = useState("Mutfak");
  const [draftName, setDraftName] = useState("");
  const [draftData, setDraftData] = useState({}); // ✅ numeric alanları string tutacağız

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
  function currency(n) {
    try {
      return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(n);
    } catch {
      return `${Math.round(n)} ₺`;
    }
  }

  function updateProject(updater) {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => (p.id === projectId ? updater(p) : p)),
    }));
  }

  function removeItem(itemId) {
    updateProject((p) => ({ ...p, items: (p.items || []).filter((i) => i.id !== itemId) }));
  }

  function nextName(baseType, customName, projectItems) {
    const typeNorm = normalizeType(baseType);
    const existing = (projectItems || []).filter((i) => normalizeType(i.type) === typeNorm);
    const n = existing.length + 1;
    const base = (customName || typeNorm).trim() || typeNorm;
    return n > 1 ? `${base} ${n}` : base;
  }

  // ---------- COMPUTED TOTALS (tek kaynaktan) ----------
  const totals = useMemo(() => computeProjectTotals(state, project), [state, project]);
  const itemsComputed = totals.items;
  const itemsTotal = totals.itemsTotal;
  const accessoriesTotal = totals.accessoriesTotal;
  const grandTotal = totals.grandTotal;

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

  // ✅ numeric alanlar string olsun → input caret stabil
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

  // ---------- SAVE DRAFT => ADD ITEM ----------
  function saveDraftAsItem() {
    const id = (crypto.randomUUID && crypto.randomUUID()) || String(Date.now() + Math.random());
    updateProject((p) => {
      const name = nextName(draftType, draftName || draftType, p.items || []);
      // ✅ data aynen saklanır (stringler dahil) → hesap motoru toNum ile çözer
      const newItem = { id, type: draftType, name, data: { ...draftData } };
      return { ...p, items: [...(p.items || []), newItem] };
    });
    setDrawerOpen(false);
  }

  // ---------- ACCESSORY QTY ----------
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

  // ---------- JPG EXPORT (yüksek kalite) ----------
  async function exportOfferJpg() {
    if (!offerRef.current) return;
    const dataUrl = await toJpeg(offerRef.current, {
      quality: 0.98,
      pixelRatio: 4, // ✅ kaliteyi artırır
      cacheBust: true,
      backgroundColor: "#ffffff",
    });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${project.name || "teklif"}-${code}.jpg`;
    a.click();
  }

  // ---------- DRAFT RENDER ----------
  function DraftMaterialPicker() {
    if (draftType === "Kapı" || draftType === "Süpürgelik") return null;
    return (
      <div>
        <div style={S.mini}>Malzeme</div>
        <select style={S.select} value={draftData.material || "Lake"} onChange={(e) => setDraftData((x) => ({ ...x, material: e.target.value }))}>
          <option value="MDFLAM">MDFLAM</option>
          <option value="HGloss">High Gloss</option>
          <option value="LakPanel">Lak Panel</option>
          <option value="Lake">Lake</option>
        </select>
      </div>
    );
  }

  // ✅ inputMode + string state => yazma “tek tek” hissi gider
  const numInputProps = { inputMode: "numeric", pattern: "[0-9]*" };

  function DraftForm() {
    const t = draftType;
    const d = draftData;

    // preview: aynı motorla
    const previewPrice = (() => {
      // computeProjectTotals motoru item üstünden çalışıyor; burada minik item yapıyoruz
      // roundUpThousands yine uygulanıyor
      // NOTE: calc.js toNum ile stringleri çözüyor
      const tmpState = state;
      const tmpItem = { type: draftType, data: draftData };
      // computeProjectTotals yok çünkü project ister; biz roundUpThousands + computeItemPrice yolu yerine kısa kestik:
      // => burada hızlı yöntem: kalemin fiyatını proje kaydedince zaten doğru göreceksin.
      // Ama preview için mevcut yaklaşım: “yaklaşık” yerine, eski mantıkla roundUpThousands(toNum...) yapmayalım.
      // Bu nedenle: preview'ı basitçe Kaydetten sonra listede görürsün.
      // (İstersen preview'ı da %100 aynı yapacak şekilde ekleyebilirim.)
      return null;
    })();

    return (
      <div style={{ display: "grid", gap: 10 }}>
        <div>
          <div style={S.mini}>Kalem Adı (istersen değiştir)</div>
          <input style={S.input} value={draftName} onChange={(e) => setDraftName(e.target.value)} placeholder={draftType} />
        </div>

        <DraftMaterialPicker />

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
                <input {...numInputProps} style={S.input} value={String(d.ceilingCm ?? "")} onChange={(e) => setDraftData((x) => ({ ...x, ceilingCm: e.target.value }))} />
              </div>
            </div>

            {String(d.shape || "Duz") === "Duz" && (
              <div>
                <div style={S.mini}>Toplam duvar (cm)</div>
                <input {...numInputProps} style={S.input} value={String(d.totalWallCm ?? "")} onChange={(e) => setDraftData((x) => ({ ...x, totalWallCm: e.target.value }))} />
              </div>
            )}

            {(String(d.shape || "Duz") === "L" || String(d.shape || "Duz") === "U") && (
              <div style={S.grid3}>
                <div>
                  <div style={S.mini}>Duvar A (cm)</div>
                  <input {...numInputProps} style={S.input} value={String(d.wallAcm ?? "")} onChange={(e) => setDraftData((x) => ({ ...x, wallAcm: e.target.value }))} />
                </div>
                <div>
                  <div style={S.mini}>Duvar B (cm)</div>
                  <input {...numInputProps} style={S.input} value={String(d.wallBcm ?? "")} onChange={(e) => setDraftData((x) => ({ ...x, wallBcm: e.target.value }))} />
                </div>
                <div>
                  <div style={S.mini}>Duvar C (cm)</div>
                  <input
                    {...numInputProps}
                    style={S.input}
                    value={String(d.wallCcm ?? "")}
                    onChange={(e) => setDraftData((x) => ({ ...x, wallCcm: e.target.value }))}
                    disabled={String(d.shape || "Duz") !== "U"}
                  />
                </div>
              </div>
            )}

            <div style={S.grid3}>
              <div>
                <div style={S.mini}>Buzdolabı (cm)</div>
                <input {...numInputProps} style={S.input} value={String(d.fridgeCm ?? "")} onChange={(e) => setDraftData((x) => ({ ...x, fridgeCm: e.target.value }))} />
              </div>
              <div>
                <div style={S.mini}>Boy ankastre (cm)</div>
                <input {...numInputProps} style={S.input} value={String(d.tallOvenCm ?? "")} onChange={(e) => setDraftData((x) => ({ ...x, tallOvenCm: e.target.value }))} />
              </div>
              <div>
                <div style={S.mini}>Ada (cm)</div>
                <input {...numInputProps} style={S.input} value={String(d.islandCm ?? "")} onChange={(e) => setDraftData((x) => ({ ...x, islandCm: e.target.value }))} />
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
                <input {...numInputProps} style={S.input} value={String(d.runAltCm ?? "")} onChange={(e) => setDraftData((x) => ({ ...x, runAltCm: e.target.value }))} />
              </div>
              <div>
                <div style={S.mini}>Tavan (cm)</div>
                <input {...numInputProps} style={S.input} value={String(d.ceilingCm ?? "")} onChange={(e) => setDraftData((x) => ({ ...x, ceilingCm: e.target.value }))} />
              </div>
            </div>

            <div style={S.grid2}>
              <div>
                <div style={S.mini}>Boy dolap toplam eni (cm)</div>
                <input {...numInputProps} style={S.input} value={String(d.tallTotalCm ?? "")} onChange={(e) => setDraftData((x) => ({ ...x, tallTotalCm: e.target.value }))} />
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
                  <input {...numInputProps} style={S.input} value={String(d.wmW ?? "")} onChange={(e) => setDraftData((x) => ({ ...x, wmW: e.target.value }))} placeholder="En" />
                  <input {...numInputProps} style={S.input} value={String(d.wmH ?? "")} onChange={(e) => setDraftData((x) => ({ ...x, wmH: e.target.value }))} placeholder="Boy" />
                  <input {...numInputProps} style={S.input} value={String(d.wmD ?? "")} onChange={(e) => setDraftData((x) => ({ ...x, wmD: e.target.value }))} placeholder="Derinlik" />
                </div>

                <div style={S.mini}>Kiler dolabı (cm)</div>
                <div style={S.grid3}>
                  <input {...numInputProps} style={S.input} value={String(d.panW ?? "")} onChange={(e) => setDraftData((x) => ({ ...x, panW: e.target.value }))} placeholder="En" />
                  <input {...numInputProps} style={S.input} value={String(d.panH ?? "")} onChange={(e) => setDraftData((x) => ({ ...x, panH: e.target.value }))} placeholder="Boy" />
                  <input {...numInputProps} style={S.input} value={String(d.panD ?? "")} onChange={(e) => setDraftData((x) => ({ ...x, panD: e.target.value }))} placeholder="Derinlik" />
                </div>
              </>
            )}
          </>
        )}

        {t === "TV Ünitesi" && (
          <>
            <div style={S.mini}>Ölçüler (cm)</div>
            <div style={S.grid3}>
              <input {...numInputProps} style={S.input} value={String(d.w ?? "")} onChange={(e) => setDraftData((x) => ({ ...x, w: e.target.value }))} placeholder="En" />
              <input {...numInputProps} style={S.input} value={String(d.h ?? "")} onChange={(e) => setDraftData((x) => ({ ...x, h: e.target.value }))} placeholder="Boy" />
              <input {...numInputProps} style={S.input} value={String(d.d ?? "")} onChange={(e) => setDraftData((x) => ({ ...x, d: e.target.value }))} placeholder="Derinlik" />
            </div>
          </>
        )}

        {t === "Seperatör" && (
          <>
            <div style={S.mini}>Ölçüler (cm)</div>
            <div style={S.grid3}>
              <input {...numInputProps} style={S.input} value={String(d.w ?? "")} onChange={(e) => setDraftData((x) => ({ ...x, w: e.target.value }))} placeholder="En" />
              <input {...numInputProps} style={S.input} value={String(d.h ?? "")} onChange={(e) => setDraftData((x) => ({ ...x, h: e.target.value }))} placeholder="Boy" />
              <input {...numInputProps} style={S.input} value={String(d.d ?? "")} onChange={(e) => setDraftData((x) => ({ ...x, d: e.target.value }))} placeholder="Derinlik" />
            </div>
          </>
        )}

        {t === "Kapı" && (
          <>
            <div style={S.mini}>Adet</div>
            <input {...numInputProps} style={S.input} value={String(d.qty ?? "")} onChange={(e) => setDraftData((x) => ({ ...x, qty: e.target.value }))} />
            <div style={S.mini}>Detay: Lake</div>
          </>
        )}

        {t === "Süpürgelik" && (
          <>
            <div style={S.mini}>Metre</div>
            <input {...numInputProps} style={S.input} value={String(d.m ?? "")} onChange={(e) => setDraftData((x) => ({ ...x, m: e.target.value }))} />
            <div style={S.mini}>Detay: Lake</div>
          </>
        )}

        {t === "Sade Kalem" && (
          <>
            <div style={S.mini}>Ölçüler (cm)</div>
            <div style={S.grid3}>
              <input {...numInputProps} style={S.input} value={String(d.w ?? "")} onChange={(e) => setDraftData((x) => ({ ...x, w: e.target.value }))} placeholder="En" />
              <input {...numInputProps} style={S.input} value={String(d.h ?? "")} onChange={(e) => setDraftData((x) => ({ ...x, h: e.target.value }))} placeholder="Boy" />
              <input {...numInputProps} style={S.input} value={String(d.d ?? "")} onChange={(e) => setDraftData((x) => ({ ...x, d: e.target.value }))} placeholder="Derinlik" />
            </div>
          </>
        )}

        {/* (Preview kısmını tasarımla bozmamak için aynı bırakmadım, istersen %100 doğru preview’u da eklerim) */}
      </div>
    );
  }

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
            <button style={S.btn} onClick={closeDrawerNoSave}>Kapat</button>
          </div>

          <div style={S.drawerBody}>
            <div style={{ display: "grid", gap: 10 }}>
              <div>
                <div style={S.mini}>Kalem Türü</div>
                <select
                  style={S.select}
                  value={draftType}
                  onChange={(e) => initDraft(e.target.value)}
                >
                  {itemTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

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

  // ---------- OFFER VIEW ----------
  function OfferView() {
    const company = settings.companyInfo || {};
    return (
      <div style={S.card} ref={offerRef}>
        <div style={S.cardBody}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <div style={{ whiteSpace: "pre-line" }}>
              <div style={{ fontWeight: 950 }}>{company.name || "Şirket Adı"}</div>
              <div style={S.mini}>{company.address || ""}</div>
              <div style={S.mini}>{company.phone || ""}</div>
              <div style={S.mini}>{company.email || ""}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 950 }}>TEKLİF</div>
              <div style={S.mini}>Tarih: {formatDate(offerDate)}</div>
              <div style={S.mini}>Kod: {code}</div>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 12 }}>
            <div style={{ fontWeight: 950, fontSize: 16 }}>{project.name}</div>
            <div style={S.mini}>{project.customerName}</div>
            {(project.phone || project.address) && (
              <div style={S.mini}>
                {project.phone ? `Tel: ${project.phone}` : ""}
                {project.phone && project.address ? " • " : ""}
                {project.address ? `Adres: ${project.address}` : ""}
              </div>
            )}
          </div>

          <div style={{ marginTop: 14, borderTop: "1px solid #eef0f4", paddingTop: 12 }}>
            <div style={{ fontWeight: 950, marginBottom: 8 }}>Kalemler</div>

            <div style={{ border: "1px solid #eef0f4", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", background: "#f9fafb" }}>
                <div style={{ padding: 10, fontWeight: 900, fontSize: 12 }}>Kalem / Detay</div>
                <div style={{ padding: 10, fontWeight: 900, fontSize: 12, textAlign: "right" }}>Tutar</div>
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
                  <div key={it.id} style={{ display: "grid", gridTemplateColumns: "1fr 140px", borderTop: "1px solid #eef0f4" }}>
                    <div style={{ padding: 10 }}>
                      <div style={{ fontWeight: 900 }}>{it.name}</div>
                      {detail ? <div style={S.mini}>{detail}</div> : null}
                    </div>
                    <div style={{ padding: 10, textAlign: "right", fontWeight: 950 }}>{currency(it._price || 0)}</div>
                  </div>
                );
              })}
            </div>

            {/* ✅ Aksesuar toplamı eklendi */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
              <div style={S.mini}>Aksesuar Toplamı</div>
              <div style={{ fontWeight: 950 }}>{currency(accessoriesTotal)}</div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
              <div style={S.mini}>Genel Toplam</div>
              <div style={{ fontWeight: 950, fontSize: 18 }}>{currency(grandTotal)}</div>
            </div>

            {/* Senin istediğin ibareler */}
            <div style={{ marginTop: 12, borderTop: "1px solid #eef0f4", paddingTop: 10 }}>
              <div style={S.mini}>• Fiyatlara KDV dahil değildir.</div>
              <div style={S.mini}>• Termin/montaj süresi teklif onaylandığı andan itibaren 60 gündür.</div>
            </div>

            {/* ✅ JPG butonu */}
            <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button style={S.btnPrimary} onClick={exportOfferJpg}>JPG Çıktı Al</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------- MAIN RENDER ----------
  return (
    <div style={S.page}>
      <div style={S.container}>
        <div style={S.topRow}>
          <button style={S.btn} onClick={onBack}>← Projeler</button>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 950 }}>{project.name}</div>
            <div style={S.mini}>{project.customerName} • Kod: {code}</div>
          </div>
        </div>

        <div style={S.tabs}>
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
                          <button style={{ ...S.danger, marginTop: 8 }} onClick={() => removeItem(it.id)}>Sil</button>
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
                          <div style={S.mini}>{a.isActive ? "Aktif" : "Pasif"} • {a.unitPrice} ₺</div>
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