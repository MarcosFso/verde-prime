import type { Ficha } from "../types/ficha";

export type StatusPagamento = "pendente" | "parcial" | "pago";

/** Classifica o pagamento de uma ficha. Sem valor cobrado, não há o que classificar. */
export function paymentStatus(f: Pick<Ficha, "valor_cobrado" | "valor_recebido">): StatusPagamento | null {
  const cobrado = Number(f.valor_cobrado) || 0;
  const recebido = Number(f.valor_recebido) || 0;
  if (!cobrado) return null;
  if (recebido <= 0) return "pendente";
  if (recebido < cobrado) return "parcial";
  return "pago";
}

export const PAYMENT_STATUS_LABELS: Record<StatusPagamento, string> = { pendente: "Pendente", parcial: "Parcial", pago: "Pago" };
export const PAYMENT_STATUS_COLORS: Record<StatusPagamento, string> = { pendente: "#C1440E", parcial: "#C98A2C", pago: "#2F8F5E" };

export function formatBRL(value: number | string | null | undefined): string {
  const n = Number(value) || 0;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
