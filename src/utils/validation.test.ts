import { describe, it, expect } from "vitest";
import { isValidCPF, isValidCNPJ, isValidCpfCnpj } from "./validation";

describe("isValidCPF", () => {
  it("aceita CPFs com dígitos verificadores corretos", () => {
    expect(isValidCPF("11144477735")).toBe(true);
    expect(isValidCPF("52998224725")).toBe(true);
    expect(isValidCPF("39053344705")).toBe(true);
  });

  it("recusa dígito verificador errado", () => {
    expect(isValidCPF("11144477736")).toBe(false);
    expect(isValidCPF("12345678900")).toBe(false);
  });

  it("recusa sequências de dígitos repetidos", () => {
    // 111.111.111-11 passa na conta dos verificadores, mas não é um CPF válido.
    expect(isValidCPF("11111111111")).toBe(false);
    expect(isValidCPF("00000000000")).toBe(false);
  });

  it("recusa quantidade de dígitos diferente de 11", () => {
    expect(isValidCPF("1114447773")).toBe(false);
    expect(isValidCPF("111444777350")).toBe(false);
  });
});

describe("isValidCNPJ", () => {
  it("aceita CNPJ com dígitos verificadores corretos", () => {
    expect(isValidCNPJ("11222333000181")).toBe(true);
  });

  it("recusa dígito verificador errado", () => {
    expect(isValidCNPJ("11222333000182")).toBe(false);
  });

  it("recusa repetição e tamanho errado", () => {
    expect(isValidCNPJ("11111111111111")).toBe(false);
    expect(isValidCNPJ("112223330001")).toBe(false);
  });
});

describe("isValidCpfCnpj", () => {
  it("aceita vazio, porque o campo é opcional na ficha", () => {
    expect(isValidCpfCnpj("")).toBe(true);
    expect(isValidCpfCnpj(null)).toBe(true);
    expect(isValidCpfCnpj(undefined)).toBe(true);
  });

  it("valida com a máscara aplicada", () => {
    expect(isValidCpfCnpj("111.444.777-35")).toBe(true);
    expect(isValidCpfCnpj("11.222.333/0001-81")).toBe(true);
    expect(isValidCpfCnpj("111.444.777-36")).toBe(false);
  });

  it("recusa número incompleto", () => {
    expect(isValidCpfCnpj("111.444.777")).toBe(false);
    expect(isValidCpfCnpj("11.222.333/0001")).toBe(false);
  });
});
