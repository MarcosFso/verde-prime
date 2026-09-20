export function maskPhone(raw) {
  const d = (raw || "").replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.replace(/^(\d*)/, "($1");
  if (d.length <= 6) return d.replace(/^(\d{2})(\d*)/, "($1) $2");
  if (d.length <= 10) return d.replace(/^(\d{2})(\d{4})(\d*)/, "($1) $2-$3");
  return d.replace(/^(\d{2})(\d{5})(\d*)/, "($1) $2-$3");
}

export function maskCpfCnpj(raw) {
  const d = (raw || "").replace(/\D/g, "").slice(0, 14);
  if (d.length <= 11) {
    return d
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
  }
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

export function nowStr() {
  return new Date().toLocaleString("pt-BR");
}

/** Formats a raw number as a Brazilian currency string, e.g. 5000 -> "5.000,00". */
export function formatCurrencyDigits(value) {
  const n = Number(value) || 0;
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Parses user keystrokes (digits only, last 2 = cents) into a plain number, e.g. "500000" -> 5000. */
export function parseCurrencyInput(raw) {
  const digits = (raw || "").replace(/\D/g, "");
  if (!digits) return 0;
  return parseInt(digits, 10) / 100;
}
