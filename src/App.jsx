import { useState, useEffect, useCallback } from "react";
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

const DRAFT_KEY_PREFIX = "vp_draft_";

export default function App() {
  const [booted, setBooted] = useState(false);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [recoveryMode, setRecoveryMode] = useState(false);

  const [fichas, setFichas] = useState([]);
  const [view, setView] = useState("list");
  const [editing, setEditing] = useState(null);
  const [reciboRecord, setReciboRecord] = useState(null);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [adminViewUser, setAdminViewUser] = useState(null);
  const [pendingDraft, setPendingDraft] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState("default");
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

  const showToast = (msg, type = "default") => { setToast(msg); setToastType(type); setTimeout(() => setToast(""), 2500); };

  // ---------- boot: check existing session ----------
  useEffect(() => {
    (async () => {
      const s = await api.getSession();
      if (s) {
        const p = await api.getMyProfile(s.user.id);
        if (p && p.is_active === false) {
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
      }
      if (event === "SIGNED_IN" && !recoveryMode) {
        setSession(s);
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

  // ---------- auth handlers ----------
  const handleSignUp = async (email, password, username) => {
    await api.signUp(email, password, username);
    const s = await api.getSession();
    setSession(s);
    if (s) setProfile(await api.getMyProfile(s.user.id));
  };
  const handleSignIn = async (email, password) => {
    await api.signIn(email, password);
    const s = await api.getSession();
    const p = s ? await api.getMyProfile(s.user.id) : null;
    if (p && p.is_active === false) {
      await api.signOut();
      throw new Error("Essa conta foi desativada. Fale com o administrador.");
    }
    setSession(s);
    if (p) setProfile(p);
  };
  const handleForgotPassword = async (email) => {
    await api.requestPasswordReset(email);
  };
  const handleResendConfirmation = async (email) => {
    await api.resendConfirmation(email);
  };
  const handleVerifySignup = async (email, code) => {
    const data = await api.verifySignupCode(email, code);
    const s = (data && data.session) || (await api.getSession());
    setSession(s);
    if (s) setProfile(await api.getMyProfile(s.user.id));
  };
  const handleResetPasswordSubmit = async (newPassword) => {
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
    await api.signOut();
    setSession(null);
    setProfile(null);
    setFichas([]);
    setAdminViewUser(null);
  };

  // ---------- logout automático por inatividade (30 minutos) ----------
  useEffect(() => {
    if (!session) return;
    const INACTIVITY_LIMIT_MS = 30 * 60 * 1000;
    let timer;
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
  const saveDraft = (record) => {
    try { localStorage.setItem(draftKey(), JSON.stringify(record)); } catch (e) {}
  };
  const clearDraft = () => { try { localStorage.removeItem(draftKey()); } catch (e) {} };
  const checkDraft = (matchId) => {
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
  const openEdit = (c) => {
    setEditing({ ...c });
    setView("form");
    const draft = checkDraft(c.id);
    if (draft) setPendingDraft(draft);
  };

  const saveRecord = async () => {
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
      showToast("Erro ao salvar: " + (e?.message || "tente novamente."), "error");
      console.error(e);
    }
  };

  const doDelete = (c) => setConfirmDelete(c);
  const confirmDeleteFicha = async () => {
    const c = confirmDelete;
    setConfirmDelete(null);
    try { await api.deleteFicha(c.id); showToast("Ficha removida.", "success"); reloadFichas(); }
    catch (e) { showToast("Erro ao remover.", "error"); }
  };
  const doDuplicate = async (c) => {
    try { await api.duplicateFicha(c, currentUsername); showToast("Ficha duplicada.", "success"); reloadFichas(); }
    catch (e) { showToast("Erro ao duplicar.", "error"); }
  };
  const doArchive = async (c) => {
    try { await api.archiveFicha(c, currentUsername, true); showToast("Ficha arquivada.", "success"); reloadFichas(); }
    catch (e) { showToast("Erro ao arquivar.", "error"); }
  };
  const doUnarchive = async (c) => {
    try { await api.archiveFicha(c, currentUsername, false); showToast("Ficha desarquivada.", "success"); reloadFichas(); }
    catch (e) { showToast("Erro ao desarquivar.", "error"); }
  };

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
    return <ReciboModal ficha={reciboRecord} onClose={() => setReciboRecord(null)} />;
  }

  if (view === "form" && editing) {
    return (
      <div style={{display:"contents"}}>
        <FichaForm
          editing={editing}
          setEditing={setEditing}
          userId={session.user.id}
          showToast={showToast}
          onCancel={() => { setView("list"); setEditing(null); }}
          onSave={saveRecord}
          onDuplicate={async () => {
            const original = fichas.find((f) => f.id === editing.id) || editing;
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

  const handleSaveCadista = async (updatedRecord) => {
    try {
      await api.saveFicha(updatedRecord, targetOwnerId(), currentUsername);
      showToast("Cadista atualizado.", "success");
      reloadFichas();
    } catch (e) {
      showToast("Erro ao salvar: " + (e?.message || "tente novamente."), "error");
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
          title="Excluir ficha"
          message={`Remover permanentemente a ficha de "${confirmDelete.nome}"? Essa ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          onCancel={() => setConfirmDelete(null)}
          onConfirm={confirmDeleteFicha}
        />
      )}
    </AppShell>
  );
}
