"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { approveQuote, cancelQuote, deleteQuote, reactivateQuote } from "./actions";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:      "#FFFFFF",
  surface: "#F4F6F3",
  text:    "#1A1A2E",
  muted:   "#6B7280",
  border:  "#E5E7EB",
  primary: "#639922",        // verde Facio
  navy:    "#1A1A2E",
  danger:  "#DC2626",
  amber:   "#D97706",
  blue:    "#1D4ED8",
};

// ─── Tipos ────────────────────────────────────────────────────────────────────
import type { QuoteData } from "./HistoricoKanban";

type ColumnKey = "novo" | "aprovado" | "pago" | "cancelado";

interface KanbanCardProps {
  quote: QuoteData;
  tab:   ColumnKey;
  /** Chamado pela Etapa 2 quando o usuário escolhe mover para "Pagos" */
  onRequestPayment?: (quote: QuoteData) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function buildWhatsApp(phone: string, clientName: string, total: number) {
  const clean = phone.replace(/\D/g, "");
  const msg = encodeURIComponent(
    `Olá ${clientName}! Segue o orçamento no valor de ${fmtCurrency(total)}. Confirma aprovação?`
  );
  return `https://wa.me/55${clean}?text=${msg}`;
}

// ─── Ícones inline (sem dependência de lib) ───────────────────────────────────
const IconDots = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="5"  r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
  </svg>
);
const IconWhatsApp = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.555 4.118 1.528 5.845L.057 23.428a.5.5 0 0 0 .623.602l5.805-1.527A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.901 0-3.68-.516-5.204-1.415l-.373-.22-3.865 1.017 1.002-3.756-.242-.386A9.971 9.971 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
  </svg>
);
const IconPdf = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);
const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
  </svg>
);
const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconPayment = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);
const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

