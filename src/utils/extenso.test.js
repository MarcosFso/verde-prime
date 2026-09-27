import { describe, it, expect } from "vitest";
import { valorEmPalavras } from "./extenso";

describe("valorEmPalavras", () => {
  it("escreve valores redondos", () => {
    expect(valorEmPalavras(0)).toBe("zero reais");
    expect(valorEmPalavras(1)).toBe("um real");
    expect(valorEmPalavras(15)).toBe("quinze reais");
    expect(valorEmPalavras(100)).toBe("cem reais");
    expect(valorEmPalavras(1000)).toBe("mil reais");
    expect(valorEmPalavras(10000)).toBe("dez mil reais");
    expect(valorEmPalavras(100000)).toBe("cem mil reais");
  });

  it("usa 'e' antes do último grupo quando ele é menor que cem ou centena redonda", () => {
    // É assim que se lê em português: "mil e quinhentos", mas
    // "mil duzentos e trinta e quatro" (sem o "e" antes de duzentos).
    expect(valorEmPalavras(1500)).toBe("mil e quinhentos reais");
    expect(valorEmPalavras(2500)).toBe("dois mil e quinhentos reais");
    expect(valorEmPalavras(1234)).toBe("mil duzentos e trinta e quatro reais");
    expect(valorEmPalavras(101)).toBe("cento e um reais");
    expect(valorEmPalavras(110)).toBe("cento e dez reais");
  });

  it("trata as dezenas irregulares de dez a dezenove", () => {
    expect(valorEmPalavras(10)).toBe("dez reais");
    expect(valorEmPalavras(11)).toBe("onze reais");
    expect(valorEmPalavras(14)).toBe("quatorze reais");
    expect(valorEmPalavras(16)).toBe("dezesseis reais");
    expect(valorEmPalavras(19)).toBe("dezenove reais");
    expect(valorEmPalavras(20)).toBe("vinte reais");
    expect(valorEmPalavras(21)).toBe("vinte e um reais");
  });

  it("escreve os centavos e concorda o singular", () => {
    expect(valorEmPalavras(0.01)).toBe("um centavo");
    expect(valorEmPalavras(0.5)).toBe("cinquenta centavos");
    expect(valorEmPalavras(1.5)).toBe("um real e cinquenta centavos");
    expect(valorEmPalavras(2340.75)).toBe("dois mil trezentos e quarenta reais e setenta e cinco centavos");
  });

  it("exige 'de' em milhão redondo", () => {
    // Lê-se "um milhão DE reais", mas "um milhão e quinhentos mil reais".
    expect(valorEmPalavras(1000000)).toBe("um milhão de reais");
    expect(valorEmPalavras(2000000)).toBe("dois milhões de reais");
    expect(valorEmPalavras(1500000)).toBe("um milhão e quinhentos mil reais");
  });

  it("arredonda para o centavo mais próximo", () => {
    expect(valorEmPalavras(1.004)).toBe("um real");
    expect(valorEmPalavras(1.006)).toBe("um real e um centavo");
  });

  it("não quebra com entrada inválida", () => {
    expect(valorEmPalavras(null)).toBe("zero reais");
    expect(valorEmPalavras(undefined)).toBe("zero reais");
    expect(valorEmPalavras("")).toBe("zero reais");
  });
});
