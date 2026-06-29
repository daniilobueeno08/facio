import { createClient } from "@/lib/supabase/server";
import HistoricoKanban, { type QuoteData } from "./HistoricoKanban";

export const dynamic = "force-dynamic";

export default async function HistoricoPage() {
  const supabase = await createClient();

  const { data: quotes } = await supabase
    .from("quotes")
    .select(`
      id, status, total, pdf_url, created_at, paid_at, forma_pagamento,
      clients ( id, nome, whatsapp )
    `)
    .order("created_at", { ascending: false });

  const normalized: QuoteData[] = (quotes ?? []).map((q) => {
    const client = q.clients as unknown as { id: string; nome: string; whatsapp: string } | null;
    return {
      id: q.id,
      status: q.status,
      total: Number(q.total),
      pdfUrl: q.pdf_url as string | null,
      createdAt: q.created_at,
      paidAt: q.paid_at as string | null,
      clientId: client?.id ?? "",
      clientName: client?.nome ?? "Cliente",
      clientWhatsapp: client?.whatsapp ?? "",
      formaPagamento: q.forma_pagamento as string | undefined,
    };
  });

  return <HistoricoKanban quotes={normalized} />;
}
