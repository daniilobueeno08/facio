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

export async function markQuoteAsPaid(
  quoteId: string,
  clientId: string,
  formaPagamento: "avista" | "crediario" = "avista",
  dataVencimento?: string | null,
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  // Busca o total do orçamento (necessário para crediário)
  const { data: quote } = await supabase
    .from("quotes")
    .select("total")
    .eq("id", quoteId)
    .eq("user_id", user.id)
    .single();

  if (!quote) return { error: "Orçamento não encontrado." };

  const { error } = await supabase
    .from("quotes")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", quoteId).eq("user_id", user.id);

  if (error) return { error: "Não foi possível confirmar o pagamento." };

  await supabase.from("interactions").insert({
    client_id: clientId, quote_id: quoteId, tipo: "pagamento",
  });

  // ── Crediário: cria conta a receber, NÃO marca quote como paid ainda ──────
  if (formaPagamento === "crediario") {
    // Reverte o status do quote para "approved" — só vai para "paid" quando quitar
    await supabase
      .from("quotes")
      .update({ status: "approved", paid_at: null })
      .eq("id", quoteId).eq("user_id", user.id);

    await supabase.from("contas_receber").insert({
      user_id:         user.id,
      client_id:       clientId,
      quote_id:        quoteId,
      valor_total:     quote.total,
      valor_pago:      0,
      data_vencimento: dataVencimento ?? null,
      status:          "pendente",
    });

    const { data: clientData } = await supabase
      .from("clients").select("saldo_devedor").eq("id", clientId).single();

    await supabase
      .from("clients")
      .update({ saldo_devedor: Number(clientData?.saldo_devedor ?? 0) + Number(quote.total) })
      .eq("id", clientId);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/historico");
    revalidatePath("/dashboard/crediario");
    return { success: true, isCrediario: true };
  }
  // ────────────────────────────────────────────────────────────────────────

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/historico");
  revalidatePath("/dashboard/crediario");
  return { success: true, isCrediario: false };
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

/**
 * Aprova um orçamento.
 * Se forma_pagamento === 'crediario': cria automaticamente uma conta a receber
 * e incrementa o saldo devedor do cliente.
 */
export async function approveQuote(quoteId: string, clientId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  // Busca dados do orçamento para checar forma de pagamento
  const { data: quote } = await supabase
    .from("quotes")
    .select("id, total, forma_pagamento, data_vencimento")
    .eq("id", quoteId)
    .eq("user_id", user.id)
    .single();

  if (!quote) return { error: "Orçamento não encontrado." };

  const { error } = await supabase
    .from("quotes").update({ status: "approved" })
    .eq("id", quoteId).eq("user_id", user.id);

  if (error) return { error: "Não foi possível aprovar o orçamento." };

  await supabase.from("interactions").insert({
    client_id: clientId, quote_id: quoteId, tipo: "aprovacao",
  });

  // ── Lógica de Crediário ──────────────────────────────────────
  if (quote.forma_pagamento === "crediario") {
    await supabase.from("contas_receber").insert({
      user_id:         user.id,
      client_id:       clientId,
      quote_id:        quoteId,
      valor_total:     quote.total,
      valor_pago:      0,
      data_vencimento: quote.data_vencimento ?? null,
      status:          "pendente",
    });

    const { data: clientData } = await supabase
      .from("clients").select("saldo_devedor").eq("id", clientId).single();

    await supabase
      .from("clients")
      .update({ saldo_devedor: Number(clientData?.saldo_devedor ?? 0) + Number(quote.total) })
      .eq("id", clientId);
  }
  // ─────────────────────────────────────────────────────────

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/historico");
  revalidatePath("/dashboard/crediario");
  return { success: true, isCrediário: quote.forma_pagamento === "crediario" };
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

  const { error: updateError } = await supabase
    .from("quotes").update({ total }).eq("id", quoteId);

  if (updateError) return { error: "Não foi possível atualizar o orçamento." };

  await supabase.from("quote_items").delete().eq("quote_id", quoteId);
  await supabase.from("quote_items").insert(
    items.map((i) => ({ quote_id: quoteId, descricao: i.descricao, quantidade: i.quantidade, valor_unit: i.valor_unit }))
  );

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/historico");
  redirect("/dashboard/historico");
}
