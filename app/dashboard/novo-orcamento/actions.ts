"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function generateSlug(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem caracteres ambíguos (0,O,1,I)
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export async function createQuote(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Faça login novamente." };

  const clientName     = formData.get("client_name")     as string;
  const clientWhatsapp = formData.get("client_whatsapp") as string;
  const itemsRaw       = formData.get("items_json")      as string;

  if (!clientName || !clientWhatsapp || !itemsRaw) {
    return { error: "Preencha o cliente e ao menos um item." };
  }

  const items = JSON.parse(itemsRaw) as Array<{ descricao: string; quantidade: number; valor_unit: number }>;
  if (items.length === 0) {
    return { error: "Adicione ao menos um serviço ao orçamento." };
  }

  // 1. cria (ou reaproveita) o cliente
  const { data: existingClient } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .eq("whatsapp", clientWhatsapp)
    .maybeSingle();

  let clientId = existingClient?.id;

  if (!clientId) {
    const { data: newClient, error: clientError } = await supabase
      .from("clients")
      .insert({ user_id: user.id, nome: clientName, whatsapp: clientWhatsapp })
      .select("id")
      .single();
    if (clientError) return { error: "Não foi possível salvar o cliente." };
    clientId = newClient.id;
  }

  // 2. calcula o total e cria o orçamento com slug único
  const total = items.reduce((sum, i) => sum + i.quantidade * i.valor_unit, 0);
  const slug  = generateSlug();

  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .insert({ user_id: user.id, client_id: clientId, slug, status: "sent", total })
    .select("id, slug")
    .single();

  if (quoteError) return { error: "Não foi possível criar o orçamento." };

  // 3. insere os itens
  const itemsToInsert = items.map((i) => ({
    quote_id:   quote.id,
    descricao:  i.descricao,
    quantidade: i.quantidade,
    valor_unit: i.valor_unit,
  }));
  await supabase.from("quote_items").insert(itemsToInsert);

  // 4. registra a interação
  await supabase.from("interactions").insert({
    client_id: clientId,
    quote_id:  quote.id,
    tipo:      "orcamento_enviado",
  });

  redirect(`/dashboard/orcamento-criado?slug=${quote.slug}&id=${quote.id}`);
}

export async function getServiceCatalog() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("service_catalog")
    .select("id, nome, valor")
    .order("nome");
  return data ?? [];
}

export async function addCatalogItem(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const nome  = formData.get("nome")  as string;
  const valor = parseFloat(formData.get("valor") as string);

  if (!nome || !valor) return { error: "Preencha nome e valor do serviço." };

  await supabase.from("service_catalog").insert({ user_id: user.id, nome, valor });
  return { success: true };
}
