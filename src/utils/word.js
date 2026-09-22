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
  const { nome_cliente, valor, servicos, complemento, relacao, imoveis, data } = formData;

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

  const complementoTexto = (complemento || "").trim() ? `, ${esc(complemento.trim())}` : "";

  // Cada imóvel numa linha com marcador: • NOME DA FAZENDA – Matrícula nº 00.000;
  const linhasImoveis = imoveisValidos
    .map((im) => {
      const nome = `<span class="b">${esc(im.nome.trim().toUpperCase())}</span>`;
      const matricula = (im.matricula || "").trim();
      const complementoImovel = matricula
        ? ` – Matrícula nº <span class="b">${esc(matricula)}</span>`
        : "";
      return `<p class="imovel"><span class="marcador">•</span>${nome}${complementoImovel};</p>`;
    })
    .join("");

  // Medidas tiradas do modelo em Word do cliente: A4, margens de 30mm, Arial 12pt
  // para tudo (inclusive o título), entrelinha 1,15 e uma linha em branco entre
  // parágrafos. Layout em fluxo com posicionamento absoluto só para as imagens de
  // fundo/rodapé — flexbox e background-attachment renderizam errado no html2canvas.
  const html = `
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }

          /* O modelo do cliente usa Courier New 12pt: confirmado pelas medidas da
             fonte embutida no PDF dele (monoespaçada, panose 2 7 3 9, 2048 und/em). */
          body {
            font-family: "Courier New", Courier, monospace;
            font-size: 12pt;
            line-height: 1.15;
            color: #4D4D4F;
          }

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
            margin-top: 18mm;
          }
          .separator img {
            width: 100%;
            height: auto;
            display: block;
          }

          .content {
            position: relative;
            z-index: 1;
            /* Margens do modelo: 30mm à esquerda e 17.4mm à direita, o que dá
               exatamente 64 caracteres por linha em Courier New 12pt. */
            padding: 5mm 17.4mm 0 30mm;
          }

          /* Uma linha em branco entre parágrafos, como no modelo. */
          p { margin: 0 0 13.8pt; text-align: justify; }

          .title {
            text-align: center;
            font-weight: bold;
            margin-bottom: 41.4pt;
          }

          .b { font-weight: bold; }

          /* Valor e data ficam à esquerda no modelo, não centralizados. */
          .valor, .local { font-weight: bold; text-align: left; }

          .imoveis {
            margin: 0 0 13.8pt 12.7mm;
          }
          /* Recuo pendurado: se o nome for longo e quebrar, a segunda linha
             alinha com o texto, não com o marcador. */
          .imoveis .imovel {
            margin: 0;
            text-align: left;
            padding-left: 7.2mm;
            text-indent: -7.2mm;
          }
          .marcador {
            display: inline-block;
            width: 7.2mm;
            text-indent: 0;
          }

          .signature {
            text-align: center;
            margin-top: 41.4pt;
          }
          .signature p { margin: 0; text-align: center; }

          .pix { margin-top: 27.6pt; }
          .pix p { margin: 0; text-align: left; }

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
            <p class="title">RECIBO DE PRESTAÇÃO DE SERVIÇOS</p>

            <p><span class="b">VERDE PRIME CONSULTORIA AMBIENTAL</span>, declara, para os devidos fins, que recebeu de <span class="b">${esc(nome_cliente)}</span>, a importância de:</p>

            <p class="valor">R$ ${formatCurrencyDigits(valor)} (${valorEmPalavras(valor)})</p>

            <p>referente à <span class="b">prestação de serviços técnicos para ${esc(servicos)}</span>${complementoTexto} ${esc(relacao || "relacionados aos seguintes imóveis rurais:")}</p>

            <div class="imoveis">${linhasImoveis}</div>

            <p>O valor acima foi <span class="b">integralmente recebido</span>, dando-se quitação referente aos serviços descritos neste recibo.</p>

            <p class="local">${CIDADE}, ${dia} de ${mes} de ${ano}.</p>

            <div class="signature">
              <p>VERDE PRIME CONSULTORIA AMBIENTAL</p>
              <p>MARCOS DIVINO RIBEIRO DE ARAÚJO</p>
              <p>ENGENHEIRO AMBIENTAL</p>
              <p>CREA-MG nº 142371881-0</p>
            </div>

            <div class="pix">
              <p>Pix:</p>
              <p>38 999738654</p>
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
