import { useState } from "react";
import { Download, Receipt, X, Loader2 } from "lucide-react";
import { THEME } from "../config/sections";
import { FieldLabel } from "./FieldInput";
import { formatCurrencyDigits, parseCurrencyInput } from "../utils/masks";
import { generateReciboWord } from "../utils/word";

export default function ReciboModal({ ficha, onClose }) {
  const { ink, muted, line, brand, card, bg } = THEME;
  const [data, setData] = useState(() => ({
    nome_cliente: ficha.nome || "",
    valor: Number(ficha.valor_recebido) || 0,
    servico: "",
    nome_fazenda: ficha.nome_imovel || "",
    area: ficha.area_aproximada || "",
    matricula: ficha.matricula || "",
    data: new Date().toISOString().slice(0, 10),
    cidade: ficha.municipio_uf ? ficha.municipio_uf.split("/")[0] : "",
  }));

  const [generating, setGenerating] = useState(false);
  const handleChange = (field, value) => setData((prev) => ({ ...prev, [field]: value }));

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await generateReciboWord(data);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Não foi possível gerar o recibo. Se o site foi atualizado recentemente, tente recarregar a página (puxe pra baixo ou aperte F5) e tente de novo.");
    } finally {
      setGenerating(false);
    }
  };

  const highlightStyle = { width: "100%", padding: 10, border: `1.5px solid ${line}`, borderRadius: 8, outline: "none", background: "#FFFFCC", color: "#3a3200" };
  const normalStyle = { width: "100%", padding: 10, border: `1.5px solid ${line}`, borderRadius: 8, outline: "none", background: card, color: ink };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 30 }}>
      <div className="vp-modal-in" style={{ background: card, borderRadius: 14, padding: 0, maxWidth: 560, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 24px", borderBottom: `1px solid ${line}` }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: "#1E8F5F", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Receipt size={19} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: ink, margin: 0 }}>Gerar Recibo de Pagamento</h3>
            <p style={{ color: muted, fontSize: 12, margin: "2px 0 0" }}>Ficha de {ficha.nome}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: muted, cursor: "pointer", display: "flex" }}><X size={18} /></button>
        </div>

        <div style={{ padding: "18px 24px 24px" }}>
          <div style={{ background: bg, border: `1px solid ${line}`, borderRadius: 8, padding: "10px 12px", fontSize: 12, color: muted, marginBottom: 18 }}>
            Os campos destacados em <span style={{ background: "#FFFFCC", color: "#3a3200", padding: "2px 4px", borderRadius: 3 }}>amarelo</span> preenchem o corpo do recibo automaticamente.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <FieldLabel>Nome do cliente *</FieldLabel>
              <input type="text" value={data.nome_cliente} onChange={(e) => handleChange("nome_cliente", e.target.value)} style={normalStyle} />
            </div>

            <div>
              <FieldLabel>Valor (R$) *</FieldLabel>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#3a3200", fontSize: 13, pointerEvents: "none" }}>R$</span>
                <input type="text" inputMode="numeric" value={data.valor ? formatCurrencyDigits(data.valor) : ""} placeholder="0,00"
                  onChange={(e) => handleChange("valor", parseCurrencyInput(e.target.value))}
                  style={{ ...highlightStyle, paddingLeft: 32 }} />
              </div>
            </div>

            <div>
              <FieldLabel>Data *</FieldLabel>
              <input type="date" value={data.data} onChange={(e) => handleChange("data", e.target.value)} style={normalStyle} />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <FieldLabel>Serviço *</FieldLabel>
              <textarea value={data.servico} onChange={(e) => handleChange("servico", e.target.value)} rows={2} style={{ ...highlightStyle, resize: "none" }} />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <FieldLabel>Nome da Fazenda *</FieldLabel>
              <input type="text" value={data.nome_fazenda} onChange={(e) => handleChange("nome_fazenda", e.target.value)} style={highlightStyle} />
            </div>

            <div>
              <FieldLabel>Área Total (ha) *</FieldLabel>
              <input type="text" value={data.area} onChange={(e) => handleChange("area", e.target.value)} style={highlightStyle} />
            </div>

            <div>
              <FieldLabel>Matrícula nº *</FieldLabel>
              <input type="text" value={data.matricula} onChange={(e) => handleChange("matricula", e.target.value)} style={highlightStyle} />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <FieldLabel>Cidade/UF</FieldLabel>
              <input type="text" value={data.cidade} onChange={(e) => handleChange("cidade", e.target.value)} style={normalStyle} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} disabled={generating}
              style={{ flex: 1, background: card, border: `1.5px solid ${line}`, color: ink, padding: 10, fontWeight: 600, borderRadius: 8, cursor: generating ? "default" : "pointer", opacity: generating ? 0.6 : 1 }}>
              Cancelar
            </button>
            <button onClick={handleGenerate} disabled={generating}
              style={{ flex: 1, background: brand, color: "#fff", padding: 10, fontWeight: 700, borderRadius: 8, border: "none", cursor: generating ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "0 4px 12px rgba(31,111,74,0.3)", opacity: generating ? 0.85 : 1 }}>
              {generating ? <><Loader2 size={15} className="vp-spin-icon" /> Gerando...</> : <><Download size={15} /> Gerar PDF</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
