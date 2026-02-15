import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url) console.error("VITE_SUPABASE_URL eksik (.env)");
if (!anon) console.error("VITE_SUPABASE_ANON_KEY eksik (.env)");

export const supabase = createClient(url, anon);