import { useState } from "react";
import { THEME } from "../config/sections";
import AuthShell from "./AuthShell";
import logo from "../assets/logo.png";
import { PasswordInput } from "./Login";

const { ink, muted, line, brand, teal, danger } = THEME;

export default function ResetPassword({ onSubmit }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setError("");
    if (password.length < 6) { setError("A senha precisa ter pelo menos 6 caracteres."); return; }
    if (password !== confirm) { setError("As senhas não coincidem."); return; }
    setLoading(true);
    try {
      await onSubmit(password);
      setDone(true);
    } catch (e) {
      setError((e && e.message) || "Não foi possível atualizar a senha. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell tagline="Redefinição de senha segura, protegida por autenticação Supabase.">
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div className="vp-auth-mobile-header">
          <img src={logo} alt="Verde Prime" style={{ width: 140, margin: "0 auto 10px", display: "block", filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.35))" }} />
        </div>
        <div style={{ background: "#fff", border: `1px solid ${line}`, borderRadius: 16, padding: 26, boxShadow: "0 20px 50px rgba(0,0,0,0.25)" }}>
          {done ? (
            <div style={{display:"contents"}}>
              <h3 style={{ fontSize: 16, marginBottom: 8 }}>Senha atualizada!</h3>
              <p style={{ color: muted, fontSize: 13 }}>Sua senha foi alterada com sucesso. Você já pode continuar usando o sistema normalmente.</p>
            </div>
          ) : (
            <div style={{display:"contents"}}>
              <h3 style={{ fontSize: 16, marginBottom: 4 }}>Criar nova senha</h3>
              <p style={{ color: muted, fontSize: 13, marginBottom: 10 }}>Digite a nova senha para sua conta.</p>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 6, color: ink, marginTop: 12 }}>Nova senha</label>
              <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)}
                style={{ width: "100%", padding: 10, border: `1.5px solid ${line}`, borderRadius: 8, outline: "none" }} placeholder="••••••" autoFocus />
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 6, color: ink, marginTop: 12 }}>Confirmar nova senha</label>
              <PasswordInput value={confirm} onChange={(e) => setConfirm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                style={{ width: "100%", padding: 10, border: `1.5px solid ${line}`, borderRadius: 8, outline: "none" }} placeholder="••••••" />
              {error && <p style={{ color: danger, fontSize: 13, margin: "12px 0 0" }}>{error}</p>}
              <button onClick={submit} disabled={loading}
                style={{ width: "100%", background: `linear-gradient(90deg, ${brand}, ${teal})`, color: "#fff", padding: 12, fontWeight: 700,
                  fontSize: 14.5, border: "none", borderRadius: 8, cursor: loading ? "default" : "pointer", marginTop: 16, opacity: loading ? 0.7 : 1 }}>
                {loading ? "Salvando..." : "Salvar nova senha"}
              </button>
            </div>
          )}
        </div>
      </div>
    </AuthShell>
  );
}