// ─── Componente ───────────────────────────────────────────────────────────────
export default function KanbanCard({ quote, tab, onRequestPayment }: KanbanCardProps) {
  const [menuOpen, setMenuOpen]     = useState(false);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback]     = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fecha menu ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  // Feedback temporário
  function showFeedback(msg: string) {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 2500);
  }

  // ── Actions ──────────────────────────────────────────────────────────────
  function handleApprove() {
    startTransition(async () => {
      const res = await approveQuote(quote.id, quote.clientId);
      if (res?.error) showFeedback(res.error);
    });
  }

  function handleCancel() {
    startTransition(async () => {
      const res = await cancelQuote(quote.id);
      if (res?.error) showFeedback(res.error);
      setMenuOpen(false);
    });
  }

  function handleDelete() {
    if (!confirm(`Apagar orçamento de ${quote.clientName} definitivamente?`)) return;
    startTransition(async () => {
      const res = await deleteQuote(quote.id);
      if (res?.error) showFeedback(res.error);
      setMenuOpen(false);
    });
  }

  function handleReactivate() {
    startTransition(async () => {
      const res = await reactivateQuote(quote.id);
      if (res?.error) showFeedback(res.error);
      setMenuOpen(false);
    });
  }

  function handlePayment() {
    // Etapa 2: abrirá o modal de escolha À Vista / Crediário
    if (onRequestPayment) {
      onRequestPayment(quote);
    }
    setMenuOpen(false);
  }

  // ── Ação principal visível por coluna ────────────────────────────────────
  const primaryAction = (() => {
    switch (tab) {
      case "novo":
        return (
          <button
            onClick={handleApprove}
            disabled={isPending}
            style={btnStyle(C.primary, "#fff")}
          >
            <IconCheck /> Aprovar
          </button>
        );
      case "aprovado":
        return (
          <button
            onClick={handlePayment}
            disabled={isPending}
            style={btnStyle(C.navy, "#fff")}
          >
            <IconPayment /> Confirmar pagamento
          </button>
        );
      case "cancelado":
        return (
          <button
            onClick={handleReactivate}
            disabled={isPending}
            style={btnStyle(C.muted, "#fff")}
          >
            <IconRefresh /> Reativar
          </button>
        );
      default:
        return null;
    }
  })();

  // ── Itens do menu dropdown ────────────────────────────────────────────────
  const menuItems: { label: string; icon: React.ReactNode; onClick: () => void; color?: string }[] = [];

  if (tab !== "pago" && tab !== "cancelado") {
    menuItems.push({
      label: "Editar",
      icon: <IconEdit />,
      onClick: () => { window.location.href = `/dashboard/historico/${quote.id}/editar`; },
    });
  }
  if (quote.pdfUrl) {
    menuItems.push({
      label: "Ver PDF",
      icon: <IconPdf />,
      onClick: () => window.open(quote.pdfUrl!, "_blank"),
    });
  }
  if (tab === "novo" || tab === "aprovado") {
    menuItems.push({
      label: "Cancelar orçamento",
      icon: <IconX />,
      onClick: handleCancel,
      color: C.amber,
    });
  }
  if (tab === "cancelado") {
    menuItems.push({
      label: "Apagar definitivamente",
      icon: <IconTrash />,
      onClick: handleDelete,
      color: C.danger,
    });
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        background: C.bg,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: "14px 14px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        opacity: isPending ? 0.6 : 1,
        transition: "opacity 0.2s",
        position: "relative",
      }}
    >
      {/* ── Cabeçalho: nome + valor + menu ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 700,
            color: C.navy,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}>
            {quote.clientName}
          </p>
          <p style={{ margin: "3px 0 0", fontSize: 18, fontWeight: 800, color: C.primary, letterSpacing: "-0.5px" }}>
            {fmtCurrency(quote.total)}
          </p>
        </div>

        {/* Menu 3 pontos */}
        {menuItems.length > 0 && (
          <div ref={menuRef} style={{ position: "relative", flexShrink: 0 }}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: C.muted,
                padding: "4px 6px",
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                lineHeight: 1,
              }}
              aria-label="Mais opções"
            >
              <IconDots />
            </button>

            {menuOpen && (
              <div style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 4px)",
                background: C.bg,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                minWidth: 180,
                zIndex: 50,
                overflow: "hidden",
              }}>
                {menuItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 9,
                      width: "100%",
                      padding: "11px 14px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 500,
                      color: item.color ?? C.text,
                      textAlign: "left",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = C.surface)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                  >
                    <span style={{ color: item.color ?? C.muted, display: "flex" }}>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Meta: data e status badge ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, color: C.muted }}>
          {tab === "pago" && quote.paidAt
            ? `Pago em ${fmtDate(quote.paidAt)}`
            : `Criado em ${fmtDate(quote.createdAt)}`}
        </span>
        <StatusBadge tab={tab} />
      </div>

      {/* ── Feedback de erro ── */}
      {feedback && (
        <p style={{ margin: 0, fontSize: 12, color: C.danger, fontWeight: 500 }}>{feedback}</p>
      )}

      {/* ── Ações ── */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {primaryAction}

        {/* Botão WhatsApp (apenas em novos e aprovados) */}
        {(tab === "novo" || tab === "aprovado") && quote.clientWhatsapp && (
          <a
            href={buildWhatsApp(quote.clientWhatsapp, quote.clientName, quote.total)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 34,
              height: 34,
              borderRadius: 8,
              background: "#DCFCE7",
              color: "#16A34A",
              textDecoration: "none",
              flexShrink: 0,
            }}
            title="Enviar pelo WhatsApp"
          >
            <IconWhatsApp />
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ tab }: { tab: ColumnKey }) {
  const MAP: Record<ColumnKey, { label: string; bg: string; color: string }> = {
    novo:      { label: "Novo",      bg: "#FEF3C7", color: "#92400E" },
    aprovado:  { label: "Aprovado",  bg: "#DBEAFE", color: "#1E40AF" },
    pago:      { label: "Pago",      bg: "#D1FAE5", color: "#065F46" },
    cancelado: { label: "Cancelado", bg: "#FEE2E2", color: "#991B1B" },
  };
  const s = MAP[tab];
  return (
    <span style={{
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      background: s.bg,
      color: s.color,
      borderRadius: 99,
      padding: "3px 8px",
    }}>
      {s.label}
    </span>
  );
}

// ─── Helper de estilo de botão ────────────────────────────────────────────────
function btnStyle(bg: string, color: string): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: 6,
    flex: 1,
    justifyContent: "center",
    padding: "9px 12px",
    borderRadius: 8,
    border: "none",
    background: bg,
    color,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "opacity 0.15s",
  };
}
