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
  // Fichas na lixeira (excluido_em preenchido) ficam fora da lista normal.
  let query = sb
    .from("fichas")
    .select("*")
    .is("excluido_em", null)
    .order("criado_em", { ascending: false });
  if (!allUsers) query = query.eq("owner_id", ownerId);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/** Só as fichas que estão na lixeira, da mais recente para a mais antiga. */
export async function fetchFichasExcluidas({ ownerId, allUsers }) {
  let query = sb
    .from("fichas")
    .select("*")
    .not("excluido_em", "is", null)
    .order("excluido_em", { ascending: false });
  if (!allUsers) query = query.eq("owner_id", ownerId);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function saveFicha(record, ownerId, actingUser) {
  const histEntry = { ts: nowStr(), user: actingUser, action: record.id ? "Editada" : "Criada" };
  const payload = sanitizeForDb({ ...record, historico: [...(record.historico || []), histEntry] });
  delete payload._owner_username;

  // Estas duas colunas têm dono próprio: `recibos` só é escrita ao emitir um
  // recibo e `excluido_em` só pela lixeira. Se o formulário as enviasse, um
  // rascunho antigo restaurado apagaria um recibo registrado depois — ou
  // traria de volta uma ficha que já tinha sido removida.
  delete payload.recibos;
  delete payload.excluido_em;

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

/** Manda a ficha para a lixeira. Nada é apagado: dá para restaurar depois. */
export async function moveFichaToTrash(record, actingUser) {
  const histEntry = { ts: nowStr(), user: actingUser, action: "Movida para a lixeira" };
  const payload = {
    excluido_em: new Date().toISOString(),
    historico: [...(record.historico || []), histEntry],
  };
  const { error } = await sb.from("fichas").update(payload).eq("id", record.id);
  if (error) throw error;
}

/** Tira a ficha da lixeira e devolve para a lista ativa. */
export async function restoreFicha(record, actingUser) {
  const histEntry = { ts: nowStr(), user: actingUser, action: "Restaurada da lixeira" };
  const payload = {
    excluido_em: null,
    historico: [...(record.historico || []), histEntry],
  };
  const { error } = await sb.from("fichas").update(payload).eq("id", record.id);
  if (error) throw error;
}

/** Apaga de verdade, sem volta. Só é oferecido de dentro da lixeira. */
export async function deleteFicha(id) {
  const { error } = await sb.from("fichas").delete().eq("id", id);
  if (error) throw error;
}

/** Guarda na ficha o registro de um recibo emitido. */
export async function registrarRecibo(record, recibo) {
  const lista = [...(record.recibos || []), recibo];
  const { error } = await sb.from("fichas").update({ recibos: lista }).eq("id", record.id);
  if (error) throw error;
  return lista;
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
    // A cópia nasce fora da lixeira e sem herdar os recibos já emitidos da original.
    excluido_em: null,
    recibos: [],
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
