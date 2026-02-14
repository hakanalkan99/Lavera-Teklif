import type { PersistedState } from "./types";

const STORAGE_KEY = "mobilya_teklif_v1";

export function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        projects: [],
        settings: {
          materialPrices: {
            MDFLAM: 8000,
            HGloss: 9500,
            LakPanel: 11000,
            Lake: 13500,
          },
          doorPrice: 12000,
          skirtingPricePerMeter: 350,
          puffExtraPrice: 2500,
          accessories: [],
          companyInfo: {},
          nextProjectNumber: 2620,
        },
      };
    }
    return JSON.parse(raw);
  } catch {
    return {
      projects: [],
      settings: {
        materialPrices: {
          MDFLAM: 8000,
          HGloss: 9500,
          LakPanel: 11000,
          Lake: 13500,
        },
        doorPrice: 12000,
        skirtingPricePerMeter: 350,
        puffExtraPrice: 2500,
        accessories: [],
        companyInfo: {},
        nextProjectNumber: 2620,
      },
    };
  }
}

export function saveState(state: PersistedState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}