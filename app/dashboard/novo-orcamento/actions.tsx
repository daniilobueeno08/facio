"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { normalizePhone, isValidWhatsapp } from "@/lib/validation";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { renderToBuffer } from "@react-pdf/renderer";
import { QuotePdfDocument, type QuotePdfData } from "@/lib/pdf/QuotePdfDocument";

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

  const clientNameRaw     = formData.get("client_name")     as string;
  const clientWhatsappRaw = formData.get("client_whatsapp") as string;
  const itemsRaw          = formData.get("items_json")      as string;

  const clientName = clientNameRaw?.trim();
  const clientWhatsapp = normalizePhone(clientWhatsappRaw ?? "");

  if (!clientName || !clientWhatsappRaw || !itemsRaw) {
    return { error: "Preencha o cliente e ao menos um item." };
  }
  if (!isValidWhatsapp(clientWhatsappRaw)) {
    return { error: "WhatsApp do cliente inválido." };
  }

  const items = JSON.parse(itemsRaw) as Array<{ descricao: string; quantidade: number; valor_unit: number }>;
  if (!Array.isArray(items) || items.length === 0) {
    return { error: "Adicione ao menos um serviço ao orçamento." };
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

  // 1. cria (ou reaproveita) o cliente
  const { data: existingClient, error: existingClientError } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .eq("whatsapp", clientWhatsapp)
    .maybeSingle();

  if (existingClientError) {
    console.error("Erro ao verificar cliente:", existingClientError);
    const details = [existingClientError.message, existingClientError.details, existingClientError.hint]
      .filter(Boolean)
      .join(" | ");
    return { error: `Não foi possível verificar o cliente: ${details || JSON.stringify(existingClientError)}` };
  }

  let clientId = existingClient?.id;

  if (!clientId) {
    const { data: newClient, error: clientError } = await supabase
      .from("clients")
      .insert({ user_id: user.id, nome: clientName, whatsapp: clientWhatsapp })
      .select("id")
      .single();

    if (clientError) {
      console.error("Erro ao salvar cliente:", clientError);
      const details = [clientError.message, clientError.details, clientError.hint]
        .filter(Boolean)
        .join(" | ");
      return { error: `Não foi possível salvar o cliente: ${details || JSON.stringify(clientError)}` };
    }

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

  // 5. gera o PDF automaticamente, sem precisar de um clique extra do usuário
  const { data: profile } = await supabase
    .from("profiles")
    .select("nome, whatsapp")
    .eq("id", user.id)
    .single();

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://facio.app";

  const pdfData: QuotePdfData = {
    providerName:  profile?.nome     ?? "Prestador",
    providerWhats: profile?.whatsapp ?? "",
    clientName,
    clientWhats:   clientWhatsapp,
    status:        "sent",
    total,
    notes:         null,
    createdAt:     new Date().toISOString(),
    items: items.map((i) => ({ ...i, subtotal: i.quantidade * i.valor_unit })),
    publicUrl:     `${baseUrl}/o/${quote.slug}`,
  };

  let pdfUrl: string | null = null;

  try {
    const pdfBuffer = await renderToBuffer(<QuotePdfDocument data={pdfData} />);
    const admin     = createServiceClient();
    const filePath  = `${user.id}/${quote.slug}.pdf`;

    const { error: uploadError } = await admin.storage
      .from("quotes")
      .upload(filePath, pdfBuffer, { contentType: "application/pdf", upsert: true });

    if (!uploadError) {
      const { data: publicUrlData } = admin.storage.from("quotes").getPublicUrl(filePath);
      pdfUrl = publicUrlData.publicUrl;
      await admin.from("quotes").update({ pdf_url: pdfUrl }).eq("id", quote.id);
    }
  } catch {
    // se a geração falhar, o usuário ainda pode gerar manualmente na tela final
    pdfUrl = null;
  }

  const redirectUrl = pdfUrl
    ? `/dashboard/orcamento-criado?id=${quote.id}&pdfUrl=${encodeURIComponent(pdfUrl)}`
    : `/dashboard/orcamento-criado?id=${quote.id}`;

  redirect(redirectUrl);
}

export async function getServiceCatalog() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("service_catalog")
    .select("id, nome, valor_higienizacao, valor_blindagem, valor_combo")
    .order("nome");
  return data ?? [];
}

export async function addCatalogItem(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const nome              = (formData.get("nome") as string)?.trim();
  const valorHigienizacao = parseFloat(formData.get("valor_higienizacao") as string);
  const valorBlindagemRaw = formData.get("valor_blindagem") as string;
  const valorComboRaw     = formData.get("valor_combo") as string;

  if (!nome) return { error: "Informe o nome do serviço." };
  if (!valorHigienizacao || valorHigienizacao <= 0) {
    return { error: "Informe o valor de higienização — é obrigatório." };
  }

  const valorBlindagem = valorBlindagemRaw ? parseFloat(valorBlindagemRaw) : null;
  const valorCombo     = valorComboRaw     ? parseFloat(valorComboRaw)     : null;

  const { error } = await supabase.from("service_catalog").insert({
    user_id: user.id,
    nome,
    valor_higienizacao: valorHigienizacao,
    valor_blindagem: valorBlindagem,
    valor_combo: valorCombo,
  });

  if (error) return { error: "Não foi possível salvar o serviço." };

  revalidatePath("/dashboard/catalogo");
  revalidatePath("/dashboard/novo-orcamento");
  return { success: true };
}

export async function deleteCatalogItem(itemId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const { error } = await supabase
    .from("service_catalog")
    .delete()
    .eq("id", itemId)
    .eq("user_id", user.id);

  if (error) return { error: "Não foi possível remover o serviço." };

  revalidatePath("/dashboard/catalogo");
  revalidatePath("/dashboard/novo-orcamento");
  return { success: true };
}
