import { useState } from "react";
import { THEME } from "../config/sections";
import AuthShell from "./AuthShell";
import logo from "../assets/logo.png";

const { ink, muted, line, bg, brand, teal, amber, danger } = THEME;

function Label({ children }) {
  return (
    <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 6, color: ink, marginTop: 16 }}>
      {children}
    </label>
  );
}

const inputStyle = { width: "100%", padding: 10, border: `1.5px solid ${line}`, borderRadius: 8, outline: "none", background: "#fff", marginBottom: 4 };

export function PasswordInput({ value, onChange, onKeyDown, placeholder, style, autoFocus }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative", width: "100%" }}>
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={{ ...(style || inputStyle), boxSizing: "border-box", paddingRight: 40 }}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        tabIndex={-1}
        title={show ? "Ocultar senha" : "Mostrar senha"}
        style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "none", border: "none",
          cursor: "pointer", padding: 6, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", color: muted }}>
        {show ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-10-8-10-8a18.6 18.6 0 0 1 4.22-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s3-8 11-8 11 8 11 8-3 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}

export default function Login({ onSignUp, onSignIn, onForgotPassword, onResendConfirmation, onVerifySignup }) {
  const [mode, setMode] = useState("login"); // login | signup | forgot | verify
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resending, setResending] = useState(false);

  const isSignup = mode === "signup";
  const isForgot = mode === "forgot";
  const isVerify = mode === "verify";

  const handleResend = async () => {
    if (!email.trim()) { setError("Informe seu e-mail para reenviar a confirmação."); return; }
    setResending(true);
    setError("");
    try {
      await onResendConfirmation(email.trim());
      setInfo("Reenviamos o código de confirmação para o seu e-mail. Confira sua caixa de entrada (e o spam).");
      setNeedsConfirmation(false);
    } catch (e) {
      setError(traduzErro(e));
    } finally {
      setResending(false);
    }
  };

  const submit = async () => {
    setError("");
    setInfo("");
    setNeedsConfirmation(false);

    if (isForgot) {
      if (!email.trim()) { setError("Informe seu e-mail."); return; }
      setLoading(true);
      try {
        await onForgotPassword(email.trim());
        setInfo("Se esse e-mail estiver cadastrado, enviamos um link para redefinir a senha. Confira sua caixa de entrada (e o spam).");
      } catch (e) {
        setError(traduzErro(e));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (isVerify) {
      if (!code.trim()) { setError("Informe o código de confirmação que enviamos por e-mail."); return; }
      setLoading(true);
      try {
        await onVerifySignup(email.trim(), code.trim());
        // Sucesso: o app detecta a sessão nova e sai desta tela sozinho.
      } catch (e) {
        setError(traduzErro(e));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!email.trim()) { setError("Informe seu e-mail."); return; }
    if (isSignup && !username.trim()) { setError("Escolha um nome de exibição."); return; }
    if (password.length < 6) { setError("A senha precisa ter pelo menos 6 caracteres."); return; }
    if (isSignup && password !== confirm) { setError("As senhas não coincidem."); return; }

    setLoading(true);
    try {
      if (isSignup) {
        await onSignUp(email.trim(), password, username.trim());
        setInfo("Conta criada! Enviamos um código de confirmação para o seu e-mail.");
        setMode("verify");
        setPassword("");
        setConfirm("");
      } else {
        await onSignIn(email.trim(), password);
      }
    } catch (e) {
      setError(traduzErro(e));
      if ((e && e.message || "").includes("Email not confirmed")) setNeedsConfirmation(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div className="vp-auth-mobile-header">
          <img src={logo} alt="Verde Prime" style={{ width: 140, margin: "0 auto 10px", display: "block", filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.35))" }} />
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 2 }}>Fichas de Primeira Visita Técnica — CAR</p>
        </div>
        <div style={{ background: "#fff", border: `1px solid ${line}`, borderRadius: 16, padding: 26, boxShadow: "0 20px 50px rgba(0,0,0,0.25)" }}>
          {!isForgot && !isVerify && (
            <div style={{ display: "flex", gap: 6, marginBottom: 18, background: bg, borderRadius: 8, padding: 4 }}>
              <button onClick={() => { setMode("login"); setError(""); setInfo(""); setNeedsConfirmation(false); }}
                style={{ flex: 1, padding: "8px 0", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12.5,
                  background: !isSignup ? brand : "transparent", color: !isSignup ? "#fff" : muted }}>
                Entrar
              </button>
              <button onClick={() => { setMode("signup"); setError(""); setInfo(""); setNeedsConfirmation(false); }}
                style={{ flex: 1, padding: "8px 0", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12.5,
                  background: isSignup ? amber : "transparent", color: isSignup ? "#fff" : muted }}>
                Criar conta
              </button>
            </div>
          )}

          {isForgot && (
            <p style={{ fontSize: 13, color: muted, marginBottom: 4 }}>
              Informe o e-mail usado no cadastro. Vamos enviar um link para você criar uma nova senha.
            </p>
          )}

          {isVerify && (
            <div style={{ marginBottom: 4 }}>
              <h2 style={{ margin: "0 0 4px", fontSize: 16, color: ink }}>Confirme seu e-mail</h2>
              <p style={{ fontSize: 13, color: muted, margin: 0 }}>
                Enviamos um código de confirmação para <strong>{email}</strong>. Digite-o abaixo para ativar sua conta.
              </p>
            </div>
          )}

          {isSignup && (
            <div style={{display:"contents"}}>
              <Label>Nome de exibição</Label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} style={inputStyle} placeholder="ex: João (técnico)" />
            </div>
          )}

          {!isVerify && (
            <div style={{display:"contents"}}>
              <Label>E-mail</Label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} placeholder="voce@email.com" autoFocus />
            </div>
          )}

          {isVerify && (
            <div style={{display:"contents"}}>
              <Label>Código de confirmação</Label>
              <input type="text" inputMode="numeric" maxLength={8} value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                style={{ ...inputStyle, fontSize: 20, letterSpacing: 5, textAlign: "center", fontWeight: 700 }}
                placeholder="00000000" autoFocus />
            </div>
          )}

          {!isForgot && !isVerify && (
            <div style={{display:"contents"}}>
              <Label>Senha</Label>
              <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !isSignup && submit()} placeholder="••••••" />
            </div>
          )}

          {isSignup && (
            <div style={{display:"contents"}}>
              <Label>Confirmar senha</Label>
              <PasswordInput value={confirm} onChange={(e) => setConfirm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="••••••" />
            </div>
          )}

          {error && <p style={{ color: danger, fontSize: 13, margin: "12px 0 0" }}>{error}</p>}
          {(needsConfirmation || isVerify) && (
            <button onClick={handleResend} disabled={resending}
              style={{ width: "100%", background: "none", border: `1.5px solid ${brand}`, color: brand, borderRadius: 8,
                padding: "8px 0", fontSize: 12.5, fontWeight: 700, marginTop: 8, cursor: resending ? "default" : "pointer", opacity: resending ? 0.7 : 1 }}>
              {resending ? "Reenviando..." : "Reenviar código"}
            </button>
          )}
          {info && <p style={{ color: brand, fontSize: 13, margin: "12px 0 0" }}>{info}</p>}

          <button onClick={submit} disabled={loading}
            style={{ width: "100%", background: isSignup ? `linear-gradient(90deg, ${amber}, #B9762A)` : `linear-gradient(90deg, ${brand}, ${teal})`,
              color: "#fff", padding: 12, fontWeight: 700, fontSize: 14.5, border: "none", borderRadius: 8,
              cursor: loading ? "default" : "pointer", marginTop: 16, opacity: loading ? 0.7 : 1 }}>
            {loading ? "Aguarde..." : isForgot ? "Enviar link de redefinição" : isVerify ? "Confirmar código" : isSignup ? "Criar conta e entrar" : "Entrar"}
          </button>

          {!isForgot && !isSignup && !isVerify && (
            <button onClick={() => { setMode("forgot"); setError(""); setInfo(""); }}
              style={{ width: "100%", background: "none", border: "none", color: muted, fontSize: 12.5, marginTop: 12, cursor: "pointer", textDecoration: "underline" }}>
              Esqueci minha senha
            </button>
          )}
          {(isForgot || isVerify) && (
            <button onClick={() => { setMode("login"); setError(""); setInfo(""); setCode(""); }}
              style={{ width: "100%", background: "none", border: "none", color: muted, fontSize: 12.5, marginTop: 12, cursor: "pointer", textDecoration: "underline" }}>
              ← Voltar para o login
            </button>
          )}

          {!isForgot && !isVerify && (
            <p style={{ color: muted, fontSize: 11.5, textAlign: "center", marginTop: 14 }}>
              {isSignup ? "O primeiro usuário criado vira administrador." : 'Não tem conta? Use a aba "Criar conta" acima.'}
            </p>
          )}
        </div>
      </div>
    </AuthShell>
  );
}

function traduzErro(e) {
  const msg = (e && e.message) || "";
  if (msg.includes("already registered") || msg.includes("already exists")) return "Esse e-mail já está cadastrado. Faça login.";
  if (msg.includes("Email not confirmed")) return "Você ainda não confirmou seu e-mail. Verifique sua caixa de entrada (e o spam), ou reenvie a confirmação abaixo.";
  if (msg.includes("Token has expired or is invalid") || msg.includes("otp_expired")) return "Código incorreto ou expirado. Confira o código ou peça um novo.";
  if (msg.includes("Invalid login credentials")) return "E-mail ou senha incorretos.";
  if (msg.includes("Password should be")) return "A senha precisa ter pelo menos 6 caracteres.";
  if (msg.includes("Unable to validate email")) return "Informe um e-mail válido.";
  return msg || "Ocorreu um erro. Tente novamente.";
}
