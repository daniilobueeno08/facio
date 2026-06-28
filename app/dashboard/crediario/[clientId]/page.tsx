import { createClient, createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import ExtratoCliente from "./ExtratoCliente";

const C = { bg:"#FFFFFF", surface:"#F4F6F3", muted:"#6B7280", border:"#E5E7EB", navy:"#1A1A2E" };

export default async function ExtratoPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  const supabase = createServiceClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id, nome, whatsapp, saldo_devedor, limite_credito")
    .eq("id", clientId)
    .single();

  if (!client) notFound();

  const { data: contas } = await supabase
    .from("contas_receber")
    .select(`
      id, valor_total, valor_pago, data_vencimento, status, created_at, quote_id,
      historico_pagamentos ( id, valor, metodo_pagamento, data_pagamento, observacao )
    `)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  type Pagamento = {
    id: string; valor: number; metodo_pagamento: string;
    data_pagamento: string; observacao: string | null;
  };
  type Conta = {
    id: string; valor_total: number; valor_pago: number;
    data_vencimento: string | null; status: string;
    created_at: string; quote_id: string | null;
    historico_pagamentos: Pagamento[];
  };

  const normalized: Conta[] = (contas ?? []).map((c) => ({
    id: c.id,
    valor_total: Number(c.valor_total),
    valor_pago: Number(c.valor_pago),
    data_vencimento: c.data_vencimento as string | null,
    status: c.status,
    created_at: c.created_at,
    quote_id: c.quote_id as string | null,
    historico_pagamentos: (c.historico_pagamentos ?? []) as Pagamento[],
  }));

  return (
    <main style={{ minHeight:"100vh", background:C.surface }}>
      <header style={{ background:C.bg, borderBottom:`1px solid ${C.border}`, padding:"16px 20px", display:"flex", alignItems:"center", gap:12 }}>
        <Link href="/dashboard/crediario" style={{ color:C.muted, textDecoration:"none", fontSize:18 }}>←</Link>
        <div>
          <span style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:16, color:C.navy }}>
            {client.nome}
          </span>
          <span style={{ fontSize:12, color:C.muted, marginLeft:8 }}>{client.whatsapp}</span>
        </div>
      </header>

      <ExtratoCliente
        clientId={client.id}
        clientName={client.nome}
        saldoDevedor={Number(client.saldo_devedor)}
        limiteCredito={Number(client.limite_credito)}
        contas={normalized}
      />
    </main>
  );
}
