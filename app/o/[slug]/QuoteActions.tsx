"use client";

import { useState } from "react";
import { approveQuote, markAsPaid } from "./actions";

const C = { primary:"#639922", pale:"#EAF3DE", dark:"#3B6D11", muted:"#6B7280" };

export default function QuoteActions({
  quoteId, clientId, status, pixLink,
}: { quoteId: string; clientId: string; status: string; pixLink: string | null }) {
  const [current, setCurrent] = useState(status);
  const [loading, setLoading] = useState(false);

  async function handleApprove() {
    setLoading(true);
    const result = await approveQuote(quoteId, clientId);
    if (result.success) setCurrent("approved");
    setLoading(false);
  }

  async function handlePaid() {
    setLoading(true);
    const result = await markAsPaid(quoteId, clientId);
    if (result.success) setCurrent("paid");
    setLoading(false);
  }

  if (current === "paid") {
    return (
      <div style={{ marginTop:20, borderRadius:14, background:C.pale, padding:16, textAlign:"center" }}>
        <div style={{ fontSize:22, marginBottom:4 }}>✓</div>
        <p style={{ fontFamily:"var(--font-display)", fontWeight:600, color:C.dark, fontSize:14 }}>
          Pagamento confirmado!
        </p>
      </div>
    );
  }

  if (current === "approved") {
    return (
      <div style={{ marginTop:20, display:"flex", flexDirection:"column", gap:10 }}>
        {pixLink && (
          <a
            href={pixLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display:"block", textAlign:"center", background:C.primary, color:"#fff", fontWeight:600, fontFamily:"var(--font-display)", fontSize:14, padding:"13px 0", borderRadius:12, textDecoration:"none" }}
          >
            Pagar com PIX
          </a>
        )}
        <button
          onClick={handlePaid}
          disabled={loading}
          style={{ background:"transparent", border:`1px solid ${C.primary}`, color:C.primary, fontWeight:600, fontFamily:"var(--font-display)", fontSize:13, padding:"11px 0", borderRadius:12, cursor:"pointer" }}
        >
          {loading ? "Confirmando…" : "Já paguei — confirmar"}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleApprove}
      disabled={loading}
      style={{ marginTop:20, width:"100%", background:C.primary, color:"#fff", fontWeight:600, fontFamily:"var(--font-display)", fontSize:14, padding:"14px 0", borderRadius:12, border:"none", cursor:loading?"not-allowed":"pointer", opacity:loading?0.7:1 }}
    >
      {loading ? "Aprovando…" : "Aprovar orçamento"}
    </button>
  );
}
