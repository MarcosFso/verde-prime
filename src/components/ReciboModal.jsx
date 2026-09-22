import { useState } from "react";
import { Download, Receipt, X, Loader2, Plus, Trash2, MapPin } from "lucide-react";
import { THEME } from "../config/sections";
import { FieldLabel } from "./FieldInput";
import { formatCurrencyDigits, parseCurrencyInput } from "../utils/masks";
import { valorEmPalavras } from "../utils/extenso";
import { generateReciboWord } from "../utils/word";

const SERVICOS_PADRAO = "desmembramento, Cadastro Ambiental Rural – CAR";
const COMPLEMENTO_PADRAO = "bem como ajustamento de áreas";
const RELACAO_SINGULAR = "relacionado ao seguinte imóvel rural:";
const RELACAO_PLURAL = "relacionados aos seguintes imóveis rurais:";

// Acima disso a lista passa por cima do rodapé e o recibo sairia cortado.
const MAX_IMOVEIS = 12;

export default function ReciboModal({ ficha, onClose }) {
  const { ink, muted, line, brand, card, bg } = THEME;
  const [data, setData] = useState(() => ({
    nome_cliente: ficha.nome || "",
    valor: Number(ficha.valor_recebido) || 0,
    servicos: SERVICOS_PADRAO,
    complemento: COMPLEMENTO_PADRAO,
    relacao: RELACAO_SINGULAR,
    imoveis: [{ nome: ficha.nome_imovel || "", matricula: ficha.matricula || "" }],
    data: new Date().toISOString().slice(0, 10),
  }));

  // Enquanto ele não escrever essa frase à mão, ela acompanha a quantidade de imóveis.
  const [relacaoEditada, setRelacaoEditada] = useState(false);

  const [generating, setGenerating] = useState(false);
  const handleChange = (field, value) => setData((prev) => ({ ...prev, [field]: value }));

  const handleImovel = (index, field, value) =>
    setData((prev) => ({
      ...prev,
      imoveis: prev.imoveis.map((im, i) => (i === index ? { ...im, [field]: value } : im)),
    }));

  // Ao mudar a quantidade de imóveis, a frase vai pro singular ou pro plural
  // sozinha — a menos que ele já tenha escrito a dele.
  const relacaoPara = (quantidade, prev) =>
    relacaoEditada ? prev.relacao : quantidade > 1 ? RELACAO_PLURAL : RELACAO_SINGULAR;

  const addImovel = () =>
    setData((prev) => {
      if (prev.imoveis.length >= MAX_IMOVEIS) return prev;
      const imoveis = [...prev.imoveis, { nome: "", matricula: "" }];
      return { ...prev, imoveis, relacao: relacaoPara(imoveis.length, prev) };
    });

  const removeImovel = (index) =>
    setData((prev) => {
      const imoveis = prev.imoveis.filter((_, i) => i !== index);
      return { ...prev, imoveis, relacao: relacaoPara(imoveis.length, prev) };
    });

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await generateReciboWord(data);
      onClose();
    } catch (err) {
      console.error(err);
      alert(
        err?.message ||
          "Não foi possível gerar o recibo. Se o site foi atualizado recentemente, tente recarregar a página (puxe pra baixo ou aperte F5) e tente de novo."
      );
    } finally {
      setGenerating(false);
    }
  };

  const inputStyle = { width: "100%", padding: 10, border: `1.5px solid ${line}`, borderRadius: 8, outline: "none", background: card, color: ink };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 30 }}>
      <div className="vp-modal-in" style={{ background: card, borderRadius: 14, padding: 0, maxWidth: 560, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 24px", borderBottom: `1px solid ${line}` }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: "#1E8F5F", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Receipt size={19} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: ink, margin: 0 }}>Gerar Recibo de Prestação de Serviços</h3>
            <p style={{ color: muted, fontSize: 12, margin: "2px 0 0" }}>Ficha de {ficha.nome}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: muted, cursor: "pointer", display: "flex" }}><X size={18} /></button>
        </div>

        <div style={{ padding: "18px 24px 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <FieldLabel>Nome do cliente *</FieldLabel>
              <input type="text" value={data.nome_cliente} onChange={(e) => handleChange("nome_cliente", e.target.value)} style={inputStyle} />
            </div>

            <div>
              <FieldLabel>Valor (R$) *</FieldLabel>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: muted, fontSize: 13, pointerEvents: "none" }}>R$</span>
                <input type="text" inputMode="numeric" value={data.valor ? formatCurrencyDigits(data.valor) : ""} placeholder="0,00"
                  onChange={(e) => handleChange("valor", parseCurrencyInput(e.target.value))}
                  style={{ ...inputStyle, paddingLeft: 32 }} />
              </div>
              {data.valor > 0 && (
                <p style={{ color: muted, fontSize: 11, margin: "5px 0 0", fontStyle: "italic" }}>
                  ({valorEmPalavras(data.valor)})
                </p>
              )}
            </div>

            <div>
              <FieldLabel>Data *</FieldLabel>
              <input type="date" value={data.data} onChange={(e) => handleChange("data", e.target.value)} style={inputStyle} />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <FieldLabel>Serviços prestados *</FieldLabel>
              <textarea value={data.servicos} onChange={(e) => handleChange("servicos", e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <FieldLabel>Complemento</FieldLabel>
              <input type="text" value={data.complemento} placeholder="bem como ajustamento de áreas"
                onChange={(e) => handleChange("complemento", e.target.value)} style={inputStyle} />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <FieldLabel>Frase de ligação</FieldLabel>
              <input type="text" value={data.relacao}
                onChange={(e) => { setRelacaoEditada(true); handleChange("relacao", e.target.value); }}
                style={inputStyle} />
              <p style={{ color: muted, fontSize: 11, margin: "5px 0 0" }}>
                Vem no singular ou no plural conforme a quantidade de imóveis, mas você pode reescrever.
              </p>
            </div>

            <div style={{ gridColumn: "1 / -1", background: bg, border: `1px solid ${line}`, borderRadius: 8, padding: "10px 12px" }}>
              <p style={{ color: muted, fontSize: 11, margin: "0 0 5px", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>
                Como vai sair no recibo
              </p>
              <p style={{ color: ink, fontSize: 12, margin: 0, lineHeight: 1.6 }}>
                referente à <strong>prestação de serviços técnicos para {data.servicos || "..."}</strong>
                {data.complemento.trim() ? `, ${data.complemento.trim()}` : ""}{" "}
                {data.relacao}
              </p>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <FieldLabel>Imóveis rurais *</FieldLabel>
              <button onClick={addImovel} type="button"
                disabled={data.imoveis.length >= MAX_IMOVEIS}
                title={data.imoveis.length >= MAX_IMOVEIS ? `Cabem até ${MAX_IMOVEIS} imóveis em uma página` : "Adicionar outro imóvel"}
                style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: `1.5px solid ${line}`, color: brand, fontSize: 12, fontWeight: 600, padding: "5px 10px", borderRadius: 7, cursor: data.imoveis.length >= MAX_IMOVEIS ? "default" : "pointer", opacity: data.imoveis.length >= MAX_IMOVEIS ? 0.4 : 1 }}>
                <Plus size={13} /> Adicionar
              </button>
            </div>

            {data.imoveis.map((imovel, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8 }}>
                <input type="text" value={imovel.nome} placeholder="Nome da fazenda"
                  onChange={(e) => handleImovel(i, "nome", e.target.value)}
                  style={{ ...inputStyle, flex: 2 }} />
                <input type="text" value={imovel.matricula} placeholder="Matrícula nº"
                  onChange={(e) => handleImovel(i, "matricula", e.target.value)}
                  style={{ ...inputStyle, flex: 1 }} />
                <button onClick={() => removeImovel(i)} type="button"
                  disabled={data.imoveis.length === 1}
                  title={data.imoveis.length === 1 ? "O recibo precisa de pelo menos um imóvel" : "Remover"}
                  style={{ background: "none", border: "none", color: muted, cursor: data.imoveis.length === 1 ? "default" : "pointer", opacity: data.imoveis.length === 1 ? 0.3 : 1, padding: 10, display: "flex", flexShrink: 0 }}>
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, background: bg, border: `1px solid ${line}`, borderRadius: 8, padding: "10px 12px", fontSize: 12, color: muted, marginBottom: 18 }}>
            <MapPin size={14} style={{ flexShrink: 0 }} />
            <span>O recibo é sempre emitido em <strong style={{ color: ink }}>Formoso/MG</strong>, com a assinatura da Verde Prime e o Pix no rodapé.</span>
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
