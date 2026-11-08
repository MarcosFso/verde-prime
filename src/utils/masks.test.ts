import { describe, it, expect } from "vitest";
import { maskPhone, maskCpfCnpj, formatCurrencyDigits, parseCurrencyInput } from "./masks";

describe("maskPhone", () => {
  it("formata celular e fixo conforme o usuário digita", () => {
    expect(maskPhone("38")).toBe("(38");
    expect(maskPhone("3899")).toBe("(38) 99");
    expect(maskPhone("3899627596")).toBe("(38) 9962-7596");
    expect(maskPhone("38999627596")).toBe("(38) 99962-7596");
  });

  it("descarta caracteres que não são dígitos e o excedente", () => {
    expect(maskPhone("(38) 99962-7596")).toBe("(38) 99962-7596");
    expect(maskPhone("38999627596999")).toBe("(38) 99962-7596");
    expect(maskPhone("abc")).toBe("(");
    expect(maskPhone("")).toBe("(");
  });
});

describe("maskCpfCnpj", () => {
  it("formata como CPF até 11 dígitos", () => {
    expect(maskCpfCnpj("11144477735")).toBe("111.444.777-35");
  });

  it("formata como CNPJ a partir de 12 dígitos", () => {
    expect(maskCpfCnpj("11222333000181")).toBe("11.222.333/0001-81");
  });

  it("limita a 14 dígitos", () => {
    expect(maskCpfCnpj("112223330001819999")).toBe("11.222.333/0001-81");
  });
});

describe("formatCurrencyDigits", () => {
  it("formata no padrão brasileiro, com duas casas", () => {
    expect(formatCurrencyDigits(1500)).toBe("1.500,00");
    expect(formatCurrencyDigits(0)).toBe("0,00");
    expect(formatCurrencyDigits(1234567.89)).toBe("1.234.567,89");
  });

  it("trata entrada inválida como zero", () => {
    expect(formatCurrencyDigits(null)).toBe("0,00");
    expect(formatCurrencyDigits("abc")).toBe("0,00");
  });
});

describe("parseCurrencyInput", () => {
  it("lê os dígitos da direita para a esquerda, os dois últimos como centavos", () => {
    // O usuário digita só números: "500000" significa R$ 5.000,00.
    expect(parseCurrencyInput("500000")).toBe(5000);
    expect(parseCurrencyInput("1")).toBe(0.01);
    expect(parseCurrencyInput("150")).toBe(1.5);
    expect(parseCurrencyInput("")).toBe(0);
  });

  it("ignora pontos e vírgulas já digitados", () => {
    expect(parseCurrencyInput("5.000,00")).toBe(5000);
    expect(parseCurrencyInput("R$ 1.500,00")).toBe(1500);
  });

  it("vai e volta sem perder o valor", () => {
    const valor = 3500;
    const texto = formatCurrencyDigits(valor);
    expect(parseCurrencyInput(texto)).toBe(valor);
  });
});
