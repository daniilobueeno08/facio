"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { approveQuote, cancelQuote, deleteQuote, reactivateQuote, markQuoteAsPaid } from "./actions";
import type { QuoteData } from "./HistoricoKanban";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:      "#FFFFFF",
  surface: "#F4F6F3",
  text:    "#1A1A2E",
  muted:   "#6B7280",
  border:  "#E5E7EB",
  primary: "#639922",
  navy:    "#1A1A2E",
  danger:  "#DC2626",
  amber:   "#D97706",
  green:   "#16A34A",
};

type ColumnKey = "novo" | "aprovado" | "pago" | "cancelado";

// ─── Ícones ────────────────────────────────────────────────────────────────────
const IconDots     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>;
const IconWhatsApp = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.555 4.118 1.528 5.845L.057 23.428a.5.5 0 0 0 .623.602l5.805-1.527A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.901 0-3.68-.516-5.204-1.415l-.373-.22-3.865 1.017 1.002-3.756-.242-.386A9.971 9.971 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>;
const IconPdf      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const IconEdit     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconTrash    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>;
const IconRefresh  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>;
const IconCheck    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconPayment  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
const IconX        = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconCash     = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
const IconCredit   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M12 6v6l4 2"/></svg>;
const IconClose    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

// ─── Helpers ───────────────────────────────────────────────────────────────────
function fmtCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}
function buildWhatsAppLink(phone: string, clientName: string, pdfUrl: string | null, total: number) {
  const clean = phone.replace(/\D/g, "");
  const msg = pdfUrl
    ? encodeURIComponent(`Olá ${clientName}! Segue seu orçamento no valor de ${fmtCurrency(total)}:\n${pdfUrl}`)
    : encodeURIComponent(`Olá ${clientName}! Segue seu orçamento no valor de ${fmtCurrency(total)}.`);
  return `https://wa.me/55${clean}?text=${msg}`;
}

