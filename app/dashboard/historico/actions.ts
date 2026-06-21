"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * Apaga um orçamento (e seus itens/interações, via cascade).
 * Permitido em qualquer status — é a única ação possível depois de "paid".
 */
export async function deleteQuote(quoteId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const { error } = await supabase
    .from("quotes")
    .delete()
    .eq("id", quoteId)
    .eq("user_id", user.id); // garante que só apaga o próprio orçamento

  if (error) return { error: "Não foi possível apagar o orçamento." };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/historico");
  return { success: true };
}

/**
 * Marca como pago e grava a data exata do pagamento.
 * Também registra a interação para o histórico do mini-CRM.
 */
export async function markQuoteAsPaid(quoteId: string, clientId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const { error } = await supabase
    .from("quotes")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", quoteId)
    .eq("user_id", user.id);

  if (error) return { error: "Não foi possível confirmar o pagamento." };

  await supabase.from("interactions").insert({
    client_id: clientId,
    quote_id:  quoteId,
    tipo:      "pagamento",
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/historico");
  return { success: true };
}

/**
 * Cancela um orçamento — muda status para 'cancelled' SEM apagar do banco.
 * Diferente de deleteQuote: o registro permanece, só sai do fluxo ativo.
 */
export async function cancelQuote(quoteId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const { error } = await supabase
    .from("quotes")
    .update({ status: "cancelled" })
    .eq("id", quoteId)
    .eq("user_id", user.id);

  if (error) return { error: "Não foi possível cancelar o orçamento." };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/historico");
  return { success: true };
}

/**
 * Reativa um orçamento cancelado ou expirado — volta o status para 'draft'.
 * Evita que o usuário tenha que recriar tudo do zero.
 */
export async function reactivateQuote(quoteId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const { error } = await supabase
    .from("quotes")
    .update({ status: "draft" })
    .eq("id", quoteId)
    .eq("user_id", user.id);

  if (error) return { error: "Não foi possível reativar o orçamento." };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/historico");
  return { success: true };
}

/**
 * Aprova um orçamento — muda status para 'approved' e registra a interação.
 */
export async function approveQuote(quoteId: string, clientId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const { error } = await supabase
    .from("quotes")
    .update({ status: "approved" })
    .eq("id", quoteId)
    .eq("user_id", user.id);

  if (error) return { error: "Não foi possível aprovar o orçamento." };

  await supabase.from("interactions").insert({
    client_id: clientId,
    quote_id:  quoteId,
    tipo:      "aprovacao",
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/historico");
  return { success: true };
}

/**
 * Edita um orçamento — só permitido se status for 'draft' ou 'sent'.
 * Depois de 'approved' ou 'paid', a única ação possível é apagar.
 */
export async function updateQuote(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const quoteId   = formData.get("quote_id")  as string;
  const itemsRaw  = formData.get("items_json") as string;

  const { data: existing } = await supabase
    .from("quotes")
    .select("status")
    .eq("id", quoteId)
    .eq("user_id", user.id)
    .single();

  if (!existing) return { error: "Orçamento não encontrado." };

  if (existing.status === "approved" || existing.status === "paid") {
    return { error: "Este orçamento já foi finalizado e não pode mais ser editado. Você pode apagá-lo." };
  }

  const items = JSON.parse(itemsRaw) as Array<{ descricao: string; quantidade: number; valor_unit: number }>;
  if (!Array.isArray(items) || items.length === 0) {
    return { error: "Adicione ao menos um serviço." };
  }

  for (const [index, item] of items.entries()) {
    const descricao = item?.descricao?.toString().trim() ?? "";
    const quantidade = Number(item?.quantidade ?? 0);
    const valor_unit = Number(item?.valor_unit ?? 0);

    if (!descricao) {
      return { error: `Descrição obrigatória no item ${index + 1}.` };
    }
    if (!(quantidade > 0)) {
      return { error: `Quantidade inválida no item ${index + 1}.` };
    }
    if (!(valor_unit >= 0)) {
      return { error: `Valor inválido no item ${index + 1}.` };
    }

    item.descricao = descricao;
    item.quantidade = quantidade;
    item.valor_unit = valor_unit;
  }

  const total = items.reduce((sum, i) => sum + i.quantidade * i.valor_unit, 0);

  const { error: updateError } = await supabase
    .from("quotes")
    .update({ total })
    .eq("id", quoteId);

  if (updateError) return { error: "Não foi possível atualizar o orçamento." };

  // substitui os itens antigos pelos novos
  await supabase.from("quote_items").delete().eq("quote_id", quoteId);
  await supabase.from("quote_items").insert(
    items.map((i) => ({ quote_id: quoteId, descricao: i.descricao, quantidade: i.quantidade, valor_unit: i.valor_unit }))
  );

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/historico");
  redirect("/dashboard/historico");
}

export async function getQuoteForEdit(quoteId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("quotes")
    .select(`
      id, status, notes,
      clients ( nome, whatsapp ),
      quote_items ( id, descricao, quantidade, valor_unit )
    `)
    .eq("id", quoteId)
    .eq("user_id", user.id)
    .single();

  return data;
}
