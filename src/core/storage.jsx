const STORAGE_KEY = "mobilya_teklif_v1";

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        projects: [],
        settings: {
          materialPrices: {
            mdfLam: 100,
            highGloss: 120,
            lakPanel: 150,
            lake: 200,
          },
          accessories: [],
          nextProjectNumber: 2620,
          doorPrice: 12000,
          skirtingPricePerMeter: 300,
          puffExtraPrice: 2500,
          companyInfo: {},
        },
      };
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error("Load error:", e);
    return {
      projects: [],
      settings: {
        materialPrices: {
          mdfLam: 100,
          highGloss: 120,
          lakPanel: 150,
          lake: 200,
        },
        accessories: [],
        nextProjectNumber: 2620,
        doorPrice: 12000,
        skirtingPricePerMeter: 300,
        puffExtraPrice: 2500,
        companyInfo: {},
      },
    };
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}