import { Layers, AlertTriangle, CheckCircle2 } from "lucide-react";
import { THEME, STATUS_COLORS, STATUS_LABELS } from "../config/sections";
import CountUp from "./CountUp";

const { brand, danger, muted, teal, line, ink, card, brandTint, dangerTint, tealTint } = THEME;

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

  const cards = [
    { label: "Fichas ativas", value: ativas.length, color: brand, tint: brandTint, Icon: Layers },
    { label: "Prazos vencidos", value: vencidas, color: vencidas > 0 ? danger : muted, tint: vencidas > 0 ? dangerTint : "transparent", Icon: AlertTriangle, highlight: vencidas > 0 },
    { label: "Concluídas", value: concluidas, color: teal, tint: tealTint, Icon: CheckCircle2 },
  ];

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 14 }}>
        {cards.map((c) => (
          <div key={c.label} className="vp-stat-card" style={{
            background: `linear-gradient(135deg, ${c.tint}, ${card})`,
            border: `1.5px solid ${c.highlight ? danger : line}`,
            borderRadius: 14, padding: "16px 18px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
            display: "flex", alignItems: "center", gap: 14,
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: c.color, color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              boxShadow: `0 4px 12px ${c.tint}` }}>
              <c.Icon size={21} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: c.color, lineHeight: 1 }}><CountUp value={c.value} /></div>
              <div style={{ fontSize: 11.5, color: muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.3, marginTop: 4 }}>{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {Object.entries(porSituacao).map(([status, count]) => (
          <div key={status} style={{
            display: "flex", alignItems: "center", gap: 6, background: card, border: `1px solid ${line}`,
            borderRadius: 20, padding: "5px 12px", fontSize: 12,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_COLORS[status] || muted }} />
            <span style={{ color: ink }}>{STATUS_LABELS[status] || status}</span>
            <strong style={{ color: ink }}>{count}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
