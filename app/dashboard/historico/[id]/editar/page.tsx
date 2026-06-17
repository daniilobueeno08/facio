import { getQuoteForEdit } from "../../actions";
import { notFound, redirect } from "next/navigation";
import EditQuoteForm from "./EditQuoteForm";

export default async function EditarOrcamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quote = await getQuoteForEdit(id);

  if (!quote) notFound();

  if (quote.status === "approved" || quote.status === "paid") {
    redirect("/dashboard/historico");
  }

  const client = quote.clients as unknown as { nome: string; whatsapp: string } | null;
  const items  = (quote.quote_items ?? []) as Array<{ id: string; descricao: string; quantidade: number; valor_unit: number }>;

  return (
    <EditQuoteForm
      quoteId={quote.id}
      clientName={client?.nome ?? ""}
      clientWhatsapp={client?.whatsapp ?? ""}
      initialItems={items.map((i) => ({ descricao: i.descricao, quantidade: i.quantidade, valor_unit: i.valor_unit }))}
    />
  );
}
