const UNIDADES = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
const DEZ_A_DEZENOVE = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
const DEZENAS = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const CENTENAS = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];
const ESCALAS = [
  ["", ""],
  ["mil", "mil"],
  ["milhão", "milhões"],
  ["bilhão", "bilhões"],
];

/** Escreve um grupo de 1 a 999 em palavras. */
function grupoEmPalavras(n) {
  if (n === 100) return "cem";
  const centena = Math.floor(n / 100);
  const resto = n % 100;
  const partes = [];
  if (centena) partes.push(CENTENAS[centena]);
  if (resto < 10) {
    if (resto) partes.push(UNIDADES[resto]);
  } else if (resto < 20) {
    partes.push(DEZ_A_DEZENOVE[resto - 10]);
  } else {
    const dezena = Math.floor(resto / 10);
    const unidade = resto % 10;
    partes.push(unidade ? `${DEZENAS[dezena]} e ${UNIDADES[unidade]}` : DEZENAS[dezena]);
  }
  return partes.join(" e ");
}

/** Escreve um número inteiro em palavras, ex.: 1500 -> "mil e quinhentos". */
function numeroEmPalavras(n) {
  if (n === 0) return "zero";

  const grupos = [];
  let resto = n;
  while (resto > 0) {
    grupos.push(resto % 1000);
    resto = Math.floor(resto / 1000);
  }

  const partes = [];
  for (let i = grupos.length - 1; i >= 0; i--) {
    const valor = grupos[i];
    if (!valor) continue;
    if (i === 0) {
      partes.push({ texto: grupoEmPalavras(valor), valor });
    } else if (i === 1) {
      // "mil" e não "um mil"
      partes.push({ texto: valor === 1 ? "mil" : `${grupoEmPalavras(valor)} mil`, valor });
    } else {
      const [singular, plural] = ESCALAS[i];
      partes.push({ texto: `${grupoEmPalavras(valor)} ${valor === 1 ? singular : plural}`, valor });
    }
  }

  // O "e" só entra antes do último grupo quando ele é menor que cem
  // ou é uma centena redonda — é assim que se lê em português:
  // "mil e quinhentos", mas "mil duzentos e trinta e quatro".
  return partes.reduce((acc, parte, i) => {
    if (i === 0) return parte.texto;
    const ehUltimo = i === partes.length - 1;
    const usaE = ehUltimo && (parte.valor < 100 || parte.valor % 100 === 0);
    return acc + (usaE ? " e " : " ") + parte.texto;
  }, "");
}

/**
 * Escreve um valor em reais por extenso, para o corpo do recibo.
 * Ex.: 1500 -> "mil e quinhentos reais"; 1500.5 -> "mil e quinhentos reais e cinquenta centavos".
 */
export function valorEmPalavras(valor) {
  const centavosTotais = Math.round((Number(valor) || 0) * 100);
  const reais = Math.floor(centavosTotais / 100);
  const centavos = centavosTotais % 100;

  const partes = [];
  if (reais > 0) {
    // Valores redondos em milhão pedem "de": "um milhão de reais".
    const pedeDe = reais >= 1000000 && reais % 1000000 === 0;
    partes.push(`${numeroEmPalavras(reais)}${pedeDe ? " de" : ""} ${reais === 1 ? "real" : "reais"}`);
  }
  if (centavos > 0) {
    partes.push(`${numeroEmPalavras(centavos)} ${centavos === 1 ? "centavo" : "centavos"}`);
  }

  if (!partes.length) return "zero reais";
  return partes.join(" e ");
}
