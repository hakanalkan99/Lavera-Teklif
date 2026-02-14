import React, { useMemo, useState } from "react";

function currencyTRY(n) {
  try {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 0,
    }).format(Number(n || 0));
  } catch {
    return `${Math.round(Number(n || 0))} ₺`;
  }
}

function formatDate(iso) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  return `${dd}.${mm}.${yy}`;
}

function toNumber(v) {
  const cleaned = String(v ?? "").replace(/,/g, ".").replace(/[^0-9.]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// factor = en(m) × yükseklik(m) × (1 + derinlik(m))
function factorFromDims(widthCm, heightCm, depthCm) {
  const w = Math.max(0, widthCm) / 100;
  const h = Math.max(0, heightCm) / 100;
  const d = Math.max(0, depthCm) / 100;
  return w * h * (1 + d);
}

function itemsTotal(project) {
  return (project.items || []).reduce((sum, it) => sum + (it.price || 0), 0);
}

function accessoriesTotal(project, settings) {
  let total = 0;
  const defs = settings?.accessories || [];
  for (const pa of project.accessories || []) {
    const def = defs.find((a) => a.id === pa.accessoryId);
    if (!def) continue;
    total += (pa.quantity || 0) * (def.unitPrice || 0);
  }
  return total;
}

function materialLabel(m) {
  if (m === "MDFLAM") return "MDFLAM";
  if (m === "HGloss") return "High Gloss";
  if (m === "LakPanel") return "Lak Panel";
  return "Lake";
}

function Pill({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 12px",
        borderRadius: 999,
        border: "1px solid " + (active ? "#111827" : "#E5E7EB"),
        background: active ? "#111827" : "#fff",
        color: active ? "#fff" : "#111827",
        fontWeight: 700,
        fontSize: 13,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

function Btn({ variant = "primary", children, onClick, disabled }) {
  const bg =
    variant === "primary"
      ? "#111827"
      : variant === "danger"
      ? "#DC2626"
      : "#fff";
  const color = variant === "ghost" ? "#111827" : "#fff";
  const border = variant === "ghost" ? "1px solid #E5E7EB" : "1px solid transparent";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "10px 12px",
        borderRadius: 14,
        border,
        background: disabled ? "#9CA3AF" : bg,
        color: disabled ? "#111827" : color,
        fontWeight: 800,
        fontSize: 13,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

function Card({ children }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #E5E7EB",
        borderRadius: 18,
        boxShadow: "0 2px 10px rgba(17,24,39,0.06)",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: "#374151", marginBottom: 6 }}>
        {label}
      </div>
      {children}
    </label>
  );
}

function Input({ value, onChange, placeholder, right }) {
  return (
    <div style={{ position: "relative" }}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: right ? "10px 42px 10px 12px" : "10px 12px",
          borderRadius: 14,
          border: "1px solid #E5E7EB",
          outline: "none",
          fontSize: 14,
        }}
      />
      {right ? (
        <div
          style={{
            position: "absolute",
            right: 10,
            top: 9,
            fontSize: 12,
            color: "#6B7280",
            fontWeight: 800,
          }}
        >
          {right}
        </div>
      ) : null}
    </div>
  );
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        padding: "10px 12px",
        borderRadius: 14,
        border: "1px solid #E5E7EB",
        outline: "none",
        fontSize: 14,
        background: "#fff",
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 50,
        padding: 12,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(520px, 100%)",
          background: "#fff",
          borderRadius: 22,
          border: "1px solid #E5E7EB",
          boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
          padding: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ fontWeight: 900, fontSize: 15 }}>{title}</div>
          <Btn variant="ghost" onClick={onClose}>
            Kapat
          </Btn>
        </div>
        <div style={{ marginTop: 12 }}>{children}</div>
      </div>
    </div>
  );
}

