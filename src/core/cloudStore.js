import { supabase } from "./supabaseClient";

export async function loadCloudState() {
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes?.user;
  if (!user) throw new Error("No user");

  // Kullanıcının üye olduğu workspace'i bul
  const { data: memberRow, error: memberError } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .single();

  if (memberError) throw memberError;

  const workspaceId = memberRow.workspace_id;

  // Workspace'e ait state'i getir
  const { data, error } = await supabase
    .from("app_state")
    .select("state")
    .eq("workspace_id", workspaceId)
    .single();

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
    onConflict: "workspace_id",
  });

  if (error) throw error;
}