import Link from "next/link";
import GeneratePdfButton from "./GeneratePdfButton";

const C = { bg:"#FFFFFF", surface:"#F4F6F3", text:"#1A1A2E", muted:"#6B7280", border:"#E5E7EB", primary:"#639922", pale:"#EAF3DE", navy:"#1A1A2E" };

export default async function OrcamentoCriadoPage({ searchParams }: { searchParams: Promise<{ id?: string; pdfUrl?: string }> }) {
  const { id, pdfUrl } = await searchParams;

  return (
    <main style={{ minHeight:"100vh", background:C.surface, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ maxWidth:380, width:"100%", textAlign:"center" }}>
        <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
        <h1 style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:18, color:C.navy, marginBottom:6 }}>
          Orçamento criado!
        </h1>
        <p style={{ fontSize:13, color:C.muted, marginBottom:24 }}>
          {pdfUrl
            ? "O PDF já está pronto — envie ao cliente pelo WhatsApp"
            : "Gere o PDF para enviar ao cliente — ele fica salvo aqui como histórico"}
        </p>

        {id ? (
          <GeneratePdfButton quoteId={id} initialPdfUrl={pdfUrl ?? null} />
        ) : (
          <p style={{ fontSize:13, color:"#ef4444" }}>
            Identificador do orçamento não encontrado. Volte ao painel e tente novamente.
          </p>
        )}

        <Link href="/dashboard" style={{ display:"block", fontSize:13, color:C.muted, textDecoration:"none", marginTop:20 }}>
          Voltar ao painel
        </Link>
      </div>
    </main>
  );
}
