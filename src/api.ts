import type { Session, User } from "@supabase/supabase-js";
import { supabase as sb } from "./supabaseClient";
import { sanitizeForDb } from "./config/sections";
import { nowStr } from "./utils/masks";
import type { Database, DespesaRow, FichaRow, Json, ProfileRow } from "./types/database";
import type { Anexo, Ficha, FichaSalva, HistoricoItem, Pagamento, Recibo } from "./types/ficha";

type FichaInsert = Database["public"]["Tables"]["fichas"]["Insert"];
type FichaUpdate = Database["public"]["Tables"]["fichas"]["Update"];
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

/** Filtro usado nas listagens: de um dono só, ou de todos (visão do administrador). */
export interface FiltroDono {
  ownerId?: string;
  allUsers: boolean;
}

// ---------------- AUTH ----------------

export async function signUp(email: string, password: string, username: string): Promise<{ userId: string }> {
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

export async function signIn(email: string, password: string): Promise<{ user: User; session: Session }> {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
  if (error) throw error;
}

export async function resendConfirmation(email: string): Promise<void> {
  const { error } = await sb.auth.resend({ type: "signup", email, options: { emailRedirectTo: window.location.origin } });
  if (error) throw error;
}

export async function verifySignupCode(email: string, token: string) {
  const { data, error } = await sb.auth.verifyOtp({ email, token, type: "signup" });
  if (error) throw error;
  return data;
}

export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await sb.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  await sb.auth.signOut();
}

export async function getSession(): Promise<Session | null> {
  const { data } = await sb.auth.getSession();
  return data.session;
}

export async function getMyProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await sb.from("profiles").select("*").eq("id", userId).single();
  if (error) return null;
  return data;
}

export async function getAllProfiles(): Promise<ProfileRow[]> {
  const { data, error } = await sb.from("profiles").select("*").order("username");
  if (error) throw error;
  return data;
}

export async function updateProfile(userId: string, changes: ProfileUpdate): Promise<void> {
  const { error } = await sb.from("profiles").update(changes).eq("id", userId);
  if (error) throw error;
}

export async function acceptTerms(userId: string): Promise<void> {
  await updateProfile(userId, { terms_accepted_at: new Date().toISOString() });
}

// ---------------- FICHAS ----------------

/**
 * As colunas fotos, documentos, historico, pagamentos e recibos são JSON no
 * banco. Aqui se afirma o formato que o próprio app grava nelas (veja
 * saveFicha); quando vierem nulas ou fora de formato, viram lista vazia.
 */
function lista<T>(valor: Json | null | undefined): T[] {
  return Array.isArray(valor) ? (valor as unknown as T[]) : [];
}

function paraFicha(row: FichaRow): FichaSalva {
  return {
    ...row,
    fotos: lista<Anexo>(row.fotos),
    documentos: lista<Anexo>(row.documentos),
    historico: lista<HistoricoItem>(row.historico),
    pagamentos: lista<Pagamento>(row.pagamentos),
    recibos: lista<Recibo>(row.recibos),
  };
}

