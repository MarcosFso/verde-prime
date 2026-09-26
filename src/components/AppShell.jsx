import { useState } from "react";
import { LayoutList, DollarSign, Users, LogOut, Sun, Moon, Crown, ChevronLeft, ChevronRight } from "lucide-react";
import { THEME } from "../config/sections";
import { getTheme, toggleTheme } from "../utils/theme";
import PageBackground from "./PageBackground";
import logo from "../assets/logo.png";

const { pageBg } = THEME;

const SIDEBAR_KEY = "vp-sidebar-collapsed";

export default function AppShell({ view, onNavigate, isAdmin, currentUsername, onLogout, children }) {
  const [dark, setDark] = useState(() => getTheme() === "dark");

  // Lembra se a barra ficou recolhida, pra não ter que fechar de novo a cada visita.
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(SIDEBAR_KEY) === "1"; } catch (e) { return false; }
  });

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0"); } catch (e) {}
      return next;
    });
  };

  const navItems = [
    { id: "list", label: "Fichas", Icon: LayoutList },
    { id: "financeiro", label: "Financeiro", Icon: DollarSign },
    ...(isAdmin ? [{ id: "users", label: "Usuários", Icon: Users }] : []),
  ];

  return (
    <div className="vp-shell">
      <aside className={`vp-sidebar ${collapsed ? "vp-sidebar-collapsed" : ""}`}>
        <div className="vp-blob" style={{ width: 160, height: 160, background: "#C98A2C", opacity: 0.25, top: -60, left: -40 }} />
        <div className="vp-sidebar-head">
          <img src={logo} alt="Verde Prime" className="vp-sidebar-logo" />
          <button onClick={toggleSidebar} className="vp-sidebar-toggle"
            title={collapsed ? "Expandir menu" : "Recolher menu"}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}>
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
        <nav className="vp-sidebar-nav">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => onNavigate(item.id)} title={item.label}
              className={`vp-sidebar-link ${view === item.id ? "vp-sidebar-link-active" : ""}`}>
              <item.Icon size={17} /> <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="vp-sidebar-footer">
          <button onClick={() => setDark(toggleTheme() === "dark")} className="vp-sidebar-link"
            title={dark ? "Tema claro" : "Tema escuro"}>
            {dark ? <Sun size={16} /> : <Moon size={16} />} <span>{dark ? "Tema claro" : "Tema escuro"}</span>
          </button>
          <div className="vp-sidebar-user" title={currentUsername}>
            <span className="vp-sidebar-avatar">{currentUsername.charAt(0).toUpperCase()}</span>
            <span>{currentUsername}{isAdmin && <Crown size={11} style={{ marginLeft: 4, verticalAlign: -1 }} />}</span>
          </div>
          <button onClick={onLogout} className="vp-sidebar-link vp-sidebar-logout" title="Sair">
            <LogOut size={16} /> <span>Sair</span>
          </button>
        </div>
      </aside>
      <main className="vp-main" style={{ background: pageBg }}>
        <PageBackground />
        <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
      </main>
    </div>
  );
}
