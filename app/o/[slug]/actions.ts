"use server";

import { createServiceClient } from "@/lib/supabase/server";

/**
 * Ações públicas — chamadas pelo CLIENTE FINAL, sem login.
 * Usam o service client (ignora RLS) porque o acesso já foi
 * validado pelo conhecimento do slug único do orçamento.
 */

export async function approveQuote(quoteId: string, clientId: string) {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("quotes")
    .update({ status: "approved" })
    .eq("id", quoteId);

  if (error) {
    return { success: false, error: "Não foi possível aprovar o orçamento." };
  }

  await supabase.from("interactions").insert({
    client_id: clientId,
    quote_id: quoteId,
    tipo: "aprovacao",
  });

  return { success: true };
}

export async function markAsPaid(quoteId: string, clientId: string) {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("quotes")
    .update({ status: "paid" })
    .eq("id", quoteId);

  if (error) {
    return { success: false, error: "Não foi possível confirmar o pagamento." };
  }

  await supabase.from("interactions").insert({
    client_id: clientId,
    quote_id: quoteId,
    tipo: "pagamento",
  });

  return { success: true };
}
