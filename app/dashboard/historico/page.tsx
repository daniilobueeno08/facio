import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import HistoricoTabs from "./HistoricoTabs";

const C = { bg:"#FFFFFF", surface:"#F4F6F3", text:"#1A1A2E", muted:"#6B7280", border:"#E5E7EB", primary:"#639922", navy:"#1A1A2E" };

export default async function HistoricoPage() {
  const supabase = await createClient();

  const { data: quotes } = await supabase
    .from("quotes")
    .select("id, slug, status, total, pdf_url, created_at, paid_at, client_id, clients(nome, whatsapp)")
    .order("created_at", { ascending: false });

  const normalized = (quotes ?? []).map((q) => {
    const client = q.clients as unknown as { nome:string; whatsapp:string } | null;
    return {
      id: q.id,
      status: q.status as "draft" | "sent" | "approved" | "paid" | "cancelled",
      total: Number(q.total),
      pdfUrl: q.pdf_url as string | null,
      createdAt: q.created_at as string,
      paidAt: q.paid_at as string | null,
      clientId: q.client_id as string,
      clientName: client?.nome ?? "Cliente",
      clientWhatsapp: client?.whatsapp ?? "",
    };
  });

  return (
    <main style={{ minHeight:"100vh", background:C.surface }}>
      <header style={{ background:C.bg, borderBottom:`1px solid ${C.border}`, padding:"16px 20px", display:"flex", alignItems:"center", gap:12 }}>
        <Link href="/dashboard" style={{ color:C.muted, textDecoration:"none", fontSize:18 }}>←</Link>
        <span style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:16, color:C.navy }}>
          Histórico de orçamentos
        </span>
      </header>

      <HistoricoTabs quotes={normalized} />
    </main>
  );
}
