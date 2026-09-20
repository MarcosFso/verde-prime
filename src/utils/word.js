import bgImg from "../assets/recibo_bg.png";
import separadorImg from "../assets/recibo_separador.png";
import rodapeImg from "../assets/recibo_rodape.png";
import { formatCurrencyDigits } from "./masks";

export async function generateReciboWord(formData) {
  const { nome_cliente, valor, servico, nome_fazenda, area, matricula, data, cidade } = formData;

  if (!nome_cliente || !valor || !servico || !nome_fazenda || !area || !matricula || !data || !cidade) {
    alert("⚠️ Preencha todos os campos obrigatórios!");
    return;
  }

  // Limpar cidade - remover MG, espaços e hífens
  let cidadeLimpa = cidade.trim();
  cidadeLimpa = cidadeLimpa
    .replace(/\s*-\s*MG$/i, "")
    .replace(/\/MG$/i, "")
    .replace(/\s+MG$/i, "")
    .replace(/\s*-\s*$/i, "")
    .trim();

  const dataObj = new Date(data + "T00:00:00");
  const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const dia = String(dataObj.getDate()).padStart(2, "0");
  const mes = meses[dataObj.getMonth()];
  const ano = dataObj.getFullYear();

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
            padding: 60px 50px 0 50px;
            line-height: 1.8;
          }

          .title {
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 30px;
            letter-spacing: 1px;
            color: #000;
          }

          .text {
            font-size: 12px;
            margin: 15px 0;
            color: #000;
            text-align: justify;
            line-height: 1.8;
          }

          .bold { font-weight: bold; }
          .center { text-align: center; }

          .signature {
            margin-top: 40px;
            text-align: center;
          }

          .line {
            border-top: 2px solid #333;
            width: 300px;
            margin: 35px auto 5px;
          }

          .sig-name {
            font-size: 12px;
            font-weight: bold;
            margin: 0;
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
            <div class="title">RECIBO DE PAGAMENTO</div>

            <div class="text">&nbsp;&nbsp;&nbsp;&nbsp;<span class="bold">VERDE PRIME – CONSULTORIA AMBIENTAL</span>, neste ato representada por <span class="bold">MARCOS DIVINO RIBEIRO DE ARAÚJO</span>, <span class="bold">Engenheiro Ambiental, CREA-MG nº 142371881-0</span>, declara, para os devidos fins, que recebeu do Sr. <span class="bold">${nome_cliente}</span> a importância de <span class="bold">R$ ${formatCurrencyDigits(valor)}</span>, referente à prestação de serviços técnicos de <span class="bold">${servico}</span> da <span class="bold">${nome_fazenda}</span>, com área de <span class="bold">${area} ha</span>, matrícula nº <span class="bold">${matricula}</span>.</div>

            <div class="text">&nbsp;&nbsp;&nbsp;&nbsp;Pelo presente, a <span class="bold">VERDE PRIME – CONSULTORIA AMBIENTAL</span> declara o recebimento integral do valor acima, dando ao contratante <span class="bold">plena quitação quanto ao pagamento dos serviços descritos</span>.</div>

            <div class="text center" style="margin-top: 40px;"><span class="bold">${cidadeLimpa}/MG, ${dia} de ${mes} de ${ano}</span></div>

            <div class="signature">
              <div class="line"></div>
              <div class="sig-name">VERDE PRIME – CONSULTORIA AMBIENTAL</div>
              <div class="sig-name">MARCOS DIVINO RIBEIRO DE ARAÚJO</div>
              <div class="sig-name">Engenheiro Ambiental – CREA-MG nº 142371881-0</div>
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
