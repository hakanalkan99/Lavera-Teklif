import { supabase } from "./supabaseClient";

export async function loadProjectsFromCloud() {
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes?.user;
  if (!user) throw new Error("not_logged_in");

  const { data, error } = await supabase
    .from("projects_store")
    .select("data")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;

  // hiç kayıt yoksa boş döneriz
  return data?.data?.projects ?? null;
}

export async function saveProjectsToCloud(projects) {
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes?.user;
  if (!user) throw new Error("not_logged_in");

  const payload = { user_id: user.id, data: { projects }, updated_at: new Date().toISOString() };

  const { error } = await supabase
    .from("projects_store")
    .upsert(payload, { onConflict: "user_id" });

  if (error) throw error;
}