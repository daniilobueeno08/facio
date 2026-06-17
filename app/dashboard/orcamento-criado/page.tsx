import Link from "next/link";

const C = { bg:"#FFFFFF", surface:"#F4F6F3", text:"#1A1A2E", muted:"#6B7280", border:"#E5E7EB", primary:"#639922", pale:"#EAF3DE", navy:"#1A1A2E" };

export default async function OrcamentoCriadoPage({ searchParams }: { searchParams: Promise<{ slug?: string }> }) {
  const { slug } = await searchParams;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://facio.app";
  const link = `${baseUrl}/o/${slug}`;
  const whatsappText = encodeURIComponent(`Olá! Aqui está o orçamento do serviço: ${link}`);

  return (
    <main style={{ minHeight:"100vh", background:C.surface, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ maxWidth:380, width:"100%", textAlign:"center" }}>
        <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
        <h1 style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:18, color:C.navy, marginBottom:6 }}>
          Orçamento criado!
        </h1>
        <p style={{ fontSize:13, color:C.muted, marginBottom:24 }}>
          Envie o link abaixo para o seu cliente
        </p>

        <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 14px", fontSize:13, color:C.text, marginBottom:16, wordBreak:"break-all" }}>
          {link}
        </div>

        <a
          href={`https://wa.me/?text=${whatsappText}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display:"block", background:C.primary, color:"#fff", fontWeight:600, fontFamily:"var(--font-display)", fontSize:14, padding:"14px 0", borderRadius:12, textDecoration:"none", marginBottom:12 }}
        >
          Enviar pelo WhatsApp
        </a>

        <Link href="/dashboard" style={{ fontSize:13, color:C.muted, textDecoration:"none" }}>
          Voltar ao painel
        </Link>
      </div>
    </main>
  );
}
