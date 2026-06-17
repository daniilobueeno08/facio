import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createServiceClient, createClient } from "@/lib/supabase/server";
import { QuotePdfDocument, type QuotePdfData } from "@/lib/pdf/QuotePdfDocument";

export async function POST(request: NextRequest) {
  const { quoteId } = await request.json();

  if (!quoteId) {
    return NextResponse.json({ error: "quoteId é obrigatório." }, { status: 400 });
  }

  // valida que o orçamento pertence ao usuário logado
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const admin = createServiceClient();

  const { data: quote, error: quoteError } = await admin
    .from("quotes")
    .select(`
      id, slug, status, total, notes, created_at, user_id,
      clients ( nome, whatsapp ),
      profiles ( nome, whatsapp ),
      quote_items ( descricao, quantidade, valor_unit, subtotal )
    `)
    .eq("id", quoteId)
    .single();

  if (quoteError || !quote) {
    return NextResponse.json({ error: "Orçamento não encontrado." }, { status: 404 });
  }

  if (quote.user_id !== user.id) {
    return NextResponse.json({ error: "Sem permissão para este orçamento." }, { status: 403 });
  }

  const client   = quote.clients   as unknown as { nome: string; whatsapp: string } | null;
  const provider = quote.profiles  as unknown as { nome: string; whatsapp: string } | null;
  const items    = (quote.quote_items ?? []) as Array<{ descricao: string; quantidade: number; valor_unit: number; subtotal: number }>;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://facio.app";

  const pdfData: QuotePdfData = {
    providerName:  provider?.nome  ?? "Prestador",
    providerWhats: provider?.whatsapp ?? "",
    clientName:    client?.nome    ?? "Cliente",
    clientWhats:   client?.whatsapp ?? "",
    status:        quote.status,
    total:         Number(quote.total),
    notes:         quote.notes,
    createdAt:     quote.created_at,
    items,
    publicUrl:     `${baseUrl}/o/${quote.slug}`,
  };

  // gera o PDF em memória
  const pdfBuffer = await renderToBuffer(<QuotePdfDocument data={pdfData} />);

  // salva no Storage do Supabase, no bucket "quotes" (precisa existir)
  const filePath = `${user.id}/${quote.slug}.pdf`;

  const { error: uploadError } = await admin.storage
    .from("quotes")
    .upload(filePath, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: `Falha ao salvar o PDF: ${uploadError.message}` }, { status: 500 });
  }

  const { data: publicUrlData } = admin.storage.from("quotes").getPublicUrl(filePath);
  const pdfUrl = publicUrlData.publicUrl;

  // atualiza o orçamento com a URL do PDF — fica salvo como histórico
  await admin.from("quotes").update({ pdf_url: pdfUrl }).eq("id", quoteId);

  return NextResponse.json({ pdfUrl });
}
