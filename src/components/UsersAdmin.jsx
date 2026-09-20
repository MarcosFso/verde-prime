import { useState } from "react";
import { Users, Crown } from "lucide-react";
import { updateProfile } from "../api";
import { THEME } from "../config/sections";
import logo from "../assets/logo.png";

const { ink, muted, line, card, brandDark, amber, danger } = THEME;

export default function UsersAdmin({ profiles, currentUserId, onRefresh }) {
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2200); };

  const toggleAdmin = async (p) => {
    if (p.id === currentUserId) { showToast("Você não pode alterar seu próprio status de admin."); return; }
    setBusyId(p.id);
    try {
      await updateProfile(p.id, { is_admin: !p.is_admin });
      await onRefresh();
      showToast(p.is_admin ? "Removido como administrador." : "Promovido a administrador.");
    } catch (e) {
      showToast("Erro: " + (e?.message || "tente novamente."));
    } finally {
      setBusyId(null);
    }
  };

  const toggleActive = async (p) => {
    if (p.id === currentUserId) { showToast("Você não pode desativar sua própria conta."); return; }
    setBusyId(p.id);
    try {
      await updateProfile(p.id, { is_active: !p.is_active });
      await onRefresh();
      showToast(p.is_active ? "Usuário desativado." : "Usuário reativado.");
    } catch (e) {
      showToast("Erro: " + (e?.message || "tente novamente."));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="vp-fade-in" style={{ fontFamily: "var(--vp-font-body)", position: "relative" }}>
      <img src={logo} alt="" aria-hidden="true" style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width: 420, opacity: 0.04, zIndex: 0, pointerEvents: "none", userSelect: "none",
      }} />
      <div style={{ maxWidth: 760, margin: "0 auto", padding: 24, position: "relative", zIndex: 1 }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 24, margin: 0, fontFamily: "var(--vp-font-heading)", color: ink, display: "flex", alignItems: "center", gap: 10 }}><Users size={22} /> Usuários</h1>
          <p style={{ color: muted, fontSize: 12.5, margin: "4px 0 0" }}>
            Promova outros usuários a administrador, ou desative o acesso de alguém sem precisar mexer no Supabase.
          </p>
        </div>
        <p style={{ color: muted, fontSize: 13, marginBottom: 16 }}>
          Para criar uma conta nova, a pessoa deve usar a aba "Criar conta" na tela de login.
        </p>

        <div style={{ background: card, border: `1px solid ${line}`, borderRadius: 12, overflow: "hidden" }}>
          {profiles.map((p, i) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
              padding: "14px 18px", borderBottom: i < profiles.length - 1 ? `1px solid ${line}` : "none",
              opacity: p.is_active === false ? 0.55 : 1, flexWrap: "wrap", rowGap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 160 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: amber, color: "#fff", display: "flex",
                  alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                  {p.username.charAt(0).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: ink, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                    {p.username}{p.is_admin && <Crown size={13} title="Administrador" />}
                    {p.id === currentUserId && <span style={{ fontSize: 10.5, color: muted, fontWeight: 500 }}>(você)</span>}
                  </div>
                  {p.is_active === false && <div style={{ fontSize: 11.5, color: danger, fontWeight: 600 }}>Desativado</div>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button onClick={() => toggleAdmin(p)} disabled={busyId === p.id || p.id === currentUserId}
                  style={{ fontSize: 11.5, fontWeight: 600, padding: "6px 10px", borderRadius: 8, cursor: p.id === currentUserId ? "not-allowed" : "pointer",
                    background: p.is_admin ? "#FDF3E4" : card, color: p.is_admin ? "#8F631F" : ink, border: `1.5px solid ${p.is_admin ? amber : line}`,
                    opacity: p.id === currentUserId ? 0.5 : 1 }}>
                  {p.is_admin ? "Remover admin" : "Tornar admin"}
                </button>
                <button onClick={() => toggleActive(p)} disabled={busyId === p.id || p.id === currentUserId}
                  style={{ fontSize: 11.5, fontWeight: 600, padding: "6px 10px", borderRadius: 8, cursor: p.id === currentUserId ? "not-allowed" : "pointer",
                    background: p.is_active === false ? "#E8F0E8" : card, color: p.is_active === false ? "#2F8F5E" : danger,
                    border: `1.5px solid ${p.is_active === false ? "#2F8F5E" : danger}`, opacity: p.id === currentUserId ? 0.5 : 1 }}>
                  {p.is_active === false ? "Reativar" : "Desativar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {toast && (
        <div className="vp-toast-in" style={{ position: "fixed", bottom: 20, left: "50%", background: brandDark, color: "#fff",
          padding: "11px 20px", borderRadius: 8, fontSize: 13, zIndex: 40, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
