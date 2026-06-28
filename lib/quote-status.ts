export type QuoteStatus = "draft" | "sent" | "approved" | "paid" | "cancelled";

const SETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;

export function isExpired(status: QuoteStatus, createdAt: string): boolean {
  if (status !== "draft" && status !== "sent") return false;
  return Date.now() - new Date(createdAt).getTime() > SETE_DIAS_MS;
}

export function canEdit(status: QuoteStatus): boolean {
  return status === "draft" || status === "sent";
}

export function getTab(status: QuoteStatus): "novo" | "aprovado" | "pago" | "cancelado" {
  if (status === "approved")  return "aprovado";
  if (status === "paid")      return "pago";
  if (status === "cancelled") return "cancelado";
  return "novo";
}

export const STATUS_CONFIG: Record<QuoteStatus, { label: string; bg: string; color: string }> = {
  draft:     { label: "Rascunho",  bg: "#F1F1F1", color: "#6B7280" },
  sent:      { label: "Enviado",   bg: "#FEF3C7", color: "#92400E" },
  approved:  { label: "Aprovado",  bg: "#DBEAFE", color: "#1E40AF" },
  paid:      { label: "Pago",      bg: "#EAF3DE", color: "#3B6D11" },
  cancelled: { label: "Cancelado", bg: "#FEE2E2", color: "#991B1B" },
};
