/**
 * Escapa texto que vai ser interpolado em HTML.
 *
 * Os PDFs (recibo e ficha) são montados como HTML e renderizados pelo html2pdf
 * dentro do DOM do navegador. Sem escapar, um valor digitado num campo — algo
 * como `<img src=x onerror=...>` — executaria script na origem do app. E como o
 * administrador pode gerar o PDF de fichas de outros usuários, esse script
 * rodaria na sessão dele. Por isso todo valor vindo do usuário passa por aqui.
 */
export function escapeHtml(texto) {
  return String(texto ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
