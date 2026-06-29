import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const C = { bg:"#FFFFFF", surface:"#F4F6F3", text:"#1A1A2E", muted:"#6B7280", border:"#E5E7EB", primary:"#639922", pale:"#EAF3DE", navy:"#1A1A2E" };

export default async function CrediarioPage() {
  const supabase = await createClient();

  const { data: contas } = await supabase
    .from("contas_receber")
    .select(`
      id, valor_total, valor_pago, status,
      clients ( id, nome, limite_credito )
    `)
    .in("status", ["pendente", "parcial"])
    .order("created_at", { ascending: false });

  // Agrupa por cliente — usa valor real em aberto (total - pago), não saldo_devedor
  const mapa = new Map<string, { id:string; nome:string; saldo:number; limite:number; qtd:number }>();
  for (const c of (contas ?? [])) {
    const cl = c.clients as unknown as { id:string; nome:string; limite_credito:number } | null;
    if (!cl) continue;
    const emAberto = Number(c.valor_total) - Number(c.valor_pago);
    if (!mapa.has(cl.id)) {
      mapa.set(cl.id, { id:cl.id, nome:cl.nome, saldo:0, limite:Number(cl.limite_credito), qtd:0 });
    }
    const entry = mapa.get(cl.id)!;
    entry.saldo += emAberto;
    entry.qtd++;
  }

  const clientes = [...mapa.values()].sort((a, b) => b.saldo - a.saldo);
  const totalGeral = clientes.reduce((s, c) => s + c.saldo, 0);

  return (
    <main style={{ minHeight:"100vh", background:C.surface }}>
      <header style={{ background:C.bg, borderBottom:`1px solid ${C.border}`, padding:"16px 20px", display:"flex", alignItems:"center", gap:12 }}>
        <Link href="/dashboard" style={{ color:C.muted, textDecoration:"none", fontSize:18 }}>←</Link>
        <span style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:16, color:C.navy }}>
          Contas a Receber
        </span>
      </header>

      <div style={{ maxWidth:520, margin:"0 auto", padding:"20px" }}>

        {/* Resumo */}
        <div style={{ background:C.navy, borderRadius:16, padding:20, marginBottom:20, textAlign:"center" }}>
          <p style={{ fontSize:12, color:"rgba(255,255,255,0.6)", marginBottom:4 }}>Total a receber</p>
          <p style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:30, color:"#fff" }}>
            R$ {totalGeral.toFixed(2)}
          </p>
          <p style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginTop:4 }}>
            {clientes.length} cliente{clientes.length !== 1 ? "s" : ""} com saldo em aberto
          </p>
        </div>

        {clientes.length === 0 ? (
          <p style={{ fontSize:13, color:C.muted, textAlign:"center", padding:"40px 0" }}>
            Nenhuma conta em aberto.
          </p>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {clientes.map((cl) => {
              const overLimit = cl.limite > 0 && cl.saldo > cl.limite;
              const nearLimit = cl.limite > 0 && !overLimit && cl.saldo >= cl.limite * 0.8;
              return (
                <Link
                  key={cl.id}
                  href={`/dashboard/crediario/${cl.id}`}
                  style={{ textDecoration:"none", background:C.bg, border:`1px solid ${overLimit ? "#FCA5A5" : C.border}`, borderRadius:14, padding:"14px 16px", display:"block" }}
                >
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                    <div>
                      <div style={{ fontSize:14, fontWeight:600, color:C.text }}>{cl.nome}</div>
                      <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>
                        {cl.qtd} conta{cl.qtd !== 1 ? "s" : ""} em aberto
                      </div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:16, fontWeight:700, color:"#991B1B" }}>
                        R$ {cl.saldo.toFixed(2)}
                      </div>
                      {cl.limite > 0 && (
                        <div style={{ fontSize:10, color:C.muted, marginTop:2 }}>
                          Limite: R$ {cl.limite.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Barra de uso do limite */}
                  {cl.limite > 0 && (
                    <div style={{ background:C.surface, borderRadius:99, height:4, overflow:"hidden", marginBottom:4 }}>
                      <div style={{ background: overLimit ? "#EF4444" : nearLimit ? "#F59E0B" : C.primary, height:"100%", width:`${Math.min((cl.saldo / cl.limite) * 100, 100)}%`, borderRadius:99 }} />
                    </div>
                  )}

                  {overLimit && (
                    <p style={{ fontSize:11, color:"#991B1B", marginTop:4 }}>⚠️ Limite de crédito ultrapassado</p>
                  )}
                  {nearLimit && (
                    <p style={{ fontSize:11, color:"#92400E", marginTop:4 }}>⚡ Próximo do limite de crédito</p>
                  )}

                  <div style={{ fontSize:11, color:C.muted, marginTop:6 }}>Ver extrato →</div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
