"use client";

import { useState } from "react";
import { isExpired, canEdit, STATUS_CONFIG, type QuoteStatus } from "@/lib/quote-status";
import {
  approveQuote, markQuoteAsPaid, cancelQuote, reactivateQuote, deleteQuote,
} from "./actions";
import type { QuoteData } from "./HistoricoTabs";

const C = { bg:"#FFFFFF", surface:"#F4F6F3", text:"#1A1A2E", muted:"#6B7280", border:"#E5E7EB", primary:"#639922", pale:"#EAF3DE", navy:"#1A1A2E" };

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day:"2-digit", month:"2-digit", year:"numeric" });
}

const btnBase: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, borderRadius: 8, padding: "8px 12px",
  cursor: "pointer", border: "none", fontFamily: "var(--font-body)", flex: 1,
};

export default function KanbanCard({ quote, tab }: { quote: QuoteData; tab: string }) {
  const [status, setStatus]   = useState<QuoteStatus>(quote.status);
  const [removed, setRemoved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (removed) return null;

  const expired = isExpired(status, quote.createdAt);
  const statusCfg = STATUS_CONFIG[status];

  async function run(fn: () => Promise<{ error?: string; success?: boolean }>, newStatus?: QuoteStatus) {
    setLoading(true);
    const result = await fn();
    if (result?.success && newStatus) setStatus(newStatus);
    setLoading(false);
  }

  function openWhatsApp() {
    const phone = quote.clientWhatsapp.replace(/\D/g, "");
    const text = encodeURIComponent(
      quote.pdfUrl
        ? `Olá ${quote.clientName}! Segue seu orçamento: ${quote.pdfUrl}`
        : `Olá ${quote.clientName}! Sobre seu orçamento de R$ ${quote.total.toFixed(2)}.`
    );
    const url = phone ? `https://wa.me/55${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, "_blank");
  }

  // opacidade reduzida para cancelados (requisito da aba 4)
  const cardOpacity = (tab === "cancelado" || expired) ? 0.65 : 1;

  return (
    <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:14, padding:16, opacity:cardOpacity }}>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
        <div>
          <div style={{ fontSize:14, fontWeight:600, color:C.text }}>{quote.clientName}</div>
          <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>
            Elaborado em {formatDate(quote.createdAt)}
            {quote.paidAt && <> · Pago em {formatDate(quote.paidAt)}</>}
          </div>
        </div>
        <span style={{ fontSize:10, fontWeight:600, padding:"3px 9px", borderRadius:99, background:statusCfg.bg, color:statusCfg.color, whiteSpace:"nowrap" }}>
          {expired ? "Expirado" : statusCfg.label}
        </span>
      </div>

      <div style={{ fontSize:16, fontWeight:700, color:C.primary, marginBottom:12 }}>
        R$ {quote.total.toFixed(2)}
      </div>

      {/* aviso de expiração na aba Novos */}
      {expired && tab === "novo" && (
        <p style={{ fontSize:11, color:"#991B1B", background:"#FEE2E2", borderRadius:8, padding:"8px 10px", marginBottom:10 }}>
          Este orçamento passou de 7 dias sem aprovação. Reative para continuar o atendimento.
        </p>
      )}

      {/* AÇÕES POR ABA */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>

        {/* ABA NOVOS */}
        {tab === "novo" && !expired && (
          <>
            <button onClick={openWhatsApp} disabled={loading} style={{ ...btnBase, background:C.surface, color:C.text, border:`1px solid ${C.border}` }}>
              Enviar WhatsApp
            </button>
            <button onClick={() => run(() => approveQuote(quote.id, quote.clientId), "approved")} disabled={loading} style={{ ...btnBase, background:C.primary, color:"#fff" }}>
              Aprovar
            </button>
          </>
        )}

        {/* ABA NOVOS — expirado: só reativar */}
        {tab === "novo" && expired && (
          <button onClick={() => run(() => reactivateQuote(quote.id), "draft")} disabled={loading} style={{ ...btnBase, background:C.primary, color:"#fff" }}>
            {loading ? "Reativando…" : "Reativar orçamento"}
          </button>
        )}

        {/* ABA APROVADOS */}
        {tab === "aprovado" && (
          <>
            <button onClick={() => run(() => markQuoteAsPaid(quote.id, quote.clientId), "paid")} disabled={loading} style={{ ...btnBase, background:C.primary, color:"#fff" }}>
              Registrar pagamento
            </button>
            <button onClick={() => run(() => cancelQuote(quote.id), "cancelled")} disabled={loading} style={{ ...btnBase, background:C.surface, color:"#991B1B", border:"1px solid #fecaca" }}>
              Cancelar
            </button>
          </>
        )}

        {/* ABA PAGOS — só visualização do PDF */}
        {tab === "pago" && (
          quote.pdfUrl ? (
            <a href={quote.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ ...btnBase, background:C.surface, color:C.text, border:`1px solid ${C.border}`, textAlign:"center", textDecoration:"none" }}>
              Ver PDF
            </a>
          ) : (
            <span style={{ fontSize:12, color:C.muted }}>Orçamento pago e finalizado.</span>
          )
        )}

        {/* ABA CANCELADOS — reativar */}
        {tab === "cancelado" && (
          <button onClick={() => run(() => reactivateQuote(quote.id), "draft")} disabled={loading} style={{ ...btnBase, background:C.primary, color:"#fff" }}>
            {loading ? "Reativando…" : "Reativar orçamento"}
          </button>
        )}

        {/* editar — só quando permitido e não expirado */}
        {canEdit(status) && !expired && tab === "novo" && (
          <a href={`/dashboard/historico/${quote.id}/editar`} style={{ ...btnBase, background:"none", color:C.primary, border:`1px solid ${C.primary}`, textAlign:"center", textDecoration:"none", flex:"0 0 auto", padding:"8px 14px" }}>
            Editar
          </a>
        )}
      </div>

      {/* apagar de vez — disponível em todas as abas, discreto */}
      <div style={{ marginTop:10, textAlign:"right" }}>
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)} style={{ fontSize:11, color:C.muted, background:"none", border:"none", cursor:"pointer", textDecoration:"underline" }}>
            Apagar definitivamente
          </button>
        ) : (
          <span style={{ display:"inline-flex", gap:8, alignItems:"center" }}>
            <span style={{ fontSize:11, color:"#991B1B" }}>Apagar de vez?</span>
            <button onClick={() => run(async () => { const r = await deleteQuote(quote.id); if (r?.success) setRemoved(true); return r; })} disabled={loading} style={{ fontSize:11, color:"#fff", background:"#ef4444", border:"none", borderRadius:6, padding:"4px 10px", cursor:"pointer" }}>
              Sim
            </button>
            <button onClick={() => setConfirmDelete(false)} style={{ fontSize:11, color:C.muted, background:"none", border:"none", cursor:"pointer" }}>
              Não
            </button>
          </span>
        )}
      </div>
    </div>
  );
}
