import { describe, it, expect } from "vitest";
import { escapeHtml } from "./html";

describe("escapeHtml", () => {
  it("neutraliza as tags que executariam script no PDF", () => {
    // Era a brecha real: os PDFs são montados como HTML e renderizados no DOM,
    // então uma tag digitada num campo da ficha rodaria script na origem do app.
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"
    );
    expect(escapeHtml("<script>roubar()</script>")).toBe(
      "&lt;script&gt;roubar()&lt;/script&gt;"
    );
  });

  it("escapa cada caractere perigoso", () => {
    expect(escapeHtml("<")).toBe("&lt;");
    expect(escapeHtml(">")).toBe("&gt;");
    expect(escapeHtml('"')).toBe("&quot;");
    expect(escapeHtml("'")).toBe("&#39;");
    expect(escapeHtml("&")).toBe("&amp;");
  });

  it("escapa o & antes dos outros, sem escapar duas vezes", () => {
    expect(escapeHtml("&lt;")).toBe("&amp;lt;");
  });

  it("não altera texto comum, inclusive com acento", () => {
    expect(escapeHtml("Fazenda Boa Esperança")).toBe("Fazenda Boa Esperança");
    expect(escapeHtml("João Batista Pereira")).toBe("João Batista Pereira");
    expect(escapeHtml("Matrícula nº 14.502")).toBe("Matrícula nº 14.502");
  });

  it("trata valores ausentes como texto vazio", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
    expect(escapeHtml(0)).toBe("0");
  });
});
