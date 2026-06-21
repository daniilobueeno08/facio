/**
 * Lógica compartilhada de status de orçamento.
 * Centraliza a regra dos 7 dias para não duplicar entre componentes.
 */

export type QuoteStatus = "draft" | "sent" | "approved" | "paid" | "cancelled";

const SETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Um orçamento é considerado "expirado" (cancelamento automático visual) quando:
 *   • foi criado há mais de 7 dias, E
 *   • o status ainda é 'draft' ou 'sent' (não foi aprovado nem pago nem cancelado)
 *
 * Isso é uma regra de FRONT-END (MVP) — o banco mantém o status original.
 * A interface apenas exibe como expirado e oferece reativação.
 */
export function isExpired(status: QuoteStatus, createdAt: string): boolean {
  if (status !== "draft" && status !== "sent") return false;
  const age = Date.now() - new Date(createdAt).getTime();
  return age > SETE_DIAS_MS;
}

/**
 * Edição só é permitida enquanto o orçamento está 'draft' ou 'sent'.
 * Depois de aprovado, pago ou cancelado, fica travado.
 */
export function canEdit(status: QuoteStatus): boolean {
  return status === "draft" || status === "sent";
}

/**
 * Determina a qual aba do Kanban o orçamento pertence.
 * Orçamentos expirados continuam na aba "novo" mas com tratamento visual especial.
 */
export function getTab(status: QuoteStatus): "novo" | "aprovado" | "pago" | "cancelado" {
  if (status === "approved") return "aprovado";
  if (status === "paid")     return "pago";
  if (status === "cancelled") return "cancelado";
  return "novo"; // draft ou sent
}

export const STATUS_CONFIG: Record<QuoteStatus, { label: string; bg: string; color: string }> = {
  draft:     { label: "Rascunho",  bg: "#F1F1F1", color: "#6B7280" },
  sent:      { label: "Enviado",   bg: "#FEF3C7", color: "#92400E" },
  approved:  { label: "Aprovado",  bg: "#DBEAFE", color: "#1E40AF" },
  paid:      { label: "Pago",      bg: "#EAF3DE", color: "#3B6D11" },
  cancelled: { label: "Cancelado", bg: "#FEE2E2", color: "#991B1B" },
};
