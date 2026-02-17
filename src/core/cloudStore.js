import { supabase } from "./supabaseClient";

const WORKSPACE_ID = "827c69bc-7d14-451a-9749-0111e0d4e8c7";

export async function loadCloudState() {
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes?.user;
  if (!user) throw new Error("No user");

  // ✅ workspace member mı kontrol (opsiyonel ama iyi)
  const { data: member, error: memErr } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", WORKSPACE_ID)
    .eq("user_id", user.id)
    .maybeSingle();

  if (memErr) throw memErr;
  if (!member) throw new Error("Not a workspace member");

  const { data, error } = await supabase
    .from("app_state")
    .select("state")
    .eq("workspace_id", WORKSPACE_ID)
    .maybeSingle();

  if (error) throw error;
  return data?.state || null;
}

export async function saveCloudState(state) {
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes?.user;
  if (!user) throw new Error("No user");

  const payload = {
    workspace_id: WORKSPACE_ID,
    user_id: user.id, // kalsın (son yazan user gibi düşün)
    state,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("app_state").upsert(payload, {
    onConflict: "workspace_id", // ✅ ÖNEMLİ: user_id değil
  });

  if (error) throw error;
}