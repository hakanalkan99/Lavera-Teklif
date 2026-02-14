import { supabase } from "./supabaseClient";

const TABLE = "app_state";
const ID = "main";

// DB’de hiç kayıt yoksa bunu döndür
export function defaultState() {
  return {
    projects: [],
    settings: {
      materialPrices: { MDFLAM: 100, HGloss: 120, LakPanel: 150, Lake: 200 },
      doorPrice: 12000,
      skirtingPricePerMeter: 300,

      // katsayılar (istediğin gibi ayarlardan değiştireceğiz)
      coeffs: {
        hilton: 1.0,
        tvunit: 1.0,
        separator: 1.0,
      },

      accessories: [
        { id: "sis", name: "Şişelik", unitPrice: 3500, isActive: true },
        { id: "doner", name: "Döner mekanizma", unitPrice: 4500, isActive: true },
      ],

      nextProjectNumber: 2620,
      companyInfo: {
        name: "",
        address: "",
        phone: "",
        email: "",
        instagram: "",
        logoDataUrl: "",
      },
    },
  };
}

export async function cloudLoadState() {
  // row var mı?
  const { data, error } = await supabase
    .from(TABLE)
    .select("state")
    .eq("id", ID)
    .maybeSingle();

  if (error) throw error;

  if (!data || !data.state || Object.keys(data.state).length === 0) {
    const initial = defaultState();
    // yoksa oluştur
    const { error: insErr } = await supabase.from(TABLE).insert({ id: ID, state: initial });
    if (insErr) throw insErr;
    return initial;
  }

  return data.state;
}

export async function cloudSaveState(nextState) {
  const { error } = await supabase
    .from(TABLE)
    .upsert({ id: ID, state: nextState, updated_at: new Date().toISOString() });

  if (error) throw error;
}