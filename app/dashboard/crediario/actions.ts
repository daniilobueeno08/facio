"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getContasAbertas() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("contas_receber")
    .select(`
      id, valor_total, valor_pago, data_vencimento, status, created_at,
      clients ( id, nome, whatsapp, saldo_devedor, limite_credito )
    `)
    .in("status", ["pendente", "parcial"])
    .order("data_vencimento", { ascending: true });
  return data ?? [];
}

export async function getExtratoCliente(clientId: string) {
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id, nome, whatsapp, saldo_devedor, limite_credito")
    .eq("id", clientId)
    .single();

  const { data: contas } = await supabase
    .from("contas_receber")
    .select(`
      id, valor_total, valor_pago, data_vencimento, status, created_at, quote_id,
      historico_pagamentos ( id, valor, metodo_pagamento, data_pagamento, observacao )
    `)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  return { client, contas: contas ?? [] };
}

export async function receberPagamento(
  contaId: string,
  valorStr: string,
  metodoPagamento: string,
  observacao?: string,
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const valor = parseFloat(valorStr.replace(",", "."));
  if (isNaN(valor) || valor <= 0) return { error: "Informe um valor válido." };

  const { data: conta } = await supabase
    .from("contas_receber")
    .select("*")
    .eq("id", contaId)
    .eq("user_id", user.id)
    .single();

  if (!conta) return { error: "Conta não encontrada." };
  if (conta.status === "quitado") return { error: "Esta conta já está quitada." };

  const valorRestante = Number(conta.valor_total) - Number(conta.valor_pago);
  if (valor > valorRestante + 0.01) {
    return { error: `Valor máximo: R$ ${valorRestante.toFixed(2)}` };
  }

  const novoValorPago = Math.min(Number(conta.valor_pago) + valor, Number(conta.valor_total));
  const novoStatus    = novoValorPago >= Number(conta.valor_total) ? "quitado" : "parcial";

  await supabase.from("historico_pagamentos").insert({
    conta_receber_id: contaId,
    valor,
    metodo_pagamento: metodoPagamento || "dinheiro",
    observacao: observacao || null,
  });

  await supabase
    .from("contas_receber")
    .update({ valor_pago: novoValorPago, status: novoStatus })
    .eq("id", contaId);

  if (novoStatus === "quitado" && conta.quote_id) {
    await supabase
      .from("quotes")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", conta.quote_id);

    await supabase.from("interactions").insert({
      client_id: conta.client_id,
      quote_id:  conta.quote_id,
      tipo:      "pagamento",
    });
  }

  const { data: clientData } = await supabase
    .from("clients")
    .select("saldo_devedor")
    .eq("id", conta.client_id)
    .single();

  await supabase
    .from("clients")
    .update({ saldo_devedor: Math.max(0, Number(clientData?.saldo_devedor ?? 0) - valor) })
    .eq("id", conta.client_id);

  revalidatePath("/dashboard/crediario");
  revalidatePath(`/dashboard/crediario/${conta.client_id}`);
  revalidatePath("/dashboard/historico");
  return { success: true, quitado: novoStatus === "quitado" };
}
