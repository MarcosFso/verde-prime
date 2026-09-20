import { SECTIONS } from "../config/sections";
import { formatCurrencyDigits } from "./masks";
import logo from "../assets/logo.png";

function fieldDisplayValue(field, record) {
  const raw = record[field.id];
  if (field.type === "checkboxGroup") {
    const arr = raw || [];
    if (!arr.length) return "—";
    return arr.map((v) => (field.options.find(([val]) => val === v) || [v, v])[1]).join(", ");
  }
  if (field.type === "select") {
    if (!raw) return "—";
    return (field.options.find(([val]) => val === raw) || [raw, raw])[1];
  }
  if (field.type === "date") {
    if (!raw) return "—";
    return new Date(raw + "T00:00:00").toLocaleDateString("pt-BR");
  }
  if (field.type === "currency") {
    return `R$ ${formatCurrencyDigits(raw || 0)}`;
  }
  if (raw === "" || raw === null || raw === undefined) return "—";
  return String(raw);
}

export async function generateFichaPDF(record) {
  const sectionsHtml = SECTIONS.map((s) => {
    const fieldsHtml = s.fields
      .map((f) => `
        <div class="field">
          <div class="field-label">${f.label.replace(/\s*\*$/, "")}</div>
          <div class="field-value">${fieldDisplayValue(f, record)}</div>
        </div>
      `)
      .join("");
    return `
      <div class="section">
        <div class="section-title" style="border-left-color:${s.accent}">${s.title}</div>
        <div class="fields-grid">${fieldsHtml}</div>
      </div>
    `;
  }).join("");

  const geradoEm = new Date().toLocaleString("pt-BR");

  const html = `
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; color: #1F2A24; }
          .page { width: 210mm; padding: 16mm 14mm; }
          .header { display: flex; align-items: center; gap: 14px; border-bottom: 2px solid #1F6F4A; padding-bottom: 12px; margin-bottom: 18px; }
          .header img { height: 46px; }
          .header h1 { font-size: 18px; color: #124430; margin: 0; }
          .header p { font-size: 11px; color: #6B7568; margin: 2px 0 0; }
          .section { margin-bottom: 14px; page-break-inside: avoid; }
          .section-title { font-size: 12.5px; font-weight: bold; background: #F6F4EC; border-left: 4px solid #1F6F4A;
            padding: 6px 10px; margin-bottom: 8px; }
          .fields-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; padding: 0 4px; }
          .field { font-size: 10.5px; padding: 3px 0; border-bottom: 1px solid #EEE; }
          .field-label { color: #6B7568; font-size: 9px; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 2px; }
          .field-value { color: #1F2A24; word-break: break-word; }
          .footer { margin-top: 20px; font-size: 9px; color: #999; text-align: right; }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header">
            <img src="${logo}" alt="Verde Prime" />
            <div>
              <h1>Ficha Técnica — ${record.nome || "Sem nome"}</h1>
              <p>Cadastro Ambiental Rural (CAR) — Verde Prime Consultoria Ambiental</p>
            </div>
          </div>
          ${sectionsHtml}
          <div class="footer">Gerado em ${geradoEm}</div>
        </div>
      </body>
    </html>
  `;

  const opt = {
    margin: 0,
    filename: `ficha_${(record.nome || "sem_nome").replace(/\s+/g, "_")}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, allowTaint: true, backgroundColor: "#ffffff" },
    jsPDF: { orientation: "portrait", unit: "mm", format: "a4", compress: true },
    pagebreak: { mode: ["css"] },
  };

  // Carregado só quando o usuário realmente gera um PDF, pra não pesar o carregamento inicial do site.
  const { default: html2pdf } = await import("html2pdf.js");
  return html2pdf().set(opt).from(html).save();
}
