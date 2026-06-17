import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import QuoteRow from "./QuoteRow";

const C = { bg:"#FFFFFF", surface:"#F4F6F3", text:"#1A1A2E", muted:"#6B7280", border:"#E5E7EB", primary:"#639922", navy:"#1A1A2E" };

export default async function HistoricoPage() {
  const supabase = await createClient();

  const { data: quotes } = await supabase
    .from("quotes")
    .select("id, slug, status, total, pdf_url, created_at, paid_at, client_id, clients(nome, whatsapp)")
    .order("created_at", { ascending: false });

  return (
    <main style={{ minHeight:"100vh", background:C.surface }}>
      <header style={{ background:C.bg, borderBottom:`1px solid ${C.border}`, padding:"16px 20px", display:"flex", alignItems:"center", gap:12 }}>
        <Link href="/dashboard" style={{ color:C.muted, textDecoration:"none", fontSize:18 }}>←</Link>
        <span style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:16, color:C.navy }}>
          Histórico de orçamentos
        </span>
      </header>

      <div style={{ maxWidth:520, margin:"0 auto", padding:"20px" }}>
        {(!quotes || quotes.length === 0) && (
          <p style={{ fontSize:13, color:C.muted, textAlign:"center", padding:"40px 0" }}>
            Nenhum orçamento criado ainda.
          </p>
        )}

        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {(quotes ?? []).map((q) => {
            const client = q.clients as unknown as { nome:string; whatsapp:string } | null;
            return (
              <QuoteRow
                key={q.id}
                id={q.id}
                slug={q.slug}
                status={q.status}
                total={Number(q.total)}
                pdfUrl={q.pdf_url}
                createdAt={q.created_at}
                paidAt={q.paid_at}
                clientId={q.client_id}
                clientName={client?.nome ?? "Cliente"}
              />
            );
          })}
        </div>
      </div>
    </main>
  );
}
