import { useState, useEffect, useCallback } from "react";
import type { Session } from "@supabase/supabase-js";
import * as api from "./api";
import { supabase } from "./supabaseClient";
import { emptyRecord, THEME } from "./config/sections";
import { isValidCpfCnpj } from "./utils/validation";
import Login from "./components/Login";
import ResetPassword from "./components/ResetPassword";
import TermsGate from "./components/TermsGate";
import AppShell from "./components/AppShell";
import FichaList from "./components/FichaList";
import FichaForm from "./components/FichaForm";
import FinanceiroView from "./components/FinanceiroView";
import UsersAdmin from "./components/UsersAdmin";
import ReciboModal from "./components/ReciboModal";
import Toast from "./components/Toast";
import DraftModal from "./components/DraftModal";
import ConfirmModal from "./components/ConfirmModal";
import type { ProfileRow } from "./types/database";
import type { Ficha, FichaSalva } from "./types/ficha";
import type { TipoToast, Vista } from "./types/ui";

const DRAFT_KEY_PREFIX = "vp_draft_";

/**
 * Apaga todos os rascunhos guardados no navegador.
 *
 * Varre por prefixo em vez de apagar uma chave só: um administrador que navega
 * entre usuários gera um rascunho por contexto, e nenhum deles pode sobreviver
 * ao logout, porque contêm dados pessoais de clientes.
 */
function limparTodosOsRascunhos() {
  try {
    const chaves = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(DRAFT_KEY_PREFIX)) chaves.push(k);
    }
    chaves.forEach((k) => localStorage.removeItem(k));
  } catch (e) {
    // Navegador sem acesso ao armazenamento: nada a limpar.
  }
}

