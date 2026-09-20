import { useState } from "react";
import { ShieldCheck, Leaf, FileCheck2, Sun, Moon } from "lucide-react";
import { getTheme, toggleTheme } from "../utils/theme";
import logo from "../assets/logo.png";

export default function AuthShell({ children, tagline }) {
  const [dark, setDark] = useState(() => getTheme() === "dark");

  return (
    <div className="vp-auth-shell vp-fade-in" style={{ fontFamily: "var(--vp-font-body)", position: "relative" }}>
      <button onClick={() => setDark(toggleTheme() === "dark")} title={dark ? "Tema claro" : "Tema escuro"}
        className="vp-glass" style={{ position: "absolute", top: 16, right: 16, zIndex: 5, background: "rgba(255,255,255,0.15)",
          border: "1px solid rgba(255,255,255,0.25)", color: "#fff", borderRadius: "50%", width: 36, height: 36,
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
        {dark ? <Sun size={16} /> : <Moon size={16} />}
      </button>
      <div className="vp-auth-brand">
        <div className="vp-blob" style={{ width: 260, height: 260, background: "#C98A2C", opacity: 0.3, top: "-8%", left: "-8%" }} />
        <div className="vp-blob" style={{ width: 220, height: 220, background: "#1F8A8A", opacity: 0.3, bottom: "-8%", right: "-6%", animationDelay: "2s" }} />
        <div className="vp-blob" style={{ width: 140, height: 140, background: "#7A9A2E", opacity: 0.22, top: "20%", right: "10%", animationDelay: "1s" }} />
        <svg className="vp-auth-pattern" viewBox="0 0 400 500" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,90 C110,150 300,30 400,100" stroke="#fff" strokeWidth="1.2" fill="none" opacity="0.16" />
          <path d="M0,180 C130,240 280,120 400,200" stroke="#fff" strokeWidth="1.2" fill="none" opacity="0.12" />
          <path d="M0,300 C150,360 260,240 400,320" stroke="#fff" strokeWidth="1.2" fill="none" opacity="0.1" />
          <path d="M0,400 C160,450 250,350 400,420" stroke="#fff" strokeWidth="1.2" fill="none" opacity="0.08" />
        </svg>
        <img src={logo} alt="Verde Prime" className="vp-auth-logo" />
        <h2 className="vp-auth-title">Verde Prime</h2>
        <p className="vp-auth-tagline">
          {tagline || "Consultoria ambiental — gestão completa de fichas técnicas e Cadastro Ambiental Rural (CAR)."}
        </p>
        <div className="vp-auth-badges">
          <span className="vp-auth-badge"><Leaf size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />CAR & regularização</span>
          <span className="vp-auth-badge"><FileCheck2 size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />Fichas técnicas</span>
          <span className="vp-auth-badge"><ShieldCheck size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />Dados protegidos</span>
        </div>
      </div>
      <div className="vp-auth-form">
        <img src={logo} alt="" aria-hidden="true" className="vp-auth-form-logo" />
        <div style={{ position: "relative", zIndex: 1, width: "100%", display: "flex", justifyContent: "center" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
