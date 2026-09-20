import { useState } from "react";
import { Plus, X } from "lucide-react";
import { THEME } from "../config/sections";
import { formatBRL } from "../utils/finance";
import { formatCurrencyDigits, parseCurrencyInput } from "../utils/masks";
import { FieldLabel } from "./FieldInput";

const { ink, muted, line, bg, card, brand, danger } = THEME;

export default function PagamentosField({ pagamentos, onChange }) {
  const [valor, setValor] = useState(0);
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const list = pagamentos || [];

  const add = () => {
    if (!valor || valor <= 0) return;
    onChange([...list, { valor, data }]);
    setValor(0);
  };
  const remove = (idx) => {
    onChange(list.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <FieldLabel>Pagamentos realizados</FieldLabel>

      {list.length > 0 && (
        <div style={{ display: "grid", gap: 6, marginBottom: 10 }}>
          {list.map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: bg, borderRadius: 6, padding: "7px 10px", fontSize: 12.5 }}>
              <span style={{ color: ink }}>
                <strong>{formatBRL(p.valor)}</strong>
                <span style={{ color: muted }}> · {p.data ? new Date(p.data + "T00:00:00").toLocaleDateString("pt-BR") : ""}</span>
              </span>
              <button onClick={() => remove(i)} style={{ background: "none", border: "none", color: danger, cursor: "pointer", display: "flex" }}><X size={13} /></button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ flex: "1 1 130px" }}>
          <label style={{ fontSize: 10.5, color: muted, display: "block", marginBottom: 4 }}>Valor (R$)</label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: ink, fontSize: 12.5, pointerEvents: "none" }}>R$</span>
            <input type="text" inputMode="numeric" value={valor ? formatCurrencyDigits(valor) : ""} placeholder="0,00"
              onChange={(e) => setValor(parseCurrencyInput(e.target.value))}
              style={{ width: "100%", padding: "8px 10px 8px 30px", border: `1.5px solid ${line}`, borderRadius: 8, fontSize: 13, background: card, color: ink }} />
          </div>
        </div>
        <div style={{ flex: "1 1 140px" }}>
          <label style={{ fontSize: 10.5, color: muted, display: "block", marginBottom: 4 }}>Data</label>
          <input type="date" value={data} onChange={(e) => setData(e.target.value)}
            style={{ width: "100%", padding: "8px 10px", border: `1.5px solid ${line}`, borderRadius: 8, fontSize: 13, background: card, color: ink }} />
        </div>
        <button onClick={add} type="button"
          style={{ background: brand, color: "#fff", border: "none", borderRadius: 8, padding: "9px 14px", fontWeight: 600, fontSize: 12.5, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <Plus size={14} /> Adicionar
        </button>
      </div>
    </div>
  );
}
