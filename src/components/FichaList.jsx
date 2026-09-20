import { useState } from "react";
import {
  Search, Plus, BarChart3, DollarSign, AlertTriangle, Archive,
  Pencil, Receipt, Copy, Trash2, RotateCcw, ExternalLink, Inbox,
} from "lucide-react";
import { STATUS_COLORS, STATUS_LABELS, THEME } from "../config/sections";
import { paymentStatus, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS } from "../utils/finance";
import { hexToRgba } from "../utils/color";
import Dashboard from "./Dashboard";
import { SkeletonFichaRow } from "./Skeleton";

const { ink, muted, line, card, brand, amber, danger } = THEME;

const avatarColors = ["#2A5EAA", "#2F8F5E", "#1F8A8A", "#7A9A2E", "#C98A2C", "#2E86C1", "#7A4FA3", "#3B4C99"];

export default function FichaList({
  fichas, query, setQuery, statusFilter, setStatusFilter, overdueOnly, setOverdueOnly,
  showArchived, setShowArchived, archivedCount,
  currentUsername, isAdmin, profiles, adminViewUser, setAdminViewUser,
  onNew, onOpen, onDuplicate, onArchive, onUnarchive, onDelete, onGenerateRecibo,
  isOnline, loading,
}) {
  const today = new Date().toISOString().slice(0, 10);
  const q = query.trim().toLowerCase();
  const viewingAll = adminViewUser === "ALL";
  const [showDashboard, setShowDashboard] = useState(true);

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

  return (
    <div className="vp-fade-in" style={{ fontFamily: "var(--vp-font-body)" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
          <div>
            <h1 style={{ fontSize: 24, color: ink, margin: 0, fontFamily: "var(--vp-font-heading)" }}>Fichas Técnicas</h1>
            <p style={{ color: muted, fontSize: 12.5, margin: "4px 0 0" }}>
              {fichas.length} ficha{fichas.length !== 1 ? "s" : ""} cadastrada{fichas.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <div title={isOnline ? "Conectado" : "Sem conexão com a internet"}
              style={{ display: "flex", alignItems: "center", gap: 6, background: card, border: `1px solid ${line}`, padding: "6px 10px", borderRadius: 20, fontSize: 11.5, color: ink }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: isOnline ? "#4ADE80" : "#F87171",
                boxShadow: isOnline ? "0 0 6px #4ADE80" : "0 0 6px #F87171" }} />
              {isOnline ? "Online" : "Offline"}
            </div>
            {isAdmin && (
              <select value={adminViewUser || currentUsername} onChange={(e) => setAdminViewUser(e.target.value === currentUsername ? null : e.target.value)}
                style={{ background: card, color: ink, border: `1px solid ${line}`, borderRadius: 8, padding: "7px 10px", fontSize: 12 }}>
                <option value={currentUsername}>Meus cadastros</option>
                <option value="ALL">Todos os usuários</option>
                {profiles.filter((p) => p.username !== currentUsername).map((p) => (
                  <option key={p.id} value={p.username}>{p.username}</option>
                ))}
              </select>
            )}
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
          <button onClick={onNew} style={{ background: `linear-gradient(90deg, ${amber}, #B9762A)`, color: "#fff", padding: "0 18px", fontWeight: 700, display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", borderRadius: 10, border: "none", cursor: "pointer", boxShadow: "0 4px 12px rgba(201,138,44,0.4)" }}>
            <Plus size={15} /> Nova ficha
          </button>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${line}`, fontSize: 12.5, background: card, color: ink }}>
            <option value="">Todas as situações</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: ink, cursor: "pointer",
            background: overdueOnly ? "#FDEDEA" : card, border: `1.5px solid ${overdueOnly ? danger : line}`, borderRadius: 20, padding: "7px 12px" }}>
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
          <div>
            {filtered.map((c) => {
              const statusColor = STATUS_COLORS[c.situacao_atendimento] || brand;
              const statusLabel = STATUS_LABELS[c.situacao_atendimento] || "Aguardando documentos";
              const sub = [c.nome_imovel, c.municipio_uf].filter(Boolean).join(" · ") || "Sem imóvel informado";
              const avatarColor = avatarColors[(c.nome || "?").charCodeAt(0) % avatarColors.length];
              const ownerUsername = profiles.find((p) => p.id === c.owner_id)?.username;
              const payStatus = paymentStatus(c);
              return (
                <div key={c.id} className="vp-card-hover" style={{ background: `linear-gradient(135deg, ${hexToRgba(statusColor, 0.06)}, ${card} 60%)`, border: `1px solid ${line}`, borderLeft: `5px solid ${statusColor}`,
                  borderRadius: 12, padding: "13px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", flexWrap: "wrap", rowGap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 200, flex: 1, cursor: viewingAll ? "default" : "pointer" }}
                    onClick={() => { if (!viewingAll) onOpen(c); }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: avatarColor, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
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
                          <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 20, fontWeight: 700, color: brand, background: "#E8F0E8" }}>{ownerUsername}</span>
                        )}
                      </div>
                      <div style={{ color: muted, fontSize: 12.5, marginTop: 4 }}>{sub}</div>
                    </div>
                  </div>
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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function iconBtn(color) {
  return { background: "none", padding: 10, color, borderRadius: 6, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", minWidth: 38, minHeight: 38 };
}
