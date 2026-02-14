import React, { useState } from "react";
import type { PersistedState } from "../core/types";

type Tab = "kalemler" | "aksesuarlar" | "teklif";
type PlanType = "Duz" | "L" | "U";
type UstMod = "IkiKat" | "Full" | "Yok";
type Material = "MDFLAM" | "HGloss" | "LakPanel" | "Lake";

export default function ProjectScreen({
  projectId,
  state,
  setState,
  onBack,
}: {
  projectId: string;
  state: PersistedState;
  setState: React.Dispatch<React.SetStateAction<PersistedState>>;
  onBack: () => void;
}) {
  const project = state.projects.find((p) => p.id === projectId);
  const [tab, setTab] = useState<Tab>("kalemler");

  const [modalOpen, setModalOpen] = useState(false);

  // MUTFAK STATE
  const [material, setMaterial] = useState<Material>("Lake");
  const [planType, setPlanType] = useState<PlanType>("Duz");
  const [duvar1, setDuvar1] = useState("");
  const [duvar2, setDuvar2] = useState("");
  const [duvar3, setDuvar3] = useState("");
  const [boyDolapVar, setBoyDolapVar] = useState(true);
  const [boyDolapEn, setBoyDolapEn] = useState("");
  const [tavan, setTavan] = useState("260");
  const [ustMod, setUstMod] = useState<UstMod>("IkiKat");
  const [adaVar, setAdaVar] = useState(false);
  const [adaEn, setAdaEn] = useState("");

  if (!project) {
    return (
      <div style={{ padding: 16 }}>
        <h2>Proje bulunamadı</h2>
        <button onClick={onBack}>← Geri</button>
      </div>
    );
  }

  function hesaplaMutfak() {
    const d1 = Number(duvar1) || 0;
    const d2 = Number(duvar2) || 0;
    const d3 = Number(duvar3) || 0;
    const boyEn = Number(boyDolapEn) || 0;
    const tavanH = Number(tavan) || 260;
    const adaUz = Number(adaEn) || 0;

    let toplamDuvar = 0;

    if (planType === "Duz") toplamDuvar = d1;
    if (planType === "L") toplamDuvar = d1 + d2 - 60;
    if (planType === "U") toplamDuvar = d1 + d2 + d3 - 120;

    if (boyDolapVar) toplamDuvar -= boyEn;

    const altMetraj = (toplamDuvar / 100) * 1 * (1 + 0.6);

    const boyMetraj = boyDolapVar
      ? (boyEn / 100) * (tavanH / 100) * (1 + 0.6)
      : 0;

    let ustMetraj = 0;

    if (ustMod !== "Yok") {
      const ustDuvar = toplamDuvar;
      const yukseklik = tavanH - 150;

      if (ustMod === "Full") {
        ustMetraj =
          (ustDuvar / 100) * (yukseklik / 100) * (1 + 0.35);
      }

      if (ustMod === "IkiKat") {
        const ust35 = (yukseklik * 0.6) / 100;
        const ust60 = (yukseklik * 0.4) / 100;

        ustMetraj =
          (ustDuvar / 100) * ust35 * (1 + 0.35) +
          (ustDuvar / 100) * ust60 * (1 + 0.6);
      }
    }

    const adaMetraj = adaVar
      ? (adaUz / 100) * 1 * (1 + 0.6)
      : 0;

    const toplamMetraj =
      altMetraj + boyMetraj + ustMetraj + adaMetraj;

    const birim = state.settings.materialPrices[material];
    const fiyat = toplamMetraj * birim;

    return fiyat;
  }

  function kaydetMutfak() {
    const fiyat = hesaplaMutfak();

    const newItem = {
      id: crypto.randomUUID(),
      name: "Mutfak",
      type: "sade",
      material,
      price: fiyat,
    };

    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === projectId
          ? { ...p, items: [...p.items, newItem] }
          : p
      ),
    }));

    setModalOpen(false);
  }

  const toplam = project.items.reduce((sum, i) => sum + i.price, 0);

  return (
    <div style={{ padding: 16 }}>
      <h2>{project.name}</h2>
      <p>
        Kod: {project.projectNumber}
        {project.currentVersion}
      </p>

      <button onClick={onBack}>← Projeler</button>

      <div style={{ marginTop: 20 }}>
        <button onClick={() => setTab("kalemler")}>Kalemler</button>
      </div>

      {tab === "kalemler" && (
        <div style={{ marginTop: 20 }}>
          <button onClick={() => setModalOpen(true)}>+ Mutfak Ekle</button>

          {project.items.map((item) => (
            <div key={item.id} style={{ border: "1px solid #ccc", padding: 10, marginTop: 10 }}>
              <b>{item.name}</b>
              <p>Malzeme: {item.material}</p>
              <p>{item.price.toFixed(0)} ₺</p>
            </div>
          ))}

          <h3>Toplam: {toplam.toFixed(0)} ₺</h3>
        </div>
      )}

      {modalOpen && (
        <div style={{ background: "#00000088", position: "fixed", inset: 0 }}>
          <div style={{ background: "white", padding: 20, maxWidth: 500, margin: "60px auto" }}>
            <h3>Mutfak Hesaplama</h3>

            <select value={material} onChange={(e) => setMaterial(e.target.value as Material)}>
              <option value="MDFLAM">MDFLAM</option>
              <option value="HGloss">High Gloss</option>
              <option value="LakPanel">Lak Panel</option>
              <option value="Lake">Lake</option>
            </select>

            <select value={planType} onChange={(e) => setPlanType(e.target.value as PlanType)}>
              <option value="Duz">Düz</option>
              <option value="L">L</option>
              <option value="U">U</option>
            </select>

            <input placeholder="Duvar 1 (cm)" value={duvar1} onChange={(e) => setDuvar1(e.target.value)} />
            {planType !== "Duz" && (
              <input placeholder="Duvar 2 (cm)" value={duvar2} onChange={(e) => setDuvar2(e.target.value)} />
            )}
            {planType === "U" && (
              <input placeholder="Duvar 3 (cm)" value={duvar3} onChange={(e) => setDuvar3(e.target.value)} />
            )}

            <div>
              <label>
                <input type="checkbox" checked={boyDolapVar} onChange={(e) => setBoyDolapVar(e.target.checked)} />
                Boy Dolap Var
              </label>
            </div>

            {boyDolapVar && (
              <input placeholder="Boy Dolap Toplam En (cm)" value={boyDolapEn} onChange={(e) => setBoyDolapEn(e.target.value)} />
            )}

            <input placeholder="Tavan Yüksekliği (cm)" value={tavan} onChange={(e) => setTavan(e.target.value)} />

            <select value={ustMod} onChange={(e) => setUstMod(e.target.value as UstMod)}>
              <option value="IkiKat">İki Kat</option>
              <option value="Full">Full</option>
              <option value="Yok">Yok</option>
            </select>

            <div>
              <label>
                <input type="checkbox" checked={adaVar} onChange={(e) => setAdaVar(e.target.checked)} />
                Ada Var
              </label>
            </div>

            {adaVar && (
              <input placeholder="Ada Uzunluğu (cm)" value={adaEn} onChange={(e) => setAdaEn(e.target.value)} />
            )}

            <h4>Önizleme: {hesaplaMutfak().toFixed(0)} ₺</h4>

            <button onClick={kaydetMutfak}>Kaydet</button>
            <button onClick={() => setModalOpen(false)}>İptal</button>
          </div>
        </div>
      )}
    </div>
  );
}