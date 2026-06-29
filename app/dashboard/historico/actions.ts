"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function deleteQuote(quoteId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const { error } = await supabase
    .from("quotes").delete()
    .eq("id", quoteId).eq("user_id", user.id);

  if (error) return { error: "Não foi possível apagar o orçamento." };
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/historico");
  return { success: true };
}

/**
 * Marca como pago.
 * - À vista (isCrediario=false): status vira 'paid' direto.
 * - Crediário (isCrediario=true): status vira 'approved' (fica "em aberto"),
 *   cria conta_receber com o valor total e incrementa saldo_devedor do cliente.
 *   A baixa do pagamento é feita depois no extrato.
 */
export async function markQuoteAsPaid(
  quoteId: string,
  clientId: string,
  isCrediario = false,
  vencimento: string | null = null,
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const { data: quote } = await supabase
    .from("quotes").select("total").eq("id", quoteId).eq("user_id", user.id).single();
  if (!quote) return { error: "Orçamento não encontrado." };

  if (isCrediario) {
    // Marca como crediário e mantém aprovado (conta em aberto)
    await supabase
      .from("quotes")
      .update({ status: "approved", forma_pagamento: "crediario", data_vencimento: vencimento })
      .eq("id", quoteId).eq("user_id", user.id);

    await supabase.from("contas_receber").insert({
      user_id: user.id, client_id: clientId, quote_id: quoteId,
      valor_total: quote.total, valor_pago: 0,
      data_vencimento: vencimento, status: "pendente",
    });

    const { data: c } = await supabase.from("clients").select("saldo_devedor").eq("id", clientId).single();
    await supabase.from("clients")
      .update({ saldo_devedor: Number(c?.saldo_devedor ?? 0) + Number(quote.total) })
      .eq("id", clientId);
  } else {
    // À vista: paga direto
    await supabase
      .from("quotes")
      .update({ status: "paid", paid_at: new Date().toISOString(), forma_pagamento: "avista" })
      .eq("id", quoteId).eq("user_id", user.id);

    await supabase.from("interactions").insert({
      client_id: clientId, quote_id: quoteId, tipo: "pagamento",
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/historico");
  revalidatePath("/dashboard/crediario");
  return { success: true };
}

export async function cancelQuote(quoteId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const { error } = await supabase
    .from("quotes").update({ status: "cancelled" })
    .eq("id", quoteId).eq("user_id", user.id);

  if (error) return { error: "Não foi possível cancelar o orçamento." };
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/historico");
  return { success: true };
}

export async function reactivateQuote(quoteId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const { error } = await supabase
    .from("quotes").update({ status: "draft" })
    .eq("id", quoteId).eq("user_id", user.id);

  if (error) return { error: "Não foi possível reativar o orçamento." };
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/historico");
  return { success: true };
}

export async function approveQuote(quoteId: string, clientId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const { error } = await supabase
    .from("quotes").update({ status: "approved" })
    .eq("id", quoteId).eq("user_id", user.id);

  if (error) return { error: "Não foi possível aprovar o orçamento." };

  await supabase.from("interactions").insert({
    client_id: clientId, quote_id: quoteId, tipo: "aprovacao",
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/historico");
  return { success: true };
}

export async function getQuoteForEdit(quoteId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("quotes")
    .select(`id, status, notes, clients(nome, whatsapp), quote_items(id, descricao, quantidade, valor_unit)`)
    .eq("id", quoteId).eq("user_id", user.id).single();

  return data;
}

export async function updateQuote(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const quoteId  = formData.get("quote_id")   as string;
  const itemsRaw = formData.get("items_json") as string;

  const { data: existing } = await supabase
    .from("quotes").select("status").eq("id", quoteId).eq("user_id", user.id).single();

  if (!existing) return { error: "Orçamento não encontrado." };
  if (existing.status === "approved" || existing.status === "paid") {
    return { error: "Este orçamento já foi finalizado e não pode mais ser editado." };
  }

  const items = JSON.parse(itemsRaw) as Array<{ descricao: string; quantidade: number; valor_unit: number }>;
  if (items.length === 0) return { error: "Adicione ao menos um serviço." };

  const total = items.reduce((sum, i) => sum + i.quantidade * i.valor_unit, 0);

  await supabase.from("quotes").update({ total }).eq("id", quoteId);
  await supabase.from("quote_items").delete().eq("quote_id", quoteId);
  await supabase.from("quote_items").insert(
    items.map((i) => ({ quote_id: quoteId, descricao: i.descricao, quantidade: i.quantidade, valor_unit: i.valor_unit }))
  );

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/historico");
  redirect("/dashboard/historico");
}
