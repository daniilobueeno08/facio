"use client";

import { useState } from "react";
import { deleteQuote, markQuoteAsPaid } from "./actions";

const C = { bg:"#FFFFFF", surface:"#F4F6F3", text:"#1A1A2E", muted:"#6B7280", border:"#E5E7EB", primary:"#639922", pale:"#EAF3DE", navy:"#1A1A2E" };

const STATUS_LABEL: Record<string, { label: string; bg: string; color: string }> = {
  draft:    { label:"Rascunho",   bg:"#F1F1F1", color:"#6B7280" },
  sent:     { label:"Enviado",    bg:"#FEF3C7", color:"#92400E" },
  approved: { label:"Aprovado",   bg:"#DBEAFE", color:"#1E40AF" },
  paid:     { label:"Pago",       bg:"#EAF3DE", color:"#3B6D11" },
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day:"2-digit", month:"2-digit", year:"numeric" });
}

export default function QuoteRow({
  id, slug, status, total, pdfUrl, createdAt, paidAt, clientId, clientName,
}: {
  id: string; slug: string; status: string; total: number; pdfUrl: string | null;
  createdAt: string; paidAt: string | null; clientId: string; clientName: string;
}) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [currentPaidAt, setCurrentPaidAt] = useState(paidAt);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleted, setDeleted]             = useState(false);
  const [loading, setLoading]             = useState(false);

  const canEdit   = currentStatus === "draft" || currentStatus === "sent";
  const statusCfg = STATUS_LABEL[currentStatus] ?? STATUS_LABEL.draft;

  async function handleDelete() {
    setLoading(true);
    const result = await deleteQuote(id);
    if (result?.success) setDeleted(true);
    setLoading(false);
  }

  async function handleMarkPaid() {
    setLoading(true);
    const result = await markQuoteAsPaid(id, clientId);
    if (result?.success) {
      setCurrentStatus("paid");
      setCurrentPaidAt(new Date().toISOString());
    }
    setLoading(false);
  }

  if (deleted) return null;

  return (
    <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:14, padding:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
        <div>
          <div style={{ fontSize:14, fontWeight:600, color:C.text }}>{clientName}</div>
          <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>
            Elaborado em {formatDate(createdAt)}
            {currentPaidAt && <> · Pago em {formatDate(currentPaidAt)}</>}
          </div>
        </div>
        <span style={{ fontSize:10, fontWeight:600, padding:"3px 9px", borderRadius:99, background:statusCfg.bg, color:statusCfg.color, whiteSpace:"nowrap" }}>
          {statusCfg.label}
        </span>
      </div>

      <div style={{ fontSize:16, fontWeight:700, color:C.primary, marginBottom:12 }}>
        R$ {total.toFixed(2)}
      </div>

      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {pdfUrl && (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize:12, color:C.text, border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 12px", textDecoration:"none" }}
          >
            Ver PDF
          </a>
        )}

        {canEdit && (
          <a
            href={`/dashboard/historico/${id}/editar`}
            style={{ fontSize:12, color:C.primary, border:`1px solid ${C.primary}`, borderRadius:8, padding:"6px 12px", textDecoration:"none" }}
          >
            Editar
          </a>
        )}

        {currentStatus !== "paid" && (
          <button
            onClick={handleMarkPaid}
            disabled={loading}
            style={{ fontSize:12, color:"#fff", background:C.primary, border:"none", borderRadius:8, padding:"6px 12px", cursor:loading?"not-allowed":"pointer" }}
          >
            Marcar como pago
          </button>
        )}

        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            style={{ fontSize:12, color:"#ef4444", background:"none", border:"1px solid #fecaca", borderRadius:8, padding:"6px 12px", cursor:"pointer" }}
          >
            Apagar
          </button>
        ) : (
          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
            <span style={{ fontSize:11, color:"#ef4444" }}>Confirmar?</span>
            <button
              onClick={handleDelete}
              disabled={loading}
              style={{ fontSize:12, color:"#fff", background:"#ef4444", border:"none", borderRadius:8, padding:"6px 12px", cursor:loading?"not-allowed":"pointer" }}
            >
              {loading ? "Apagando…" : "Sim, apagar"}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              style={{ fontSize:12, color:C.muted, background:"none", border:"none", cursor:"pointer" }}
            >
              Cancelar
            </button>
          </div>
        )}
      </div>

      {!canEdit && currentStatus !== "paid" && (
        <p style={{ fontSize:11, color:C.muted, marginTop:8 }}>
          Orçamento aprovado — não pode mais ser editado, apenas apagado.
        </p>
      )}
    </div>
  );
}
