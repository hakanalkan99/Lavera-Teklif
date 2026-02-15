import { supabase } from "./supabaseClient";

export async function loadCloudState() {
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes?.user;
  if (!user) throw new Error("No user");

  const { data, error } = await supabase
    .from("app_state")
    .select("state")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  return data?.state || null;
}

export async function saveCloudState(state) {
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes?.user;
  if (!user) throw new Error("No user");

  const payload = {
    user_id: user.id,
    state,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("app_state").upsert(payload, {
    onConflict: "user_id",
  });

  if (error) throw error;
}