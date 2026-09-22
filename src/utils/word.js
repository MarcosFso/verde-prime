import bgImg from "../assets/recibo_bg.png";
import separadorImg from "../assets/recibo_separador.png";
import rodapeImg from "../assets/recibo_rodape.png";
import { formatCurrencyDigits } from "./masks";
import { valorEmPalavras } from "./extenso";

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

// A sede da Verde Prime não muda, então a cidade do recibo é fixa.
const CIDADE = "Formoso/MG";

/** Evita que um texto digitado pelo usuário quebre o HTML do recibo. */
function esc(texto) {
  return String(texto ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function generateReciboWord(formData) {
  const { nome_cliente, valor, servicos, imoveis, data } = formData;

  const imoveisValidos = (imoveis || []).filter((im) => (im.nome || "").trim());

  if (!nome_cliente || !valor || !servicos || !data) {
    throw new Error("Preencha o nome do cliente, o valor, os serviços e a data.");
  }
  if (!imoveisValidos.length) {
    throw new Error("Informe pelo menos um imóvel rural.");
  }

  const dataObj = new Date(data + "T00:00:00");
  const dia = String(dataObj.getDate()).padStart(2, "0");
  const mes = MESES[dataObj.getMonth()];
  const ano = dataObj.getFullYear();

  const linhasImoveis = imoveisValidos
    .map((im) => {
      const matricula = (im.matricula || "").trim();
      const complemento = matricula ? ` – Matrícula nº <span class="bold">${esc(matricula)}</span>` : "";
      return `<div class="imovel"><span class="bold">${esc(im.nome.trim().toUpperCase())}</span>${complemento};</div>`;
    })
    .join("");

  // Layout com posicionamento absoluto (nada de flexbox ou background-attachment:fixed,
  // que renderizam de forma inconsistente na conversão para PDF via html2canvas).
  const html = `
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; color: #333; }

          .page {
            width: 210mm;
            height: 297mm;
            position: relative;
            overflow: hidden;
            background: #fff;
          }

          .bg {
            position: absolute;
            top: 0;
            left: 0;
            width: 210mm;
            height: 297mm;
            object-fit: cover;
            object-position: center top;
            z-index: 0;
          }

          .separator {
            position: relative;
            z-index: 1;
            width: 100%;
            margin-top: 80px;
          }
          .separator img {
            width: 100%;
            height: auto;
            display: block;
          }

          .content {
            position: relative;
            z-index: 1;
            padding: 55px 50px 0 50px;
            line-height: 1.8;
          }

          .title {
            text-align: center;
            font-size: 22px;
            font-weight: bold;
            margin-bottom: 34px;
            letter-spacing: 1px;
            color: #000;
          }

          .text {
            font-size: 12px;
            margin: 14px 0;
            color: #000;
            text-align: justify;
            line-height: 1.8;
          }

          .valor {
            font-size: 14px;
            font-weight: bold;
            text-align: center;
            color: #000;
            margin: 22px 0;
          }

          .imoveis {
            margin: 16px 0 16px 28px;
          }
          .imovel {
            font-size: 12px;
            color: #000;
            line-height: 2;
          }

          .bold { font-weight: bold; }
          .center { text-align: center; }

          .signature {
            margin-top: 46px;
            text-align: center;
          }

          .line {
            border-top: 1.5px solid #333;
            width: 300px;
            margin: 0 auto 6px;
          }

          .sig-name {
            font-size: 12px;
            font-weight: bold;
            margin: 0;
            line-height: 1.6;
          }

          .footer {
            position: absolute;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100%;
            z-index: 1;
            background: #fff;
          }
          .footer img {
            width: 100%;
            height: auto;
            display: block;
          }
        </style>
      </head>
      <body>
        <div class="page">
          <img class="bg" src="${bgImg}" alt="" />

          <div class="separator">
            <img src="${separadorImg}" alt="Separador">
          </div>

          <div class="content">
            <div class="title">RECIBO DE PRESTAÇÃO DE SERVIÇOS</div>

            <div class="text">&nbsp;&nbsp;&nbsp;&nbsp;<span class="bold">VERDE PRIME CONSULTORIA AMBIENTAL</span>, declara, para os devidos fins, que recebeu de <span class="bold">${esc(nome_cliente)}</span>, a importância de:</div>

            <div class="valor">R$ ${formatCurrencyDigits(valor)} (${valorEmPalavras(valor)})</div>

            <div class="text">referente à prestação de serviços técnicos para <span class="bold">${esc(servicos)}</span>, relacionados aos seguintes imóveis rurais:</div>

            <div class="imoveis">${linhasImoveis}</div>

            <div class="text">&nbsp;&nbsp;&nbsp;&nbsp;O valor acima foi <span class="bold">integralmente recebido</span>, dando-se quitação referente aos serviços descritos neste recibo.</div>

            <div class="text center" style="margin-top: 34px;">${CIDADE}, ${dia} de ${mes} de ${ano}.</div>

            <div class="signature">
              <div class="line"></div>
              <div class="sig-name">VERDE PRIME CONSULTORIA AMBIENTAL</div>
              <div class="sig-name">MARCOS DIVINO RIBEIRO DE ARAÚJO</div>
              <div class="sig-name">ENGENHEIRO AMBIENTAL</div>
              <div class="sig-name">CREA-MG nº 142371881-0</div>
              <div class="sig-name">Pix: 38 999738654</div>
            </div>
          </div>

          <div class="footer">
            <img src="${rodapeImg}" alt="Contatos Verde Prime">
          </div>
        </div>
      </body>
    </html>
  `;

  const opt = {
    margin: 0,
    filename: "recibo_" + nome_cliente + "_" + data + ".pdf",
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, allowTaint: true, backgroundColor: "#ffffff" },
    jsPDF: { orientation: "portrait", unit: "mm", format: "a4", compress: false },
  };

  // Carregado só quando o usuário realmente gera um PDF, pra não pesar o carregamento inicial do site.
  const { default: html2pdf } = await import("html2pdf.js");

  // Remove eventuais páginas em branco extras causadas por arredondamento
  // entre a altura renderizada (html2canvas) e o tamanho exato da página A4.
  return html2pdf().set(opt).from(html).toPdf().get("pdf").then((pdf) => {
    while (pdf.internal.getNumberOfPages() > 1) {
      pdf.deletePage(pdf.internal.getNumberOfPages());
    }
  }).save();
}
