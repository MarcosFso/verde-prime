import { useState, useEffect, useCallback } from "react";
import { DollarSign, Wallet, Map, Trash2, Plus, Scale, TrendingUp, Clock, TrendingDown } from "lucide-react";
import * as api from "../api";
import { THEME, SECTIONS } from "../config/sections";
import { paymentStatus, formatBRL, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS } from "../utils/finance";
import { formatCurrencyDigits, parseCurrencyInput } from "../utils/masks";
import FieldInput from "./FieldInput";
import CountUp from "./CountUp";
import ConfirmModal from "./ConfirmModal";
import { SkeletonRow } from "./Skeleton";

const { ink, muted, line, bg, card, brand, amber, danger, brandTint, tealTint, amberTint, dangerTint } = THEME;

const CADISTA_FIELDS = SECTIONS.find((s) => s.id === "cadista").fields;

const MONTH_COLORS = ["#A8D5BA", "#7CC095", "#4FAB72", "#2F8F5E", "#1E8F5F", "#124430"];

const DESPESA_CATEGORIAS = [
  ["gasolina", "⛽ Gasolina"],
  ["aparelhos", "🛠️ Aparelhos"],
  ["refeicao", "🍽️ Refeição"],
  ["hospedagem", "🏨 Hospedagem"],
  ["alimentacao", "🛒 Alimentação"],
  ["outros", "📦 Outros"],
];