export async function fetchFichas({ ownerId, allUsers }: FiltroDono): Promise<FichaSalva[]> {
  // Fichas na lixeira (excluido_em preenchido) ficam fora da lista normal.
  let query = sb
    .from("fichas")
    .select("*")
    .is("excluido_em", null)
    .order("criado_em", { ascending: false });
  if (!allUsers) {
    // Sem saber de quem são as fichas, não lista nada (em vez de listar as de todos).
    if (!ownerId) return [];
    query = query.eq("owner_id", ownerId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(paraFicha);
}

/** Só as fichas que estão na lixeira, da mais recente para a mais antiga. */
export async function fetchFichasExcluidas({ ownerId, allUsers }: FiltroDono): Promise<FichaSalva[]> {
  let query = sb
    .from("fichas")
    .select("*")
    .not("excluido_em", "is", null)
    .order("excluido_em", { ascending: false });
  if (!allUsers) {
    // Sem saber de quem são as fichas, não lista nada (em vez de listar as de todos).
    if (!ownerId) return [];
    query = query.eq("owner_id", ownerId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(paraFicha);
}

export async function saveFicha(record: Ficha, ownerId: string | undefined, actingUser: string): Promise<void> {
  const histEntry: HistoricoItem = { ts: nowStr(), user: actingUser, action: record.id ? "Editada" : "Criada" };
  const payload = sanitizeForDb({ ...record, historico: [...(record.historico || []), histEntry] });
  delete payload._owner_username;

  // Estas duas colunas têm dono próprio: `recibos` só é escrita ao emitir um
  // recibo e `excluido_em` só pela lixeira. Se o formulário as enviasse, um
  // rascunho antigo restaurado apagaria um recibo registrado depois — ou
  // traria de volta uma ficha que já tinha sido removida.
  delete payload.recibos;
  delete payload.excluido_em;

  if (record.id) {
    const { error } = await sb.from("fichas").update(payload as FichaUpdate).eq("id", record.id);
    if (error) throw error;
  } else {
    const { id: _semId, ...rest } = payload;
    const { error } = await sb
      .from("fichas")
      .insert({ ...rest, owner_id: ownerId } as FichaInsert)
      .select()
      .single();
    if (error) throw error;
  }
}

/** Manda a ficha para a lixeira. Nada é apagado: dá para restaurar depois. */
export async function moveFichaToTrash(record: FichaSalva, actingUser: string): Promise<void> {
  const histEntry: HistoricoItem = { ts: nowStr(), user: actingUser, action: "Movida para a lixeira" };
  const payload = {
    excluido_em: new Date().toISOString(),
    historico: [...(record.historico || []), histEntry] as unknown as Json,
  };
  const { error } = await sb.from("fichas").update(payload).eq("id", record.id);
  if (error) throw error;
}

/** Tira a ficha da lixeira e devolve para a lista ativa. */
export async function restoreFicha(record: FichaSalva, actingUser: string): Promise<void> {
  const histEntry: HistoricoItem = { ts: nowStr(), user: actingUser, action: "Restaurada da lixeira" };
  const payload = {
    excluido_em: null,
    historico: [...(record.historico || []), histEntry] as unknown as Json,
  };
  const { error } = await sb.from("fichas").update(payload).eq("id", record.id);
  if (error) throw error;
}

/** Apaga de verdade, sem volta. Só é oferecido de dentro da lixeira. */
export async function deleteFicha(id: string): Promise<void> {
  const { error } = await sb.from("fichas").delete().eq("id", id);
  if (error) throw error;
}

/** Guarda na ficha o registro de um recibo emitido. */
export async function registrarRecibo(record: FichaSalva, recibo: Recibo): Promise<Recibo[]> {
  const novaLista = [...(record.recibos || []), recibo];
  const { error } = await sb.from("fichas").update({ recibos: novaLista as unknown as Json }).eq("id", record.id);
  if (error) throw error;
  return novaLista;
}

export async function archiveFicha(record: FichaSalva, actingUser: string, archived: boolean): Promise<void> {
  const histEntry: HistoricoItem = { ts: nowStr(), user: actingUser, action: archived ? "Arquivada" : "Desarquivada" };
  const payload = { arquivado: archived, historico: [...(record.historico || []), histEntry] as unknown as Json };
  const { error } = await sb.from("fichas").update(payload).eq("id", record.id);
  if (error) throw error;
}

export async function duplicateFicha(record: FichaSalva, actingUser: string): Promise<FichaSalva> {
  const { id: _id, criado_em: _criadoEm, ...rest } = record;
  const payload = sanitizeForDb({
    ...rest,
    nome: `${record.nome} (cópia)`,
    arquivado: false,
    // A cópia nasce fora da lixeira e sem herdar os recibos já emitidos da original.
    excluido_em: null,
    recibos: [],
    historico: [{ ts: nowStr(), user: actingUser, action: `Duplicada a partir da ficha de "${record.nome}"` }],
  });
  const { data, error } = await sb.from("fichas").insert(payload as FichaInsert).select().single();
  if (error) throw error;
  return paraFicha(data);
}

// ---------------- ANEXOS (Supabase Storage) ----------------

const BUCKET = "anexos";

export async function uploadAttachment(
  userId: string,
  fileOrBlob: Blob,
  filename: string
): Promise<{ path: string; name: string }> {
  const path = `${userId}/${Date.now()}_${filename}`;
  const { error } = await sb.storage.from(BUCKET).upload(path, fileOrBlob, { upsert: false });
  if (error) throw error;
  return { path, name: filename };
}

export async function getSignedUrl(path: string, expiresIn = 3600): Promise<string> {
  const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

export async function removeAttachment(path: string): Promise<void> {
  await sb.storage.from(BUCKET).remove([path]);
}

// ---------------- DESPESAS ----------------

export async function fetchDespesas({ ownerId, allUsers }: FiltroDono): Promise<DespesaRow[]> {
  let query = sb.from("despesas").select("*").order("data", { ascending: false });
  if (!allUsers) {
    if (!ownerId) return [];
    query = query.eq("owner_id", ownerId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export interface NovaDespesa {
  descricao: string;
  valor: number | string;
  categoria?: string;
  data?: string;
}

export async function saveDespesa(record: NovaDespesa, ownerId: string | undefined): Promise<DespesaRow> {
  if (!ownerId) throw new Error("Não foi possível identificar o usuário.");
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

export async function deleteDespesa(id: number): Promise<void> {
  const { error } = await sb.from("despesas").delete().eq("id", id);
  if (error) throw error;
}