export default function App() {
  const [booted, setBooted] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [recoveryMode, setRecoveryMode] = useState(false);

  const [fichas, setFichas] = useState<FichaSalva[]>([]);
  const [view, setView] = useState<Vista>("list");
  const [editing, setEditing] = useState<Ficha | null>(null);
  const [reciboRecord, setReciboRecord] = useState<FichaSalva | null>(null);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [adminViewUser, setAdminViewUser] = useState<string | null>(null);
  const [pendingDraft, setPendingDraft] = useState<Ficha | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<FichaSalva | null>(null);
  const [confirmPurge, setConfirmPurge] = useState<FichaSalva | null>(null);
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState<TipoToast>("default");
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const showToast = (msg: string, type: TipoToast = "default") => { setToast(msg); setToastType(type); setTimeout(() => setToast(""), 2500); };

  // ---------- boot: check existing session ----------
  useEffect(() => {
    (async () => {
      const s = await api.getSession();
      if (s) {
        let p = null;
        try {
          p = await api.getMyProfile(s.user.id);
        } catch (e) {
          p = null;
        }
        // Mesma regra do login: conta desativada, ou perfil que não pôde ser
        // lido, não restauram sessão. Antes, perfil nulo passava e o app abria
        // sem saber quem era o usuário.
        if (!p || p.is_active === false) {
          await api.signOut();
          setSession(null);
          setProfile(null);
        } else {
          setSession(s);
          setProfile(p);
        }
      }
      setBooted(true);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, s) => {
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryMode(true);
        setSession(s);
        return;
      }
      // Importante: aqui NÃO se trata o SIGNED_IN. Cada caminho de entrada
      // (login, cadastro e verificação de código) define a sessão por conta
      // própria, depois de checar se a conta está ativa. Se este ouvinte também
      // definisse, uma conta desativada entraria pela porta de trás: o Supabase
      // autentica, o evento monta a sessão, e a checagem que vem depois já não
      // teria como desfazer.
      if (event === "SIGNED_OUT") {
        setSession(null);
        setProfile(null);
      }
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isAdmin = !!profile?.is_admin;
  const currentUsername = profile?.username || "";
  const targetOwnerId = useCallback(() => {
    if (adminViewUser && adminViewUser !== "ALL") {
      const p = profiles.find((pr) => pr.username === adminViewUser);
      return p ? p.id : session?.user?.id;
    }
    return session?.user?.id;
  }, [adminViewUser, profiles, session]);

  // ---------- load profiles list (for admin) ----------
  useEffect(() => {
    if (!session || !isAdmin) return;
    api.getAllProfiles().then(setProfiles).catch(() => {});
  }, [session, isAdmin]);

  // ---------- load fichas ----------
  const [loadingFichas, setLoadingFichas] = useState(false);
  const reloadFichas = useCallback(async () => {
    if (!session) return;
    setLoadingFichas(true);
    try {
      const list = await api.fetchFichas({ ownerId: targetOwnerId(), allUsers: adminViewUser === "ALL" });
      setFichas(list);
    } catch (e) {
      showToast("Erro ao carregar fichas.", "error");
    } finally {
      setLoadingFichas(false);
    }
  }, [session, adminViewUser, targetOwnerId]);

  useEffect(() => { reloadFichas(); }, [reloadFichas]);

  // ---------- lixeira ----------
  // Carregada só quando o usuário abre a lixeira, pra não pesar a lista normal.
  const [fichasExcluidas, setFichasExcluidas] = useState<FichaSalva[]>([]);
  const [loadingTrash, setLoadingTrash] = useState(false);
  const reloadTrash = useCallback(async () => {
    if (!session) return;
    setLoadingTrash(true);
    try {
      const list = await api.fetchFichasExcluidas({ ownerId: targetOwnerId(), allUsers: adminViewUser === "ALL" });
      setFichasExcluidas(list);
    } catch (e) {
      showToast("Erro ao carregar a lixeira.", "error");
    } finally {
      setLoadingTrash(false);
    }
  }, [session, adminViewUser, targetOwnerId]);

  useEffect(() => { if (showTrash) reloadTrash(); }, [showTrash, reloadTrash]);

  // ---------- auth handlers ----------
  const handleSignUp = async (email: string, password: string, username: string) => {
    await api.signUp(email, password, username);
    const s = await api.getSession();
    setSession(s);
    if (s) setProfile(await api.getMyProfile(s.user.id));
  };
  const negarEntrada = async (mensagem: string): Promise<never> => {
    await api.signOut();
    setSession(null);
    setProfile(null);
    throw new Error(mensagem);
  };

  const handleSignIn = async (email: string, password: string) => {
    await api.signIn(email, password);
    const s = await api.getSession();
    const p = s ? await api.getMyProfile(s.user.id) : null;

    // Falha fechada: sem perfil legível não há como saber se a conta está ativa,
    // então nega em vez de liberar por omissão.
    if (!p) {
      return negarEntrada("Não foi possível carregar seu perfil. Tente novamente em instantes.");
    }
    if (p.is_active === false) {
      return negarEntrada("Essa conta foi desativada. Fale com o administrador.");
    }
    setSession(s);
    setProfile(p);
  };
  const handleForgotPassword = async (email: string) => {
    await api.requestPasswordReset(email);
  };
  const handleResendConfirmation = async (email: string) => {
    await api.resendConfirmation(email);
  };
  const handleVerifySignup = async (email: string, code: string) => {
    const data = await api.verifySignupCode(email, code);
    const s = (data && data.session) || (await api.getSession());
    setSession(s);
    if (s) setProfile(await api.getMyProfile(s.user.id));
  };
  const handleResetPasswordSubmit = async (newPassword: string) => {
    await api.updatePassword(newPassword);
    showToast("Senha atualizada com sucesso.", "success");
    setTimeout(async () => {
      setRecoveryMode(false);
      const s = await api.getSession();
      setSession(s);
      if (s) setProfile(await api.getMyProfile(s.user.id));
    }, 1500);
  };
  const handleLogout = async () => {
    // O rascunho automático guarda a ficha inteira (nome, CPF, telefone e e-mail
    // do cliente) no navegador. Se ficasse aqui depois do logout, a próxima
    // pessoa a usar o computador leria esses dados sem precisar de senha — o que
    // anularia o logout por inatividade em máquina compartilhada.
    limparTodosOsRascunhos();
    await api.signOut();
    setSession(null);
    setProfile(null);
    setFichas([]);
    setFichasExcluidas([]);
    setAdminViewUser(null);
  };

  // ---------- logout automático por inatividade (30 minutos) ----------
  useEffect(() => {
    if (!session) return;
    const INACTIVITY_LIMIT_MS = 30 * 60 * 1000;
    let timer: ReturnType<typeof setTimeout>;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        handleLogout();
        showToast("Sessão encerrada por inatividade.", "default");
      }, INACTIVITY_LIMIT_MS);
    };
    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((ev) => window.addEventListener(ev, resetTimer));
    resetTimer();
    return () => {
      clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // ---------- draft (localStorage, per browser) ----------
  const draftKey = () => `${DRAFT_KEY_PREFIX}${session?.user?.id}_${targetOwnerId()}`;
  const saveDraft = (record: Ficha) => {
    try { localStorage.setItem(draftKey(), JSON.stringify(record)); } catch (e) {}
  };
  const clearDraft = () => { try { localStorage.removeItem(draftKey()); } catch (e) {} };
  const checkDraft = (matchId: string | null): Ficha | null => {
    try {
      const raw = localStorage.getItem(draftKey());
      if (!raw) return null;
      const draft = JSON.parse(raw);
      return (draft.id || null) === (matchId || null) ? draft : null;
    } catch (e) { return null; }
  };

  useEffect(() => {
    if (view !== "form" || !editing) return;
    const t = setTimeout(() => saveDraft(editing), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, view]);

  // ---------- CRUD handlers ----------
  const openNew = () => {
    setEditing(emptyRecord());
    setView("form");
    const draft = checkDraft(null);
    if (draft) setPendingDraft(draft);
  };
  const openEdit = (c: FichaSalva) => {
    setEditing({ ...c });
    setView("form");
    const draft = checkDraft(c.id);
    if (draft) setPendingDraft(draft);
  };

  const saveRecord = async () => {
    if (!editing) return;
    if (!editing.nome || !editing.nome.trim()) { showToast("Informe o nome do proprietário/possuidor."); return; }
    if (!isValidCpfCnpj(editing.cpf_cnpj)) { showToast("CPF/CNPJ inválido. Confira o número digitado."); return; }
    try {
      await api.saveFicha(editing, targetOwnerId(), currentUsername);
      clearDraft();
      showToast(editing.id ? "Ficha atualizada." : "Ficha cadastrada.", "success");
      setView("list");
      setEditing(null);
      reloadFichas();
    } catch (e) {
      showToast("Erro ao salvar: " + ((e instanceof Error && e.message) || "tente novamente."), "error");
      console.error(e);
    }
  };

  const doDelete = (c: FichaSalva) => setConfirmDelete(c);
  const confirmDeleteFicha = async () => {
    const c = confirmDelete;
    if (!c) return;
    setConfirmDelete(null);
    try {
      await api.moveFichaToTrash(c, currentUsername);
      showToast("Ficha movida para a lixeira.", "success");
      reloadFichas();
      if (showTrash) reloadTrash();
    } catch (e) { showToast("Erro ao mover para a lixeira.", "error"); }
  };

  const doRestore = async (c: FichaSalva) => {
    try {
      await api.restoreFicha(c, currentUsername);
      showToast("Ficha restaurada.", "success");
      reloadTrash();
      reloadFichas();
    } catch (e) { showToast("Erro ao restaurar.", "error"); }
  };

  const doPurge = (c: FichaSalva) => setConfirmPurge(c);
  const confirmPurgeFicha = async () => {
    const c = confirmPurge;
    if (!c) return;
    setConfirmPurge(null);
    try {
      await api.deleteFicha(c.id);
      showToast("Ficha excluída definitivamente.", "success");
      reloadTrash();
    } catch (e) { showToast("Erro ao excluir.", "error"); }
  };
  const doDuplicate = async (c: FichaSalva) => {
    try { await api.duplicateFicha(c, currentUsername); showToast("Ficha duplicada.", "success"); reloadFichas(); }
    catch (e) { showToast("Erro ao duplicar.", "error"); }
  };
  const doArchive = async (c: FichaSalva) => {
    try { await api.archiveFicha(c, currentUsername, true); showToast("Ficha arquivada.", "success"); reloadFichas(); }
    catch (e) { showToast("Erro ao arquivar.", "error"); }
  };
  const doUnarchive = async (c: FichaSalva) => {
    try { await api.archiveFicha(c, currentUsername, false); showToast("Ficha desarquivada.", "success"); reloadFichas(); }
    catch (e) { showToast("Erro ao desarquivar.", "error"); }
  };

  // O formulário recebe só a ficha em edição, nunca nula: este adaptador
  // aplica a atualização apenas quando há uma ficha aberta.
  const atualizarEditing = (atualizar: Ficha | ((anterior: Ficha) => Ficha)) =>
    setEditing((anterior) => (anterior ? (typeof atualizar === "function" ? atualizar(anterior) : atualizar) : anterior));

  const archivedCount = fichas.filter((c) => c.arquivado).length;

  if (!booted) {
    return (
      <div style={{ background: THEME.pageBg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="vp-spinner" />
      </div>
    );
  }

  if (recoveryMode) {
    return <ResetPassword onSubmit={handleResetPasswordSubmit} />;
  }

  if (!session) {
    return <Login onSignUp={handleSignUp} onSignIn={handleSignIn} onForgotPassword={handleForgotPassword} onResendConfirmation={handleResendConfirmation} onVerifySignup={handleVerifySignup} />;
  }

  if (profile && !profile.terms_accepted_at) {
    return (
      <TermsGate
        onLogout={handleLogout}
        onAccept={async () => {
          await api.acceptTerms(session.user.id);
          const p = await api.getMyProfile(session.user.id);
          setProfile(p);
        }}
      />
    );
  }

  if (reciboRecord) {
    // Recarrega ao fechar, porque o modal pode ter registrado um recibo na ficha.
    return <ReciboModal ficha={reciboRecord} onClose={() => { setReciboRecord(null); reloadFichas(); }} />;
  }

  if (view === "form" && editing) {
    return (
      <div style={{display:"contents"}}>
        <FichaForm
          editing={editing}
          setEditing={atualizarEditing}
          userId={session.user.id}
          showToast={showToast}
          onCancel={() => { setView("list"); setEditing(null); }}
          onSave={saveRecord}
          onDuplicate={async () => {
            const original = fichas.find((f) => f.id === editing.id) ?? (editing.id ? ({ ...editing, id: editing.id } as FichaSalva) : null);
            if (!original) return;
            await doDuplicate(original);
            setView("list"); setEditing(null);
          }}
        />
        {toast && <Toast msg={toast} type={toastType} />}
        {pendingDraft && (
          <DraftModal
            onDiscard={() => { clearDraft(); setPendingDraft(null); }}
            onRestore={() => { setEditing(pendingDraft); setPendingDraft(null); }}
          />
        )}
      </div>
    );
  }

  const handleSaveCadista = async (updatedRecord: FichaSalva) => {
    try {
      await api.saveFicha(updatedRecord, targetOwnerId(), currentUsername);
      showToast("Cadista atualizado.", "success");
      reloadFichas();
    } catch (e) {
      showToast("Erro ao salvar: " + ((e instanceof Error && e.message) || "tente novamente."), "error");
      console.error(e);
    }
  };

  let content;
  if (view === "financeiro") {
    content = (
      <FinanceiroView
        fichas={fichas}
        onOpenFicha={(f) => openEdit(f)}
        onSaveCadista={handleSaveCadista}
        ownerId={targetOwnerId()}
        allUsers={adminViewUser === "ALL"}
      />
    );
  } else if (view === "users" && isAdmin) {
    content = (
      <UsersAdmin
        profiles={profiles}
        currentUserId={session.user.id}
        onRefresh={() => api.getAllProfiles().then(setProfiles)}
      />
    );
  } else {
    content = (
      <FichaList
        fichas={fichas}
        query={query} setQuery={setQuery}
        statusFilter={statusFilter} setStatusFilter={setStatusFilter}
        overdueOnly={overdueOnly} setOverdueOnly={setOverdueOnly}
        showArchived={showArchived} setShowArchived={setShowArchived}
        archivedCount={archivedCount}
        showTrash={showTrash} setShowTrash={setShowTrash}
        fichasExcluidas={fichasExcluidas} loadingTrash={loadingTrash}
        onRestore={doRestore} onPurge={doPurge}
        currentUsername={currentUsername} isAdmin={isAdmin} profiles={profiles}
        adminViewUser={adminViewUser} setAdminViewUser={setAdminViewUser}
        onNew={openNew} onOpen={openEdit} onDuplicate={doDuplicate}
        onArchive={doArchive} onUnarchive={doUnarchive} onDelete={doDelete} onGenerateRecibo={(c) => setReciboRecord(c)}
        isOnline={isOnline}
        loading={loadingFichas}
      />
    );
  }

  return (
    <AppShell view={view === "financeiro" || view === "users" ? view : "list"} onNavigate={setView}
      isAdmin={isAdmin} currentUsername={currentUsername} onLogout={handleLogout}>
      {content}
      {toast && <Toast msg={toast} type={toastType} />}
      {confirmDelete && (
        <ConfirmModal
          title="Mover para a lixeira"
          message={`Mover a ficha de "${confirmDelete.nome}" para a lixeira? Ela sai da lista, mas você pode restaurá-la depois.`}
          confirmLabel="Mover para a lixeira"
          onCancel={() => setConfirmDelete(null)}
          onConfirm={confirmDeleteFicha}
        />
      )}
      {confirmPurge && (
        <ConfirmModal
          title="Excluir definitivamente"
          message={`Excluir para sempre a ficha de "${confirmPurge.nome}"? Essa ação não pode ser desfeita.`}
          confirmLabel="Excluir para sempre"
          onCancel={() => setConfirmPurge(null)}
          onConfirm={confirmPurgeFicha}
        />
      )}
    </AppShell>
  );
}