// ─── Modal de Pagamento ────────────────────────────────────────────────────────
function PaymentModal({
  quote,
  onClose,
  onSuccess,
}: {
  quote: QuoteData;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep]                 = useState<"escolha" | "crediario">("escolha");
  const [dataVencimento, setDataVenc]   = useState("");
  const [valorInicial, setValorInicial] = useState("");
  const [isPending, startTransition]    = useTransition();
  const [error, setError]               = useState<string | null>(null);

  // Fecha ao clicar no overlay
  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  function handleAvista() {
    setError(null);
    startTransition(async () => {
      const res = await markQuoteAsPaid(quote.id, quote.clientId, "avista");
      if (res?.error) { setError(res.error); return; }
      onSuccess();
    });
  }

  function handleCrediario() {
    setError(null);
    startTransition(async () => {
      const valorNum = parseFloat(valorInicial.replace(",", "."));
      const vpFinal  = isNaN(valorNum) || valorNum < 0 ? 0
                     : Math.min(valorNum, quote.total);
      const res = await markQuoteAsPaid(
        quote.id,
        quote.clientId,
        "crediario",
        dataVencimento || null,
        vpFinal > 0 ? vpFinal : null,
      );
      if (res?.error) { setError(res.error); return; }
      // Crediário: quote permanece em Aprovados até quitação total.
      // Fecha o modal — o card não sai da coluna.
      onClose();
    });
  }

  return (
    <div
      onClick={handleOverlayClick}
      style={{
        position:        "fixed",
        inset:           0,
        background:      "rgba(0,0,0,0.45)",
        zIndex:          100,
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "center",
        padding:         "20px",
        backdropFilter:  "blur(2px)",
      }}
    >
      <div style={{
        background:   C.bg,
        borderRadius: 20,
        padding:      "28px 24px 24px",
        width:        "100%",
        maxWidth:     380,
        boxShadow:    "0 20px 60px rgba(0,0,0,0.2)",
        position:     "relative",
      }}>
        {/* Botão fechar */}
        <button
          onClick={onClose}
          style={{
            position:   "absolute",
            top:        16,
            right:      16,
            background: C.surface,
            border:     "none",
            borderRadius: 8,
            padding:    "6px",
            cursor:     "pointer",
            color:      C.muted,
            display:    "flex",
            lineHeight: 1,
          }}
        >
          <IconClose />
        </button>

        {/* ── Passo 1: escolha da forma ── */}
        {step === "escolha" && (
          <>
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: C.muted }}>
              Confirmar pagamento
            </p>
            <p style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 800, color: C.navy }}>
              {quote.clientName}
            </p>
            <p style={{ margin: "0 0 24px", fontSize: 22, fontWeight: 800, color: C.primary }}>
              {fmtCurrency(quote.total)}
            </p>

            <p style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 600, color: C.text }}>
              Como o pagamento foi recebido?
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* À vista */}
              <button
                onClick={handleAvista}
                disabled={isPending}
                style={{
                  display:        "flex",
                  alignItems:     "center",
                  gap:            14,
                  padding:        "16px 18px",
                  borderRadius:   12,
                  border:         `2px solid ${C.border}`,
                  background:     C.bg,
                  cursor:         isPending ? "not-allowed" : "pointer",
                  textAlign:      "left",
                  transition:     "border-color 0.15s, background 0.15s",
                  opacity:        isPending ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = C.green;
                  e.currentTarget.style.background  = "#F0FDF4";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = C.border;
                  e.currentTarget.style.background  = C.bg;
                }}
              >
                <span style={{ color: C.green, display: "flex", flexShrink: 0 }}><IconCash /></span>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.navy }}>À vista</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: C.muted }}>Dinheiro, Pix ou cartão — pagamento imediato</p>
                </div>
              </button>

              {/* Crediário / Fiado */}
              <button
                onClick={() => setStep("crediario")}
                disabled={isPending}
                style={{
                  display:        "flex",
                  alignItems:     "center",
                  gap:            14,
                  padding:        "16px 18px",
                  borderRadius:   12,
                  border:         `2px solid ${C.border}`,
                  background:     C.bg,
                  cursor:         isPending ? "not-allowed" : "pointer",
                  textAlign:      "left",
                  transition:     "border-color 0.15s, background 0.15s",
                  opacity:        isPending ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = C.amber;
                  e.currentTarget.style.background  = "#FFFBEB";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = C.border;
                  e.currentTarget.style.background  = C.bg;
                }}
              >
                <span style={{ color: C.amber, display: "flex", flexShrink: 0 }}><IconCredit /></span>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.navy }}>Crediário / Fiado</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: C.muted }}>Lança no extrato do cliente para pagar depois</p>
                </div>
              </button>
            </div>

            {error && (
              <p style={{ margin: "14px 0 0", fontSize: 12, color: C.danger, fontWeight: 500 }}>{error}</p>
            )}
          </>
        )}

        {/* ── Passo 2: data de vencimento para crediário ── */}
        {step === "crediario" && (
          <>
            <button
              onClick={() => setStep("escolha")}
              style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 13, padding: "0 0 16px", display: "flex", alignItems: "center", gap: 6 }}
            >
              ← Voltar
            </button>

            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: C.amber }}>
              Crediário / Fiado
            </p>
            <p style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 800, color: C.navy }}>
              {quote.clientName}
            </p>
            <p style={{ margin: "0 0 24px", fontSize: 22, fontWeight: 800, color: C.primary }}>
              {fmtCurrency(quote.total)}
            </p>

            <p style={{ margin: "0 0 8px", fontSize: 13, color: C.text }}>
              O valor será lançado em <strong>Contas a Receber</strong>. O orçamento permanece
              em <em>Aprovados</em> até a quitação total.
            </p>

            <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: C.muted }}>
              Valor pago agora (opcional)
            </label>
            <input
              type="number"
              placeholder={`0,00 — máx. ${fmtCurrency(quote.total)}`}
              value={valorInicial}
              onChange={(e) => setValorInicial(e.target.value)}
              min={0}
              max={quote.total}
              step={0.01}
              style={{
                width:        "100%",
                padding:      "10px 12px",
                borderRadius: 8,
                border:       `1px solid ${C.border}`,
                fontSize:     14,
                color:        C.text,
                background:   C.surface,
                marginBottom: 14,
                boxSizing:    "border-box",
                outline:      "none",
              }}
            />

            <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: C.muted }}>
              Vencimento (opcional)
            </label>
            <input
              type="date"
              value={dataVencimento}
              onChange={(e) => setDataVenc(e.target.value)}
              style={{
                width:        "100%",
                padding:      "10px 12px",
                borderRadius: 8,
                border:       `1px solid ${C.border}`,
                fontSize:     14,
                color:        C.text,
                background:   C.surface,
                marginBottom: 20,
                boxSizing:    "border-box",
                outline:      "none",
              }}
            />

            <button
              onClick={handleCrediario}
              disabled={isPending}
              style={{
                width:        "100%",
                padding:      "13px",
                borderRadius: 10,
                border:       "none",
                background:   C.amber,
                color:        "#fff",
                fontSize:     14,
                fontWeight:   700,
                cursor:       isPending ? "not-allowed" : "pointer",
                opacity:      isPending ? 0.7 : 1,
                transition:   "opacity 0.15s",
              }}
            >
              {isPending ? "Lançando..." : "Lançar no crediário"}
            </button>

            {error && (
              <p style={{ margin: "12px 0 0", fontSize: 12, color: C.danger, fontWeight: 500 }}>{error}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── KanbanCard ────────────────────────────────────────────────────────────────
export default function KanbanCard({ quote, tab }: { quote: QuoteData; tab: ColumnKey }) {
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [showModal,   setShowModal]   = useState(false);
  const [isPending,   startTransition] = useTransition();
  const [feedback,    setFeedback]    = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fecha menu ao clicar fora
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [menuOpen]);

  function showFeedback(msg: string) {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 2500);
  }

  // ── Actions ─────────────────────────────────────────────────────────────────
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

  // ── Ação principal por coluna ────────────────────────────────────────────────
  const primaryAction = (() => {
    switch (tab) {
      case "novo":
        return (
          <button onClick={handleApprove} disabled={isPending} style={btnStyle(C.primary, "#fff")}>
            <IconCheck /> Aprovar
          </button>
        );
      case "aprovado":
        return (
          <button onClick={() => setShowModal(true)} disabled={isPending} style={btnStyle(C.navy, "#fff")}>
            <IconPayment /> Confirmar pagamento
          </button>
        );
      case "cancelado":
        return (
          <button onClick={handleReactivate} disabled={isPending} style={btnStyle(C.muted, "#fff")}>
            <IconRefresh /> Reativar
          </button>
        );
      default:
        return null;
    }
  })();

  // ── Itens do menu ────────────────────────────────────────────────────────────
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

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Modal de pagamento */}
      {showModal && (
        <PaymentModal
          quote={quote}
          onClose={() => setShowModal(false)}
          onSuccess={() => setShowModal(false)}
        />
      )}

      <div style={{
        background:  C.bg,
        border:      `1px solid ${C.border}`,
        borderRadius: 12,
        padding:     "14px 14px 12px",
        display:     "flex",
        flexDirection: "column",
        gap:         10,
        boxShadow:   "0 1px 4px rgba(0,0,0,0.06)",
        opacity:     isPending ? 0.6 : 1,
        transition:  "opacity 0.2s",
        position:    "relative",
      }}>
        {/* Cabeçalho: nome + valor + menu */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.navy, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {quote.clientName}
            </p>
            <p style={{ margin: "3px 0 0", fontSize: 18, fontWeight: 800, color: C.primary, letterSpacing: "-0.5px" }}>
              {fmtCurrency(quote.total)}
            </p>
          </div>

          {menuItems.length > 0 && (
            <div ref={menuRef} style={{ position: "relative", flexShrink: 0 }}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, padding: "4px 6px", borderRadius: 6, display: "flex", alignItems: "center", lineHeight: 1 }}
                aria-label="Mais opções"
              >
                <IconDots />
              </button>

              {menuOpen && (
                <div style={{
                  position: "absolute", right: 0, top: "calc(100% + 4px)",
                  background: C.bg, border: `1px solid ${C.border}`,
                  borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                  minWidth: 185, zIndex: 50, overflow: "hidden",
                }}>
                  {menuItems.map((item) => (
                    <button
                      key={item.label}
                      onClick={item.onClick}
                      style={{
                        display: "flex", alignItems: "center", gap: 9,
                        width: "100%", padding: "11px 14px",
                        background: "none", border: "none", cursor: "pointer",
                        fontSize: 13, fontWeight: 500, color: item.color ?? C.text, textAlign: "left",
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

        {/* Meta: data + badge */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, color: C.muted }}>
            {tab === "pago" && quote.paidAt
              ? `Pago em ${fmtDate(quote.paidAt)}`
              : `Criado em ${fmtDate(quote.createdAt)}`}
          </span>
          <StatusBadge tab={tab} />
        </div>

        {/* Feedback de erro */}
        {feedback && (
          <p style={{ margin: 0, fontSize: 12, color: C.danger, fontWeight: 500 }}>{feedback}</p>
        )}

        {/* Ações */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {primaryAction}

          {/* WhatsApp — envia link do PDF se disponível */}
          {(tab === "novo" || tab === "aprovado") && quote.clientWhatsapp && (
            <a
              href={buildWhatsAppLink(quote.clientWhatsapp, quote.clientName, quote.pdfUrl, quote.total)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 34, height: 34, borderRadius: 8,
                background: "#DCFCE7", color: "#16A34A",
                textDecoration: "none", flexShrink: 0,
              }}
              title={quote.pdfUrl ? "Enviar PDF pelo WhatsApp" : "Enviar mensagem pelo WhatsApp"}
            >
              <IconWhatsApp />
            </a>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Status badge ──────────────────────────────────────────────────────────────
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
      fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase",
      background: s.bg, color: s.color, borderRadius: 99, padding: "3px 8px",
    }}>
      {s.label}
    </span>
  );
}

// ─── Helper botão ──────────────────────────────────────────────────────────────
function btnStyle(bg: string, color: string): React.CSSProperties {
  return {
    display: "flex", alignItems: "center", gap: 6,
    flex: 1, justifyContent: "center",
    padding: "9px 12px", borderRadius: 8, border: "none",
    background: bg, color, fontSize: 13, fontWeight: 600,
    cursor: "pointer", transition: "opacity 0.15s",
  };
}
