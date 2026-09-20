export function paymentStatus(f) {
  const cobrado = Number(f.valor_cobrado) || 0;
  const recebido = Number(f.valor_recebido) || 0;
  if (!cobrado) return null;
  if (recebido <= 0) return "pendente";
  if (recebido < cobrado) return "parcial";
  return "pago";
}

export const PAYMENT_STATUS_LABELS = { pendente: "Pendente", parcial: "Parcial", pago: "Pago" };
export const PAYMENT_STATUS_COLORS = { pendente: "#C1440E", parcial: "#C98A2C", pago: "#2F8F5E" };

export function formatBRL(value) {
  const n = Number(value) || 0;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
