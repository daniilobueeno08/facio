import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import QuoteActions from "./QuoteActions";

const C = { bg:"#FFFFFF", surface:"#F4F6F3", text:"#1A1A2E", muted:"#6B7280", border:"#E5E7EB", primary:"#639922", pale:"#EAF3DE", navy:"#1A1A2E" };

const STATUS_LABEL: Record<string,string> = {
  draft:    "Rascunho",
  sent:     "Aguardando aprovação",
  approved: "Aprovado — aguardando pagamento",
  paid:     "Pago",
};

export default async function PublicQuotePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = createServiceClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select(`
      id, slug, status, total, pix_link, notes, created_at,
      clients ( id, nome, whatsapp ),
      profiles ( nome, logo_url, whatsapp ),
      quote_items ( id, descricao, quantidade, valor_unit, subtotal )
    `)
    .eq("slug", slug)
    .single();

  if (!quote) notFound();

  const items = (quote.quote_items ?? []) as Array<{ id:string; descricao:string; quantidade:number; valor_unit:number; subtotal:number }>;
  const provider = quote.profiles as unknown as { nome:string; logo_url:string|null; whatsapp:string } | null;
  const client   = quote.clients   as unknown as { id:string; nome:string; whatsapp:string } | null;

  return (
    <main style={{ minHeight:"100vh", background:C.surface, padding:"32px 16px" }}>
      <div style={{ maxWidth:480, margin:"0 auto" }}>

        {/* header da marca do prestador */}
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:20, color:C.navy }}>
            {provider?.nome ?? "Orçamento"}
          </div>
          <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>via Facio</div>
        </div>

        {/* card principal */}
        <div style={{ background:C.bg, borderRadius:20, border:`1px solid ${C.border}`, padding:24 }}>

          {/* status badge */}
          <div style={{
            display:"inline-block", fontSize:11, fontWeight:600, fontFamily:"var(--font-display)",
            padding:"4px 12px", borderRadius:99, marginBottom:16,
            background: quote.status === "paid" ? C.pale : quote.status === "approved" ? "#FEF3C7" : C.surface,
            color: quote.status === "paid" ? "#3B6D11" : quote.status === "approved" ? "#92400E" : C.muted,
          }}>
            {STATUS_LABEL[quote.status] ?? quote.status}
          </div>

          <h1 style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:18, color:C.navy, marginBottom:4 }}>
            Olá, {client?.nome ?? "cliente"}
          </h1>
          <p style={{ fontSize:13, color:C.muted, marginBottom:20 }}>
            Segue o orçamento do serviço solicitado:
          </p>

          {/* itens */}
          <div style={{ borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}`, padding:"12px 0", marginBottom:16 }}>
            {items.map((item) => (
              <div key={item.id} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", fontSize:13 }}>
                <span style={{ color:C.text }}>
                  {item.descricao} {item.quantidade > 1 && <span style={{ color:C.muted }}>× {item.quantidade}</span>}
                </span>
                <span style={{ color:C.text, fontWeight:600, whiteSpace:"nowrap" }}>
                  R$ {Number(item.subtotal).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* total */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <span style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:15, color:C.navy }}>Total</span>
            <span style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:22, color:C.primary }}>
              R$ {Number(quote.total).toFixed(2)}
            </span>
          </div>

          {quote.notes && (
            <p style={{ fontSize:12, color:C.muted, marginTop:12, lineHeight:1.5 }}>{quote.notes}</p>
          )}

          {/* ações do cliente */}
          <QuoteActions
            quoteId={quote.id}
            clientId={client?.id ?? ""}
            status={quote.status}
            pixLink={quote.pix_link}
          />
        </div>

        <p style={{ textAlign:"center", fontSize:11, color:C.muted, marginTop:20 }}>
          Orçamento gerado via Facio · gestão para autônomos
        </p>
      </div>
    </main>
  );
}
