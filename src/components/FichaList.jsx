import { useState } from "react";
import {
  Search, Plus, BarChart3, DollarSign, AlertTriangle, Archive,
  Pencil, Receipt, Copy, Trash2, RotateCcw, ExternalLink, Inbox,
} from "lucide-react";
import { STATUS_COLORS, STATUS_LABELS, THEME } from "../config/sections";
import { paymentStatus, formatBRL, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS } from "../utils/finance";
import { hexToRgba } from "../utils/color";
import Dashboard from "./Dashboard";
import Tilt from "./Tilt";
import { SkeletonFichaRow } from "./Skeleton";

const { ink, muted, line, card, brand, danger } = THEME;

function saudacao() {
  const h = new Date().getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

const avatarColors = ["#2A5EAA", "#2F8F5E", "#1F8A8A", "#7A9A2E", "#C98A2C", "#2E86C1", "#7A4FA3", "#3B4C99"];

export default function FichaList({
  fichas, query, setQuery, statusFilter, setStatusFilter, overdueOnly, setOverdueOnly,
  showArchived, setShowArchived, archivedCount,
  showTrash, setShowTrash, fichasExcluidas, loadingTrash, onRestore, onPurge,
  currentUsername, isAdmin, profiles, adminViewUser, setAdminViewUser,
  onNew, onOpen, onDuplicate, onArchive, onUnarchive, onDelete, onGenerateRecibo,
  isOnline, loading,
}) {
  const today = new Date().toISOString().slice(0, 10);
  const q = query.trim().toLowerCase();
  const viewingAll = adminViewUser === "ALL";
  const [showDashboard, setShowDashboard] = useState(true);
  const atrasadas = fichas.filter((f) => !f.arquivado && f.prazo_atendimento && f.prazo_atendimento < today && f.situacao_atendimento !== "concluido").length;

  const filtered = fichas.filter((c) => {
    if (showArchived) { if (!c.arquivado) return false; } else if (c.arquivado) return false;
    if (q) {
      const hit = [c.nome, c.nome_imovel, c.municipio_uf, c.cpf_cnpj, c.numero_car, c.numero_protocolo]
        .filter(Boolean).some((f) => f.toLowerCase().includes(q));
      if (!hit) return false;
    }
    if (statusFilter && c.situacao_atendimento !== statusFilter) return false;
    if (overdueOnly) {
      const overdue = c.prazo_atendimento && c.prazo_atendimento < today && c.situacao_atendimento !== "concluido";
      if (!overdue) return false;
    }
    return true;
  }).sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt-BR"));

  // A lixeira é uma tela própria: fichas removidas, com restaurar e excluir de vez.
  if (showTrash) {
    const naLixeira = fichasExcluidas || [];
    return (
      <div className="vp-fade-in" style={{ fontFamily: "var(--vp-font-body)" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
            <div>
              <h1 style={{ fontSize: 24, color: ink, margin: 0, fontFamily: "var(--vp-font-heading)" }}>Lixeira</h1>
              <p style={{ color: muted, fontSize: 12.5, margin: "4px 0 0" }}>
                {naLixeira.length} ficha{naLixeira.length !== 1 ? "s" : ""} na lixeira
              </p>
            </div>
            <button onClick={() => setShowTrash(false)}
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, background: card, color: ink,
                border: `1.5px solid ${line}`, borderRadius: 20, padding: "8px 14px", cursor: "pointer" }}>
              <RotateCcw size={14} /> Voltar para as fichas
            </button>
          </div>

          <p style={{ color: muted, fontSize: 12.5, marginBottom: 16 }}>
            Fichas na lixeira não aparecem na lista nem entram nos totais do financeiro. Restaure para trazê-las de volta, ou exclua para sempre.
          </p>

          {loadingTrash ? (
            <div>{[0, 1, 2].map((i) => <SkeletonFichaRow key={i} />)}</div>
          ) : naLixeira.length === 0 ? (
            <div style={{ border: `2px dashed ${line}`, borderRadius: 12, padding: "60px 20px", textAlign: "center", color: muted, fontSize: 14, background: card, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <Trash2 size={36} color={line} />
              A lixeira está vazia.
            </div>
          ) : (
            <div>
              {naLixeira.map((c) => {
                const sub = [c.nome_imovel, c.municipio_uf].filter(Boolean).join(" · ") || "Sem imóvel informado";
                const quando = c.excluido_em ? new Date(c.excluido_em).toLocaleDateString("pt-BR") : "";
                return (
                  <div key={c.id} style={{ background: card, border: `1px solid ${line}`, borderLeft: `5px solid ${muted}`, borderRadius: 12,
                    padding: "13px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10, flexWrap: "wrap", rowGap: 10 }}>
                    <div style={{ minWidth: 200, flex: 1 }}>
                      <div style={{ fontWeight: 700, color: ink }}>{c.nome}</div>
                      <div style={{ color: muted, fontSize: 12.5, marginTop: 4 }}>
                        {sub}{quando ? ` · removida em ${quando}` : ""}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap" }}>
                      <button onClick={() => onRestore(c)} title="Restaurar esta ficha"
                        style={{ ...iconBtn(brand), fontSize: 11.5, fontWeight: 700, width: "auto", gap: 5, padding: "8px 12px" }}>
                        <RotateCcw size={14} /> Restaurar
                      </button>
                      <button onClick={() => onPurge(c)} title="Excluir para sempre"
                        style={{ ...iconBtn(danger), fontSize: 11.5, fontWeight: 700, width: "auto", gap: 5, padding: "8px 12px" }}>
                        <Trash2 size={14} /> Excluir para sempre
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="vp-fade-in" style={{ fontFamily: "var(--vp-font-body)" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: 24 }}>
        <div className="vp-hero-banner">
          <span className="vp-orb vp-hero-orb vp-orb-1" />
          <span className="vp-orb vp-hero-orb vp-orb-2" />
          <span className="vp-orb vp-hero-orb vp-orb-4" />
          <div className="vp-hero-ring" />
          <div style={{ position: "relative", zIndex: 1, minWidth: 0 }}>
            <div className="vp-hero-date">{new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</div>
            <h1>{saudacao()}, {currentUsername.split(" ")[0]}! 👋</h1>
            <p>
              {fichas.filter((f) => !f.arquivado).length} ficha{fichas.filter((f) => !f.arquivado).length !== 1 ? "s" : ""} ativa{fichas.filter((f) => !f.arquivado).length !== 1 ? "s" : ""} no sistema
              {atrasadas > 0 ? ` · ${atrasadas} com prazo vencido` : " · nenhum prazo vencido"}
            </p>
          </div>
          <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <div title={isOnline ? "Conectado" : "Sem conexão com a internet"} className="vp-hero-pill">
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: isOnline ? "#4ADE80" : "#F87171",
                boxShadow: isOnline ? "0 0 8px #4ADE80" : "0 0 8px #F87171" }} />
              {isOnline ? "Online" : "Offline"}
            </div>
            {isAdmin && (
              <select value={adminViewUser || currentUsername} onChange={(e) => setAdminViewUser(e.target.value === currentUsername ? null : e.target.value)}
                className="vp-hero-select">
                <option value={currentUsername}>Meus cadastros</option>
                <option value="ALL">Todos os usuários</option>
                {profiles.filter((p) => p.username !== currentUsername).map((p) => (
                  <option key={p.id} value={p.username}>{p.username}</option>
                ))}
              </select>
            )}
            <button onClick={onNew} className="vp-btn-3d vp-hero-new">
              <Plus size={17} /> Nova ficha
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          <button onClick={() => setShowDashboard((v) => !v)}
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, background: showDashboard ? brand : card,
              color: showDashboard ? "#fff" : ink, border: `1.5px solid ${showDashboard ? brand : line}`, borderRadius: 20, padding: "7px 12px", cursor: "pointer",
              boxShadow: showDashboard ? "0 3px 10px rgba(31,111,74,0.3)" : "none" }}>
            <BarChart3 size={14} /> {showDashboard ? "Ocultar resumo" : "Ver resumo"}
          </button>
        </div>

        {showDashboard && <Dashboard fichas={fichas} />}

        <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 220, display: "flex", alignItems: "center", gap: 8, background: card, border: `1.5px solid ${line}`, borderRadius: 10, padding: "0 12px", boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
            <Search size={15} color={muted} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nome, imóvel, município, CPF/CNPJ, CAR ou protocolo"
              style={{ border: "none", outline: "none", padding: "11px 0", width: "100%", background: "transparent", color: ink }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${line}`, fontSize: 12.5, background: card, color: ink }}>
            <option value="">Todas as situações</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: ink, cursor: "pointer",
            background: overdueOnly ? "var(--vp-danger-tint)" : card, border: `1.5px solid ${overdueOnly ? danger : line}`, borderRadius: 20, padding: "7px 12px" }}>
            <input type="checkbox" checked={overdueOnly} onChange={(e) => setOverdueOnly(e.target.checked)} style={{ margin: 0 }} />
            <AlertTriangle size={13} /> Prazos vencidos
          </label>
          {(statusFilter || overdueOnly || query) && (
            <button onClick={() => { setStatusFilter(""); setOverdueOnly(false); setQuery(""); }}
              style={{ background: "none", border: "none", color: muted, fontSize: 12, textDecoration: "underline", cursor: "pointer" }}>
              Limpar filtros
            </button>
          )}
          <button onClick={() => setShowArchived(!showArchived)}
            style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600,
              background: showArchived ? ink : card, color: showArchived ? "#fff" : ink, border: `1.5px solid ${showArchived ? ink : line}`, borderRadius: 20, padding: "7px 12px", cursor: "pointer" }}>
            <Archive size={13} /> {showArchived ? "Voltar para ativas" : `Ver arquivados${archivedCount ? ` (${archivedCount})` : ""}`}
          </button>
          <button onClick={() => setShowTrash(true)} title="Fichas removidas, com opção de restaurar"
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, background: card, color: ink,
              border: `1.5px solid ${line}`, borderRadius: 20, padding: "7px 12px", cursor: "pointer" }}>
            <Trash2 size={13} /> Lixeira
          </button>
        </div>

        {showArchived && (
          <p style={{ color: muted, fontSize: 12.5, marginBottom: 12 }}>
            Mostrando fichas arquivadas. Clique em "Desarquivar" para trazer de volta à lista ativa.
          </p>
        )}

        {loading ? (
          <div>
            {[0, 1, 2, 3].map((i) => <SkeletonFichaRow key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ border: `2px dashed ${line}`, borderRadius: 12, padding: "60px 20px", textAlign: "center", color: muted, fontSize: 14, background: card, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <Inbox size={36} color={line} />
            {fichas.length === 0 ? "Nenhuma ficha cadastrada ainda." : "Nenhuma ficha encontrada."}
          </div>
        ) : (
          <div className="vp-stagger">
            {filtered.map((c) => {
              const statusColor = STATUS_COLORS[c.situacao_atendimento] || brand;
              const statusLabel = STATUS_LABELS[c.situacao_atendimento] || "Aguardando documentos";
              const sub = [c.nome_imovel, c.municipio_uf].filter(Boolean).join(" · ") || "Sem imóvel informado";
              const avatarColor = avatarColors[(c.nome || "?").charCodeAt(0) % avatarColors.length];
              const ownerUsername = profiles.find((p) => p.id === c.owner_id)?.username;
              const payStatus = paymentStatus(c);
              return (
                <Tilt key={c.id} max={2.5} className="vp-card-hover" style={{ background: `linear-gradient(135deg, ${hexToRgba(statusColor, 0.06)}, ${card} 60%)`, border: `1px solid ${line}`, borderLeft: `5px solid ${statusColor}`,
                  borderRadius: 16, padding: "15px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12, boxShadow: "var(--vp-shadow-sm)", flexWrap: "wrap", rowGap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 200, flex: 1, cursor: viewingAll ? "default" : "pointer" }}
                    onClick={() => { if (!viewingAll) onOpen(c); }}>
                    <div className="vp-icon-3d" style={{ width: 42, height: 42, borderRadius: "50%", background: avatarColor, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
                      {(c.nome || "?").charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 700, color: ink }}>{c.nome}</span>
                        <span style={{ fontSize: 10, textTransform: "uppercase", padding: "3px 8px", borderRadius: 20, fontWeight: 700, color: "#fff", background: statusColor }}>{statusLabel}</span>
                        {payStatus && (
                          <span style={{ fontSize: 10, textTransform: "uppercase", padding: "3px 8px", borderRadius: 20, fontWeight: 700, color: "#fff", background: PAYMENT_STATUS_COLORS[payStatus], display: "flex", alignItems: "center", gap: 3 }}>
                            <DollarSign size={9} /> {PAYMENT_STATUS_LABELS[payStatus]}
                          </span>
                        )}
                        {viewingAll && ownerUsername && (
                          <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 20, fontWeight: 700, color: brand, background: "var(--vp-brand-tint)" }}>{ownerUsername}</span>
                        )}
                      </div>
                      <div style={{ color: muted, fontSize: 12.5, marginTop: 4 }}>{sub}</div>
                    </div>
                  </div>
                  {!showArchived && !viewingAll && (Number(c.valor_cobrado) > 0 || c.prazo_atendimento) && (
                    <div className="vp-card-metrics">
                      {Number(c.valor_cobrado) > 0 && (
                        <div>
                          <div className="vp-metric-top">
                            <strong>{formatBRL(c.valor_cobrado)}</strong>
                            <span>{Math.min(100, Math.round(((Number(c.valor_recebido) || 0) / Number(c.valor_cobrado)) * 100))}% pago</span>
                          </div>
                          <div className="vp-metric-bar">
                            <div style={{ width: `${Math.min(100, ((Number(c.valor_recebido) || 0) / Number(c.valor_cobrado)) * 100)}%`,
                              background: `linear-gradient(90deg, ${PAYMENT_STATUS_COLORS[payStatus] || brand}, ${PAYMENT_STATUS_COLORS[payStatus] || brand}CC)` }} />
                          </div>
                        </div>
                      )}
                      {c.prazo_atendimento && (
                        <div className={`vp-prazo ${c.prazo_atendimento < today && c.situacao_atendimento !== "concluido" ? "vp-prazo-late" : ""}`}>
                          <AlertTriangle size={11} /> Prazo {new Date(c.prazo_atendimento + "T00:00:00").toLocaleDateString("pt-BR")}
                        </div>
                      )}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                    {viewingAll ? (
                      <button onClick={() => setAdminViewUser(ownerUsername)} title="Ver cadastros deste usuário" style={{ ...iconBtn(brand), fontSize: 11, fontWeight: 700, width: "auto", gap: 4 }}>
                        Abrir <ExternalLink size={13} />
                      </button>
                    ) : showArchived ? (
                      <div style={{display:"contents"}}>
                        <button onClick={() => onUnarchive(c)} title="Desarquivar" style={{ ...iconBtn(brand), fontSize: 11, fontWeight: 700, width: "auto", gap: 4 }}>
                          <RotateCcw size={14} /> Desarquivar
                        </button>
                        <button onClick={() => onDelete(c)} title="Excluir permanentemente" style={iconBtn(danger)}><Trash2 size={15} /></button>
                      </div>
                    ) : (
                      <div style={{display:"contents"}}>
                        <button onClick={() => onOpen(c)} title="Editar" style={iconBtn(brand)}><Pencil size={15} /></button>
                        <button onClick={() => onGenerateRecibo(c)} title="Gerar recibo" style={iconBtn("#1E8F5F")}><Receipt size={15} /></button>
                        <button onClick={() => onDuplicate(c)} title="Duplicar" style={iconBtn(muted)}><Copy size={15} /></button>
                        <button onClick={() => onDelete(c)} title="Excluir ficha" style={iconBtn(danger)}><Trash2 size={15} /></button>
                        <button onClick={() => onArchive(c)} title="Arquivar" style={iconBtn("#8F631F")}><Archive size={15} /></button>
                      </div>
                    )}
                  </div>
                </Tilt>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function iconBtn(color) {
  return { background: "none", padding: 10, color, borderRadius: 6, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", minWidth: 42, minHeight: 42 };
}