export default function FinanceiroView({ fichas, onBack, onOpenFicha, onSaveCadista, ownerId, allUsers }) {
  const ativas = fichas.filter((f) => !f.arquivado);
  const [cadistaEditing, setCadistaEditing] = useState(null);
  const [savingCadista, setSavingCadista] = useState(false);

  // Estados para despesas (persistidas no Supabase)
  const [despesas, setDespesas] = useState([]);
  const [loadingDespesas, setLoadingDespesas] = useState(true);
  const [savingDespesa, setSavingDespesa] = useState(false);
  const [novaDepesa, setNovaDepesa] = useState({ descricao: "", valor: "", categoria: "gasolina" });
  const [mostrarFormDespesa, setMostrarFormDespesa] = useState(false);
  const [confirmDespesaId, setConfirmDespesaId] = useState(null);

  const loadDespesas = useCallback(async () => {
    setLoadingDespesas(true);
    try {
      const list = await api.fetchDespesas({ ownerId, allUsers });
      setDespesas(list);
    } catch (e) {
      console.error(e);
      alert("Erro ao carregar despesas: " + (e?.message || "tente novamente."));
    } finally {
      setLoadingDespesas(false);
    }
  }, [ownerId, allUsers]);

  useEffect(() => { loadDespesas(); }, [loadDespesas]);

  const cadistaList = ativas
    .slice()
    .sort((a, b) => {
      const av = a.cadista_nome ? 1 : 0, bv = b.cadista_nome ? 1 : 0;
      if (av !== bv) return av - bv; // sem cadista definido aparece primeiro
      return (a.nome || "").localeCompare(b.nome || "");
    });

  const handleSaveCadista = async (updatedRecord) => {
    setSavingCadista(true);
    try {
      await onSaveCadista(updatedRecord);
      setCadistaEditing(null);
    } finally {
      setSavingCadista(false);
    }
  };

  let totalCobrado = 0, totalRecebido = 0, totalDespesasCadista = 0;
  const porStatus = { pago: 0, parcial: 0, pendente: 0 };
  ativas.forEach((f) => {
    totalCobrado += Number(f.valor_cobrado) || 0;
    totalRecebido += Number(f.valor_recebido) || 0;
    totalDespesasCadista += Number(f.cadista_valor) || 0;
    const st = paymentStatus(f);
    if (st) porStatus[st] += 1;
  });

  // Despesas extras lançadas (gasolina, hospedagem, etc.) — descontam do saldo
  const totalDespesasExtra = despesas.reduce((sum, d) => sum + (Number(d.valor) || 0), 0);
  const totalDespesas = totalDespesasCadista + totalDespesasExtra;

  const aReceber = Math.max(totalCobrado - totalRecebido, 0);
  const saldo = totalRecebido - totalDespesas;

  // Adicionar despesa (grava no Supabase)
  const handleAddDespesa = async () => {
    if (!novaDepesa.descricao || !novaDepesa.valor) {
      alert('⚠️ Preencha descrição e valor!');
      return;
    }
    setSavingDespesa(true);
    try {
      await api.saveDespesa(novaDepesa, ownerId);
      setNovaDepesa({ descricao: "", valor: "", categoria: "gasolina" });
      setMostrarFormDespesa(false);
      await loadDespesas();
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar despesa: " + (e?.message || "tente novamente."));
    } finally {
      setSavingDespesa(false);
    }
  };

  // Remover despesa (exclui do Supabase)
  const handleRemoveDespesa = async (id) => {
    setConfirmDespesaId(null);
    try {
      await api.deleteDespesa(id);
      setDespesas((prev) => prev.filter((d) => d.id !== id));
    } catch (e) {
      console.error(e);
      alert("Erro ao remover despesa: " + (e?.message || "tente novamente."));
    }
  };

  // Gráfico: recebido por mês, últimos 6 meses (baseado na data de cadastro da ficha)
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: d.toLocaleDateString("pt-BR", { month: "short" }) });
  }
  const monthTotals = Object.fromEntries(months.map((m) => [m.key, 0]));
  ativas.forEach((f) => {
    (f.pagamentos || []).forEach((p) => {
      if (!p.data || !p.valor) return;
      const d = new Date(p.data + "T00:00:00");
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (key in monthTotals) monthTotals[key] += Number(p.valor) || 0;
    });
  });
  const maxMonth = Math.max(1, ...Object.values(monthTotals));
  const hasRecebimentos = Object.values(monthTotals).some((v) => v > 0);
  const currentMonthKey = months[months.length - 1]?.key;

  const pendentesList = ativas
    .filter((f) => paymentStatus(f) === "pendente" || paymentStatus(f) === "parcial")
    .sort((a, b) => (Number(b.valor_cobrado) || 0) - (Number(a.valor_cobrado) || 0));

  return (
    <div className="vp-fade-in" style={{ fontFamily: "var(--vp-font-body)" }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 24, margin: 0, fontFamily: "var(--vp-font-heading)", color: ink, display: "flex", alignItems: "center", gap: 10 }}><DollarSign size={22} /> Financeiro</h1>
          <p style={{ color: muted, fontSize: 12.5, margin: "4px 0 0" }}>Saldo, recebimentos, despesas e cadista das fichas ativas.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12, marginBottom: 20 }}>
          <SummaryCard label="Saldo" value={saldo} format={formatBRL} color="#3B4C99" tint={tealTint} Icon={Scale} />
          <SummaryCard label="Recebido" value={totalRecebido} format={formatBRL} color="#2F8F5E" tint={brandTint} Icon={TrendingUp} />
          <SummaryCard label="A receber" value={aReceber} format={formatBRL} color={amber} tint={amberTint} Icon={Clock} highlight={aReceber > 0} />
          <SummaryCard label="Despesas" value={totalDespesas} format={formatBRL} color={danger} tint={dangerTint} Icon={TrendingDown} />
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          {Object.entries(porStatus).map(([st, count]) => (
            <div key={st} style={{ display: "flex", alignItems: "center", gap: 8, background: card, border: `1.5px solid ${line}`,
              borderRadius: 20, padding: "8px 16px", fontSize: 13 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: PAYMENT_STATUS_COLORS[st] }} />
              <strong style={{ color: ink }}>{count}</strong>
              <span style={{ color: muted }}>{PAYMENT_STATUS_LABELS[st]}</span>
            </div>
          ))}
        </div>

        <div style={{ background: card, border: `1px solid ${line}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: ink }}>Recebido por mês (últimos 6 meses)</h3>
          {!hasRecebimentos ? (
            <div style={{ height: 160, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, color: muted, fontSize: 12.5 }}>
              <TrendingUp size={26} color={line} />
              Nenhum recebimento lançado nos últimos 6 meses.
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 14, height: 160, borderBottom: `1.5px solid ${line}`, paddingBottom: 2 }}>
              {months.map((m) => {
                const val = monthTotals[m.key];
                const h = Math.max(4, Math.round((val / maxMonth) * 138));
                const isCurrent = m.key === currentMonthKey;
                return (
                  <div key={m.key} title={`${m.label}: ${formatBRL(val)}`}
                    style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%", cursor: "default" }}>
                    <div style={{ fontSize: 10.5, color: isCurrent ? ink : muted, marginBottom: 4, fontWeight: 700 }}>{val > 0 ? formatBRL(val).replace("R$", "").trim() : ""}</div>
                    <div style={{ width: "100%", maxWidth: 44, height: h, borderRadius: "6px 6px 0 0", transition: "height .3s ease",
                      background: isCurrent ? "linear-gradient(180deg, #C98A2C, #B9762A)" : "linear-gradient(180deg, #2F8F5E, #1E8F5F)",
                      boxShadow: isCurrent ? "0 2px 8px rgba(201,138,44,0.4)" : "0 2px 6px rgba(30,143,95,0.3)" }} />
                    <div style={{ fontSize: 11.5, color: isCurrent ? ink : muted, marginTop: 6, textTransform: "capitalize", fontWeight: isCurrent ? 800 : 600 }}>{m.label}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ background: card, border: `1px solid ${line}`, borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${line}` }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: ink, display: "flex", alignItems: "center", gap: 8 }}><Wallet size={15} /> Despesas extras</h3>
            <button onClick={() => setMostrarFormDespesa((v) => !v)}
              style={{ background: brand, color: "#fff", border: "none", borderRadius: 6, padding: "7px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              {mostrarFormDespesa ? "Cancelar" : <><Plus size={14} /> Nova despesa</>}
            </button>
          </div>

          {mostrarFormDespesa && (
            <div className="vp-fade-in" style={{ padding: 20, borderBottom: `1px solid ${line}`, background: bg, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end" }}>
              <div style={{ flex: "2 1 180px" }}>
                <label style={{ display: "block", fontSize: 11.5, color: muted, marginBottom: 4 }}>Descrição</label>
                <input type="text" value={novaDepesa.descricao}
                  onChange={(e) => setNovaDepesa({ ...novaDepesa, descricao: e.target.value })}
                  placeholder="Ex: Combustível viagem fazenda"
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `1px solid ${line}`, fontSize: 13, background: card, color: ink }} />
              </div>
              <div style={{ flex: "1 1 140px" }}>
                <label style={{ display: "block", fontSize: 11.5, color: muted, marginBottom: 4 }}>Categoria</label>
                <select value={novaDepesa.categoria}
                  onChange={(e) => setNovaDepesa({ ...novaDepesa, categoria: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `1px solid ${line}`, fontSize: 13, background: card, color: ink }}>
                  {DESPESA_CATEGORIAS.map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: "1 1 120px" }}>
                <label style={{ display: "block", fontSize: 11.5, color: muted, marginBottom: 4 }}>Valor (R$)</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: ink, fontSize: 12.5, pointerEvents: "none" }}>R$</span>
                  <input type="text" inputMode="numeric" value={novaDepesa.valor ? formatCurrencyDigits(novaDepesa.valor) : ""}
                    onChange={(e) => setNovaDepesa({ ...novaDepesa, valor: parseCurrencyInput(e.target.value) })}
                    placeholder="0,00"
                    style={{ width: "100%", padding: "8px 10px 8px 30px", borderRadius: 6, border: `1px solid ${line}`, fontSize: 13, background: card, color: ink }} />
                </div>
              </div>
              <button onClick={handleAddDespesa} disabled={savingDespesa}
                style={{ background: "#2F8F5E", color: "#fff", border: "none", borderRadius: 6, padding: "9px 16px", fontSize: 12.5, fontWeight: 600, cursor: savingDespesa ? "default" : "pointer", opacity: savingDespesa ? 0.7 : 1 }}>
                {savingDespesa ? "Salvando..." : "Salvar"}
              </button>
            </div>
          )}

          {loadingDespesas ? (
            <div>{[0, 1, 2].map((i) => <SkeletonRow key={i} />)}</div>
          ) : despesas.length === 0 ? (
            <p style={{ padding: 20, color: muted, fontSize: 13 }}>Nenhuma despesa extra lançada.</p>
          ) : (
            <div>
              {despesas.map((d) => {
                const catLabel = DESPESA_CATEGORIAS.find(([val]) => val === d.categoria)?.[1] || d.categoria;
                return (
                  <div key={d.id} className="vp-row-hover" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: `1px solid ${line}`, flexWrap: "wrap", rowGap: 8, gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <div style={{ fontWeight: 600, color: ink, fontSize: 13.5, wordBreak: "break-word" }}>{d.descricao}</div>
                      <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>
                        {catLabel} · {d.data ? new Date(d.data + "T00:00:00").toLocaleDateString("pt-BR") : ""}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
                      <span style={{ fontWeight: 700, color: danger, fontSize: 13.5 }}>{formatBRL(d.valor)}</span>
                      <button onClick={() => setConfirmDespesaId(d.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", opacity: 0.7, display: "flex", color: danger }}
                        title="Remover despesa"><Trash2 size={15} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ background: card, border: `1px solid ${line}`, borderRadius: 12, overflow: "hidden" }}>
          <h3 style={{ margin: 0, padding: "16px 20px", fontSize: 14, fontWeight: 700, color: ink, borderBottom: `1px solid ${line}` }}>
            Pendências de pagamento
          </h3>
          {pendentesList.length === 0 ? (
            <p style={{ padding: 20, color: muted, fontSize: 13 }}>Nenhuma pendência — tudo em dia! 🎉</p>
          ) : (
            <div>
              {pendentesList.map((f) => {
                const st = paymentStatus(f);
                const falta = (Number(f.valor_cobrado) || 0) - (Number(f.valor_recebido) || 0);
                return (
                  <div key={f.id} onClick={() => onOpenFicha(f)} className="vp-row-hover"
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px",
                      borderBottom: `1px solid ${line}`, cursor: "pointer" }}>
                    <div>
                      <div style={{ fontWeight: 600, color: ink, fontSize: 13.5 }}>{f.nome}</div>
                      <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>
                        Cobrado {formatBRL(f.valor_cobrado)} · Falta {formatBRL(falta)}
                      </div>
                    </div>
                    <span style={{ fontSize: 10, textTransform: "uppercase", padding: "3px 10px", borderRadius: 20, fontWeight: 700, color: "#fff", background: PAYMENT_STATUS_COLORS[st] }}>
                      {PAYMENT_STATUS_LABELS[st]}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ background: card, border: `1px solid ${line}`, borderRadius: 12, overflow: "hidden", marginTop: 20 }}>
          <h3 style={{ margin: 0, padding: "16px 20px", fontSize: 14, fontWeight: 700, color: ink, borderBottom: `1px solid ${line}`, display: "flex", alignItems: "center", gap: 8 }}>
            <Map size={15} /> Cadista
          </h3>
          {cadistaList.length === 0 ? (
            <p style={{ padding: 20, color: muted, fontSize: 13 }}>Nenhuma ficha ativa no momento.</p>
          ) : (
            <div>
              {cadistaList.map((f) => (
                <div key={f.id} onClick={() => setCadistaEditing(f)} className="vp-row-hover"
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px",
                    borderBottom: `1px solid ${line}`, cursor: "pointer" }}>
                  <div>
                    <div style={{ fontWeight: 600, color: ink, fontSize: 13.5 }}>{f.nome}</div>
                    <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>
                      {f.cadista_nome ? `Cadista: ${f.cadista_nome}` : "Sem cadista definido"}
                      {f.cadista_valor ? ` · ${formatBRL(f.cadista_valor)}` : ""}
                    </div>
                  </div>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: brand }}>Editar ›</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {cadistaEditing && (
        <CadistaModal
          record={cadistaEditing}
          saving={savingCadista}
          onCancel={() => setCadistaEditing(null)}
          onSave={handleSaveCadista}
        />
      )}

      {confirmDespesaId && (
        <ConfirmModal
          title="Remover despesa"
          message="Remover esta despesa? Essa ação não pode ser desfeita."
          confirmLabel="Remover"
          onCancel={() => setConfirmDespesaId(null)}
          onConfirm={() => handleRemoveDespesa(confirmDespesaId)}
        />
      )}
    </div>
  );
}

function CadistaModal({ record, saving, onCancel, onSave }) {
  const [values, setValues] = useState(() => {
    const v = {};
    CADISTA_FIELDS.forEach((f) => { v[f.id] = record[f.id] || ""; });
    return v;
  });

  const setField = (id, val) => setValues((prev) => ({ ...prev, [id]: val }));

  const handleSubmit = () => {
    onSave({ ...record, ...values });
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 30 }}>
      <div className="vp-modal-in" style={{ background: card, borderRadius: 12, padding: 22, maxWidth: 420, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
        <h3 style={{ fontSize: 16, marginBottom: 2, fontWeight: 700, color: ink }}>Cadista</h3>
        <p style={{ color: muted, fontSize: 12.5, marginBottom: 16 }}>Ficha de <strong>{record.nome}</strong></p>
        <div style={{ display: "grid", gap: 14, marginBottom: 20 }}>
          {CADISTA_FIELDS.map((f) => (
            <FieldInput key={f.id} field={f} value={values[f.id]} accent="#8F631F" onChange={(val) => setField(f.id, val)} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} disabled={saving}
            style={{ flex: 1, background: card, border: `1.5px solid ${line}`, color: ink, padding: 9, fontWeight: 600, borderRadius: 8, cursor: "pointer" }}>
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={saving}
            style={{ flex: 1, background: brand, color: "#fff", padding: 9, fontWeight: 600, borderRadius: 8, border: "none", cursor: "pointer" }}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, format, color, tint, Icon, highlight }) {
  return (
    <div className="vp-stat-card" style={{
      background: `linear-gradient(135deg, ${tint}, ${card} 60%)`,
      border: `1.5px solid ${highlight ? color : line}`, borderRadius: 14, padding: "16px 18px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: 14,
    }}>
      {Icon && (
        <div style={{ width: 40, height: 40, borderRadius: 11, background: color, color: "#fff", display: "flex",
          alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={19} />
        </div>
      )}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="vp-money-value" style={{ color }}><CountUp value={value} format={format} /></div>
        <div style={{ fontSize: 11, color: muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.3, marginTop: 4 }}>{label}</div>
      </div>
    </div>
  );
}
