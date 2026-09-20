import { supabase as sb } from "./supabaseClient";
import { sanitizeForDb } from "./config/sections";
import { nowStr } from "./utils/masks";

// ---------------- AUTH ----------------

export async function signUp(email, password, username) {
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { data: { username: username.trim() } },
  });
  if (error) throw error;
  const userId = data.user?.id;
  if (!userId) throw new Error("Não foi possível criar o usuário.");
  return { userId };
}

export async function signIn(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function requestPasswordReset(email) {
  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
  if (error) throw error;
}

export async function resendConfirmation(email) {
  const { error } = await sb.auth.resend({ type: "signup", email, options: { emailRedirectTo: window.location.origin } });
  if (error) throw error;
}

export async function verifySignupCode(email, token) {
  const { data, error } = await sb.auth.verifyOtp({ email, token, type: "signup" });
  if (error) throw error;
  return data;
}

export async function updatePassword(newPassword) {
  const { error } = await sb.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function signOut() {
  await sb.auth.signOut();
}

export async function getSession() {
  const { data } = await sb.auth.getSession();
  return data.session;
}

export async function getMyProfile(userId) {
  const { data, error } = await sb.from("profiles").select("*").eq("id", userId).single();
  if (error) return null;
  return data;
}

export async function getAllProfiles() {
  const { data, error } = await sb.from("profiles").select("*").order("username");
  if (error) throw error;
  return data;
}

export async function updateProfile(userId, changes) {
  const { error } = await sb.from("profiles").update(changes).eq("id", userId);
  if (error) throw error;
}

export async function acceptTerms(userId) {
  await updateProfile(userId, { terms_accepted_at: new Date().toISOString() });
}

// ---------------- FICHAS ----------------

export async function fetchFichas({ ownerId, allUsers }) {
  let query = sb.from("fichas").select("*").order("criado_em", { ascending: false });
  if (!allUsers) query = query.eq("owner_id", ownerId);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function saveFicha(record, ownerId, actingUser) {
  const histEntry = { ts: nowStr(), user: actingUser, action: record.id ? "Editada" : "Criada" };
  const payload = sanitizeForDb({ ...record, historico: [...(record.historico || []), histEntry] });
  delete payload._owner_username;

  if (record.id) {
    const { error } = await sb.from("fichas").update(payload).eq("id", record.id);
    if (error) throw error;
    return payload;
  } else {
    const { id, ...rest } = payload;
    const { data, error } = await sb.from("fichas").insert({ ...rest, owner_id: ownerId }).select().single();
    if (error) throw error;
    return data;
  }
}

export async function deleteFicha(id) {
  const { error } = await sb.from("fichas").delete().eq("id", id);
  if (error) throw error;
}

export async function archiveFicha(record, actingUser, archived) {
  const histEntry = { ts: nowStr(), user: actingUser, action: archived ? "Arquivada" : "Desarquivada" };
  const payload = { arquivado: archived, historico: [...(record.historico || []), histEntry] };
  const { error } = await sb.from("fichas").update(payload).eq("id", record.id);
  if (error) throw error;
}

export async function duplicateFicha(record, actingUser) {
  const { id, criado_em, ...rest } = record;
  const payload = sanitizeForDb({
    ...rest,
    nome: `${record.nome} (cópia)`,
    arquivado: false,
    historico: [{ ts: nowStr(), user: actingUser, action: `Duplicada a partir da ficha de "${record.nome}"` }],
  });
  const { data, error } = await sb.from("fichas").insert(payload).select().single();
  if (error) throw error;
  return data;
}

// ---------------- ANEXOS (Supabase Storage) ----------------

const BUCKET = "anexos";

export async function uploadAttachment(userId, fileOrBlob, filename) {
  const path = `${userId}/${Date.now()}_${filename}`;
  const { error } = await sb.storage.from(BUCKET).upload(path, fileOrBlob, { upsert: false });
  if (error) throw error;
  return { path, name: filename };
}

export async function getSignedUrl(path, expiresIn = 3600) {
  const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

export async function removeAttachment(path) {
  await sb.storage.from(BUCKET).remove([path]);
}

// ---------------- DESPESAS ----------------

export async function fetchDespesas({ ownerId, allUsers }) {
  let query = sb.from("despesas").select("*").order("data", { ascending: false });
  if (!allUsers) query = query.eq("owner_id", ownerId);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function saveDespesa(record, ownerId) {
  const payload = {
    descricao: record.descricao,
    valor: Number(record.valor) || 0,
    categoria: record.categoria || "outros",
    data: record.data || new Date().toISOString().slice(0, 10),
    owner_id: ownerId,
  };
  const { data, error } = await sb.from("despesas").insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function deleteDespesa(id) {
  const { error } = await sb.from("despesas").delete().eq("id", id);
  if (error) throw error;
}
