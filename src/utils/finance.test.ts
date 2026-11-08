import { describe, it, expect } from "vitest";
import { paymentStatus, formatBRL } from "./finance";

describe("paymentStatus", () => {
  it("não classifica ficha sem valor cobrado", () => {
    // Sem valor de serviço não existe cobrança para acompanhar.
    expect(paymentStatus({ valor_cobrado: 0, valor_recebido: 0 })).toBe(null);
    expect(paymentStatus({})).toBe(null);
  });

  it("marca como pendente quando nada foi recebido", () => {
    expect(paymentStatus({ valor_cobrado: 3500, valor_recebido: 0 })).toBe("pendente");
    expect(paymentStatus({ valor_cobrado: 3500 })).toBe("pendente");
  });

  it("marca como parcial quando recebeu menos que o cobrado", () => {
    expect(paymentStatus({ valor_cobrado: 3500, valor_recebido: 1500 })).toBe("parcial");
    expect(paymentStatus({ valor_cobrado: 3500, valor_recebido: 3499.99 })).toBe("parcial");
  });

  it("marca como pago quando recebeu o total ou mais", () => {
    expect(paymentStatus({ valor_cobrado: 2800, valor_recebido: 2800 })).toBe("pago");
    expect(paymentStatus({ valor_cobrado: 2800, valor_recebido: 3000 })).toBe("pago");
  });

  it("aceita valores vindos do banco como texto", () => {
    // O Postgres devolve numeric como string em algumas consultas.
    expect(paymentStatus({ valor_cobrado: "3500", valor_recebido: "1500" })).toBe("parcial");
    expect(paymentStatus({ valor_cobrado: "2800", valor_recebido: "2800" })).toBe("pago");
  });
});

describe("formatBRL", () => {
  it("formata como moeda brasileira", () => {
    expect(formatBRL(1500)).toMatch(/1\.500,00/);
    expect(formatBRL(1500)).toMatch(/R\$/);
    expect(formatBRL(0)).toMatch(/0,00/);
  });

  it("trata entrada inválida como zero", () => {
    expect(formatBRL(null)).toMatch(/0,00/);
    expect(formatBRL("abc")).toMatch(/0,00/);
  });
});
