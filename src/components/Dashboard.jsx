import { Layers, AlertTriangle, CheckCircle2, Wallet, PartyPopper } from "lucide-react";
import { THEME, STATUS_COLORS, STATUS_LABELS } from "../config/sections";
import { formatBRL } from "../utils/finance";
import CountUp from "./CountUp";
import Tilt from "./Tilt";

const { muted, ink, card, line } = THEME;

export default function Dashboard({ fichas }) {
  const today = new Date().toISOString().slice(0, 10);
  const ativas = fichas.filter((f) => !f.arquivado);

  const porSituacao = {};
  ativas.forEach((f) => {
    const s = f.situacao_atendimento || "aguardando_documentos";
    porSituacao[s] = (porSituacao[s] || 0) + 1;
  });

  const vencidas = ativas.filter((f) => f.prazo_atendimento && f.prazo_atendimento < today && f.situacao_atendimento !== "concluido").length;
  const concluidas = ativas.filter((f) => f.situacao_atendimento === "concluido").length;
  const aReceber = ativas.reduce((sum, f) => sum + Math.max((Number(f.valor_cobrado) || 0) - (Number(f.valor_recebido) || 0), 0), 0);

  const cards = [
    { label: "Fichas ativas", value: ativas.length, grad: "linear-gradient(135deg, #047857, #34D399)", glow: "rgba(16,185,129,0.45)", Icon: Layers },
    vencidas > 0
      ? { label: "Prazos vencidos", value: vencidas, grad: "linear-gradient(135deg, #B91C1C, #FB7185)", glow: "rgba(244,63,94,0.5)", Icon: AlertTriangle, alert: true }
      : { label: "Prazos em dia", value: 0, grad: "linear-gradient(135deg, #0F766E, #5EEAD4)", glow: "rgba(20,184,166,0.4)", Icon: PartyPopper, note: "Nenhum atraso" },
    { label: "Concluídas", value: concluidas, grad: "linear-gradient(135deg, #0369A1, #22D3EE)", glow: "rgba(34,211,238,0.45)", Icon: CheckCircle2 },
    { label: "A receber", value: aReceber, grad: "linear-gradient(135deg, #B45309, #FBBF24)", glow: "rgba(251,191,36,0.5)", Icon: Wallet, money: true },
  ];

  const total = ativas.length;
  const segmentos = Object.entries(porSituacao).sort((a, b) => b[1] - a[1]);

  return (
    <div style={{ marginBottom: 20 }}>
      <div className="vp-stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14, marginBottom: 16 }}>
        {cards.map((c) => (
          <Tilt key={c.label} max={10} className={`vp-stat-card vp-stat-solid ${c.alert ? "vp-pulse" : ""}`}
            style={{ background: c.grad, borderRadius: 22, padding: "20px 22px", color: "#fff", "--glow": c.glow }}>
            <c.Icon size={92} className="vp-stat-ghost" strokeWidth={1.4} />
            <div className="vp-stat-icon vp-stat-glass"><c.Icon size={20} /></div>
            <div className={`vp-stat-number ${c.money ? "vp-stat-money" : ""}`}>
              <CountUp value={c.value} format={c.money ? formatBRL : undefined} />
            </div>
            <div className="vp-stat-label">{c.label}</div>
            {c.note && <div className="vp-stat-note">{c.note}</div>}
          </Tilt>
        ))}
      </div>

      {total > 0 && (
        <div className="vp-panel vp-rise" style={{ background: card, border: `1px solid ${line}`, borderRadius: 20, padding: "16px 20px", "--i": 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
            <strong style={{ fontSize: 13.5, color: ink, fontFamily: "var(--vp-font-heading)" }}>Andamento das fichas</strong>
            <span style={{ fontSize: 12, color: muted }}>{total} ativa{total !== 1 ? "s" : ""}</span>
          </div>
          <div className="vp-pipeline">
            {segmentos.map(([status, count]) => (
              <div key={status} className="vp-pipeline-seg" title={`${STATUS_LABELS[status] || status}: ${count}`}
                style={{ flex: count, background: STATUS_COLORS[status] || muted }}>
                {count}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginTop: 12 }}>
            {segmentos.map(([status, count]) => (
              <span key={status} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: ink }}>
                <span style={{ width: 9, height: 9, borderRadius: 3, background: STATUS_COLORS[status] || muted }} />
                {STATUS_LABELS[status] || status}
                <strong style={{ color: muted, fontWeight: 600 }}>{Math.round((count / total) * 100)}%</strong>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