export default function ProjectScreen({ projectId, state, setState, onBack }) {
  const project = (state.projects || []).find((p) => p.id === projectId);
  const settings = state.settings || {};

  const [tab, setTab] = useState("kalemler"); // kalemler | aksesuarlar | teklif
  const [addOpen, setAddOpen] = useState(false);

  // --- Add item drafts ---
  const [draftType, setDraftType] = useState("sade"); // sade | kapi | supurgelik
  const [draftName, setDraftName] = useState("");
  const [draftMaterial, setDraftMaterial] = useState("Lake");
  const [draftW, setDraftW] = useState("");
  const [draftH, setDraftH] = useState("");
  const [draftD, setDraftD] = useState("");

  const [draftDoorQty, setDraftDoorQty] = useState("");
  const [draftSkirtM, setDraftSkirtM] = useState("");

  if (!project) {
    return (
      <div style={{ minHeight: "100vh", background: "#F5F6F8", padding: 16 }}>
        <Card>
          <div style={{ padding: 16 }}>
            <div style={{ fontWeight: 900 }}>Proje bulunamadı</div>
            <div style={{ marginTop: 8 }}>
              <Btn variant="ghost" onClick={onBack}>
                ← Projelere dön
              </Btn>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const totalItems = itemsTotal(project);
  const totalAcc = accessoriesTotal(project, settings);
  const totalAll = totalItems + totalAcc;

  function resetDrafts(type = "sade") {
    setDraftType(type);
    setDraftName("");
    setDraftMaterial("Lake");
    setDraftW("");
    setDraftH("");
    setDraftD("");
    setDraftDoorQty("");
    setDraftSkirtM("");
  }

  function autoNameFallback(t) {
    const base = t === "sade" ? "Kalem" : t === "kapi" ? "Kapı" : "Süpürgelik";
    const count = (project.items || []).filter((x) => x.type === t).length + 1;
    return `${base} ${count}`;
  }

  function saveNewItem() {
    const name = (draftName || "").trim() || autoNameFallback(draftType);

    let newItem = null;

    if (draftType === "sade") {
      const w = toNumber(draftW);
      const h = toNumber(draftH);
      const d = toNumber(draftD);
      const factor = factorFromDims(w, h, d);
      const unit = (settings.materialPrices || {})[draftMaterial] || 0;
      const price = factor * unit;

      newItem = {
        id: uuid(),
        type: "sade",
        name,
        material: draftMaterial,
        widthCm: w,
        heightCm: h,
        depthCm: d,
        calculatedFactor: factor,
        price,
      };
    }

    if (draftType === "kapi") {
      const qty = Math.max(0, Math.floor(toNumber(draftDoorQty)));
      const doorPrice = settings.doorPrice || 12000;
      newItem = {
        id: uuid(),
        type: "kapi",
        name,
        doorQty: qty,
        price: qty * doorPrice,
      };
    }

    if (draftType === "supurgelik") {
      const meters = Math.max(0, toNumber(draftSkirtM));
      const per = settings.skirtingPricePerMeter || 350;
      newItem = {
        id: uuid(),
        type: "supurgelik",
        name,
        skirtingMeters: meters,
        price: meters * per,
      };
    }

    if (!newItem) return;

    setState((prev) => ({
      ...prev,
      projects: (prev.projects || []).map((p) =>
        p.id === projectId ? { ...p, items: [newItem, ...(p.items || [])] } : p
      ),
    }));

    setAddOpen(false);
  }

  function deleteItem(itemId) {
    setState((prev) => ({
      ...prev,
      projects: (prev.projects || []).map((p) =>
        p.id === projectId ? { ...p, items: (p.items || []).filter((i) => i.id !== itemId) } : p
      ),
    }));
  }

  function setAccessoryQty(accessoryId, qty) {
    const safeQty = Math.max(0, Math.floor(qty));

    setState((prev) => ({
      ...prev,
      projects: (prev.projects || []).map((p) => {
        if (p.id !== projectId) return p;

        const existing = (p.accessories || []).find((x) => x.accessoryId === accessoryId);
        let next = [...(p.accessories || [])];

        if (!existing) {
          if (safeQty > 0) next = [{ accessoryId, quantity: safeQty }, ...next];
        } else {
          next = next.map((x) => (x.accessoryId === accessoryId ? { ...x, quantity: safeQty } : x));
          next = next.filter((x) => x.quantity > 0);
        }

        return { ...p, accessories: next };
      }),
    }));
  }

  const accessoryRows = useMemo(() => {
    const defs = settings.accessories || [];
    const usedIds = new Set((project.accessories || []).map((a) => a.accessoryId));
    const visible = defs.filter((d) => d.isActive || usedIds.has(d.id));
    return [...visible].sort((a, b) => (a.name || "").localeCompare(b.name || "", "tr"));
  }, [project.accessories, settings.accessories]);

  return (
    <div style={{ minHeight: "100vh", background: "#F5F6F8" }}>
      {/* Topbar */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid #E5E7EB",
        }}
      >
        <div
          style={{
            maxWidth: 860,
            margin: "0 auto",
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 950, fontSize: 15, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {project.name}
            </div>
            <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 800 }}>
              {project.customerName} • Kod: {project.projectNumber}
              {project.currentVersion || "A"} • {formatDate(project.createdAtISO || new Date().toISOString())}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="ghost" onClick={onBack}>
              ← Projeler
            </Btn>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: 14 }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8 }}>
          <Pill active={tab === "kalemler"} onClick={() => setTab("kalemler")}>
            Kalemler
          </Pill>
          <Pill active={tab === "aksesuarlar"} onClick={() => setTab("aksesuarlar")}>
            Aksesuarlar
          </Pill>
          <Pill active={tab === "teklif"} onClick={() => setTab("teklif")}>
            Teklif
          </Pill>
        </div>

        {/* Content */}
        {tab === "kalemler" && (
          <div style={{ display: "grid", gap: 12 }}>
            <Card>
              <div style={{ padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 900 }}>Kalemler toplamı</div>
                  <div style={{ fontSize: 20, fontWeight: 950, color: "#111827" }}>{currencyTRY(totalItems)}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn
                    variant="primary"
                    onClick={() => {
                      resetDrafts("sade");
                      setAddOpen(true);
                    }}
                  >
                    + Kalem Ekle
                  </Btn>
                </div>
              </div>
            </Card>

            {(project.items || []).length === 0 ? (
              <Card>
                <div style={{ padding: 14 }}>
                  <div style={{ fontWeight: 950, color: "#111827" }}>Henüz kalem yok</div>
                  <div style={{ marginTop: 6, color: "#6B7280", fontWeight: 700, fontSize: 13 }}>
                    “+ Kalem Ekle” ile mutfak/vestiyer/hilton vb. kalemleri girmeye başlayacağız.
                  </div>
                </div>
              </Card>
            ) : (
              (project.items || []).map((it) => (
                <Card key={it.id}>
                  <div style={{ padding: 14, display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 950, color: "#111827", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {it.name}
                      </div>
                      <div style={{ marginTop: 4, fontSize: 12, color: "#6B7280", fontWeight: 800 }}>
                        {it.type === "sade"
                          ? `Malzeme: ${materialLabel(it.material)} • Ölçü: ${it.widthCm}×${it.heightCm}×${it.depthCm} cm`
                          : it.type === "kapi"
                          ? `Kapı • Adet: ${it.doorQty || 0}`
                          : `Süpürgelik • Metre: ${it.skirtingMeters || 0} m`}
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 950, fontSize: 16, color: "#111827" }}>{currencyTRY(it.price)}</div>
                      <div style={{ marginTop: 8 }}>
                        <Btn variant="danger" onClick={() => deleteItem(it.id)}>
                          Sil
                        </Btn>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}

            <Card>
              <div style={{ padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 900 }}>Devam</div>
                  <div style={{ fontWeight: 950, color: "#111827" }}>Aksesuarları gir</div>
                </div>
                <Btn variant="primary" onClick={() => setTab("aksesuarlar")}>
                  Aksesuarlar →
                </Btn>
              </div>
            </Card>

            {/* Add Item Modal */}
            <Modal open={addOpen} title="Kalem Ekle" onClose={() => setAddOpen(false)}>
              <div style={{ display: "grid", gap: 10 }}>
                <Field label="Kalem türü">
                  <Select
                    value={draftType}
                    onChange={(v) => resetDrafts(v)}
                    options={[
                      { value: "sade", label: "Sade Ölçü (en-yükseklik-derinlik)" },
                      { value: "kapi", label: "Kapı (adet)" },
                      { value: "supurgelik", label: "Süpürgelik (metre)" },
                    ]}
                  />
                </Field>

                <Field label="Kalem adı (opsiyonel)">
                  <Input value={draftName} onChange={setDraftName} placeholder={autoNameFallback(draftType)} />
                </Field>

                {draftType === "sade" && (
                  <>
                    <Field label="Malzeme">
                      <Select
                        value={draftMaterial}
                        onChange={setDraftMaterial}
                        options={[
                          { value: "MDFLAM", label: "MDFLAM" },
                          { value: "HGloss", label: "High Gloss" },
                          { value: "LakPanel", label: "Lak Panel" },
                          { value: "Lake", label: "Lake" },
                        ]}
                      />
                    </Field>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                      <Field label="En (cm)">
                        <Input value={draftW} onChange={setDraftW} placeholder="0" />
                      </Field>
                      <Field label="Yükseklik (cm)">
                        <Input value={draftH} onChange={setDraftH} placeholder="0" />
                      </Field>
                      <Field label="Derinlik (cm)">
                        <Input value={draftD} onChange={setDraftD} placeholder="0" />
                      </Field>
                    </div>

                    <Card>
                      <div style={{ padding: 12 }}>
                        <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 900 }}>Önizleme</div>
                        <div style={{ marginTop: 6, fontWeight: 950 }}>
                          Katsayı:{" "}
                          {factorFromDims(toNumber(draftW), toNumber(draftH), toNumber(draftD)).toFixed(3)}
                        </div>
                        <div style={{ marginTop: 4, fontWeight: 950 }}>
                          Tutar:{" "}
                          {currencyTRY(
                            factorFromDims(toNumber(draftW), toNumber(draftH), toNumber(draftD)) *
                              ((settings.materialPrices || {})[draftMaterial] || 0)
                          )}
                        </div>
                      </div>
                    </Card>
                  </>
                )}

                {draftType === "kapi" && (
                  <>
                    <Field label="Adet">
                      <Input value={draftDoorQty} onChange={setDraftDoorQty} placeholder="0" />
                    </Field>
                    <Card>
                      <div style={{ padding: 12 }}>
                        <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 900 }}>Önizleme</div>
                        <div style={{ marginTop: 6, fontWeight: 950 }}>
                          Tutar: {currencyTRY(Math.floor(toNumber(draftDoorQty)) * (settings.doorPrice || 12000))}
                        </div>
                      </div>
                    </Card>
                  </>
                )}

                {draftType === "supurgelik" && (
                  <>
                    <Field label="Metre (m)">
                      <Input value={draftSkirtM} onChange={setDraftSkirtM} placeholder="0" />
                    </Field>
                    <Card>
                      <div style={{ padding: 12 }}>
                        <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 900 }}>Önizleme</div>
                        <div style={{ marginTop: 6, fontWeight: 950 }}>
                          Tutar: {currencyTRY(toNumber(draftSkirtM) * (settings.skirtingPricePerMeter || 350))}
                        </div>
                      </div>
                    </Card>
                  </>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 2 }}>
                  <Btn variant="ghost" onClick={() => setAddOpen(false)}>
                    İptal
                  </Btn>
                  <Btn variant="primary" onClick={saveNewItem}>
                    Kaydet
                  </Btn>
                </div>
              </div>
            </Modal>
          </div>
        )}

        {tab === "aksesuarlar" && (
          <div style={{ display: "grid", gap: 12 }}>
            <Card>
              <div style={{ padding: 14 }}>
                <div style={{ fontWeight: 950, color: "#111827" }}>Aksesuarlar</div>
                <div style={{ marginTop: 6, color: "#6B7280", fontWeight: 700, fontSize: 13 }}>
                  Adet gir. (Birim fiyatlar teklifte ayrı gösterilmeyecek.)
                </div>
              </div>
            </Card>

            {accessoryRows.map((a) => {
              const qty =
                (project.accessories || []).find((x) => x.accessoryId === a.id)?.quantity || 0;
              return (
                <Card key={a.id}>
                  <div style={{ padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 950, color: "#111827" }}>{a.name}</div>
                      <div style={{ marginTop: 4, fontSize: 12, color: "#6B7280", fontWeight: 800 }}>
                        {a.isActive ? "Aktif" : "Pasif"}
                      </div>
                    </div>
                    <div style={{ width: 110 }}>
                      <Input
                        value={String(qty)}
                        onChange={(v) => setAccessoryQty(a.id, Math.floor(toNumber(v)))}
                        placeholder="0"
                        right="adet"
                      />
                    </div>
                  </div>
                </Card>
              );
            })}

            <Card>
              <div style={{ padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 900 }}>Aksesuar toplamı</div>
                  <div style={{ fontSize: 20, fontWeight: 950, color: "#111827" }}>{currencyTRY(totalAcc)}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn variant="ghost" onClick={() => setTab("kalemler")}>
                    ← Kalemler
                  </Btn>
                  <Btn variant="primary" onClick={() => setTab("teklif")}>
                    Teklif →
                  </Btn>
                </div>
              </div>
            </Card>
          </div>
        )}

        {tab === "teklif" && (
          <div style={{ display: "grid", gap: 12 }}>
            <Card>
              <div style={{ padding: 14 }}>
                <div style={{ fontWeight: 950, color: "#111827" }}>Teklif Özeti</div>

                <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, color: "#374151" }}>
                    <span>Kalemler</span>
                    <span>{currencyTRY(totalItems)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, color: "#374151" }}>
                    <span>Aksesuarlar</span>
                    <span>{currencyTRY(totalAcc)}</span>
                  </div>
                  <div style={{ height: 1, background: "#E5E7EB", margin: "6px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 950, color: "#111827", fontSize: 18 }}>
                    <span>Genel Toplam</span>
                    <span>{currencyTRY(totalAll)}</span>
                  </div>
                </div>

                <div style={{ marginTop: 12, fontSize: 12, color: "#6B7280", fontWeight: 800, lineHeight: 1.5 }}>
                  • KDV dahil değildir.<br />
                  • Montaj dahildir.<br />
                  • Kapılar standart seri üzerinden hesaplanmıştır, kapı kolu hariçtir.
                </div>
              </div>
            </Card>

            <Card>
              <div style={{ padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 900 }}>Sonraki adım</div>
                  <div style={{ fontWeight: 950, color: "#111827" }}>3 sayfa A4 teklif taslağı</div>
                  <div style={{ marginTop: 4, fontSize: 13, color: "#6B7280", fontWeight: 700 }}>
                    Onu birazdan ekleyeceğiz (Kalemler / Aksesuarlar / Ödeme Planı).
                  </div>
                </div>
                <Btn variant="ghost" onClick={() => setTab("kalemler")}>
                  ← Geri
                </Btn>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
