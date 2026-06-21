"use client";

import { useState } from "react";

const C = { primary:"#639922", pale:"#EAF3DE", dark:"#3B6D11", muted:"#6B7280", border:"#E5E7EB" };

export default function GeneratePdfButton({
  quoteId, initialPdfUrl,
}: { quoteId: string; initialPdfUrl: string | null }) {
  const [pdfUrl, setPdfUrl]   = useState<string | null>(initialPdfUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function handleGenerate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/gerar-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha ao gerar PDF.");
      setPdfUrl(data.pdfUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendWhatsApp() {
    if (!pdfUrl) return;

    try {
      // Baixa o PDF como blob
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      const file = new File([blob], "orcamento-facio.pdf", { type: "application/pdf" });

      // Tenta compartilhar o arquivo direto via Web Share API (funciona no celular)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Orçamento Facio",
          text: "Segue o orçamento do serviço solicitado.",
        });
        return;
      }
    } catch {
      // se o share nativo falhar, cai no fallback abaixo
    }

    // Fallback: baixa o PDF no dispositivo e abre o WhatsApp
    // O usuário anexa manualmente — mais confiável que link
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = "orcamento-facio.pdf";
    a.click();

    setTimeout(() => {
      window.open("https://wa.me/", "_blank");
    }, 1500);
  }

  if (pdfUrl) {
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display:"block", textAlign:"center", background:"#fff", border:`1px solid ${C.border}`, color:"#1A1A2E", fontWeight:600, fontFamily:"var(--font-display)", fontSize:13, padding:"12px 0", borderRadius:12, textDecoration:"none" }}
        >
          Ver PDF gerado
        </a>
        <button
          onClick={handleSendWhatsApp}
          style={{ display:"block", width:"100%", textAlign:"center", background:C.primary, color:"#fff", fontWeight:600, fontFamily:"var(--font-display)", fontSize:14, padding:"14px 0", borderRadius:12, border:"none", cursor:"pointer" }}
        >
          Enviar PDF pelo WhatsApp
        </button>
        <p style={{ fontSize:11, color:C.muted, textAlign:"center", lineHeight:1.5 }}>
          No celular: o PDF é compartilhado diretamente.<br/>
          No computador: o PDF é baixado para você anexar no WhatsApp.
        </p>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleGenerate}
        disabled={loading}
        style={{ width:"100%", background:C.primary, color:"#fff", fontWeight:600, fontFamily:"var(--font-display)", fontSize:14, padding:"14px 0", borderRadius:12, border:"none", cursor:loading?"not-allowed":"pointer", opacity:loading?0.7:1 }}
      >
        {loading ? "Gerando PDF…" : "Gerar PDF do orçamento"}
      </button>
      {error && <p style={{ fontSize:12, color:"#ef4444", marginTop:8, textAlign:"center" }}>{error}</p>}
    </div>
  );
}
