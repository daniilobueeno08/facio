import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const C = { bg:"#FFFFFF", surface:"#F4F6F3", text:"#1A1A2E", muted:"#6B7280", border:"#E5E7EB", primary:"#639922", navy:"#1A1A2E", amber:"#92400E", amberBg:"#FEF3C7" };

const STATUS_PT: Record<string, string> = {
  draft: "Rascunho", sent: "Enviado", approved: "Aprovado", paid: "Pago", cancelled: "Cancelado",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("nome").eq("id", user?.id).single();

  const { data: quotes } = await supabase
    .from("quotes")
    .select("id, status, total, pdf_url, created_at, clients(nome)")
    .order("created_at", { ascending: false })
    .limit(10);

  // Alerta: contas a receber pendentes/parciais (crediário provisionado, não pago)
  const { data: contasAbertas } = await supabase
    .from("contas_receber")
    .select("id, valor_total, valor_pago, data_vencimento, clients(nome)")
    .in("status", ["pendente", "parcial"]);

  const totalEmAberto = (contasAbertas ?? []).reduce(
    (s, c) => s + (Number(c.valor_total) - Number(c.valor_pago)), 0
  );
  const qtdAbertas = contasAbertas?.length ?? 0;

  // Vencidas (data_vencimento no passado)
  const hoje = new Date().toISOString().slice(0, 10);
  const vencidas = (contasAbertas ?? []).filter(
    (c) => c.data_vencimento && (c.data_vencimento as string) < hoje
  );

  return (
    <main style={{ minHeight:"100vh", background:C.surface }}>
      <header style={{ background:C.bg, borderBottom:`1px solid ${C.border}`, padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:18, color:C.navy }}>
          fa<span style={{ color:C.primary }}>c</span>io
        </span>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          {/* Sino de alerta */}
          <Link href="/dashboard/crediario" style={{ position:"relative", textDecoration:"none", fontSize:20, lineHeight:1 }} aria-label="Alertas de crediário">
            🔔
            {qtdAbertas > 0 && (
              <span style={{ position:"absolute", top:-6, right:-8, background:"#EF4444", color:"#fff", fontSize:10, fontWeight:700, borderRadius:99, minWidth:16, height:16, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 4px" }}>
                {qtdAbertas}
              </span>
            )}
          </Link>
          <form action="/api/auth/signout" method="post">
            <button type="submit" style={{ fontSize:13, color:C.muted, background:"none", border:"none", cursor:"pointer" }}>Sair</button>
          </form>
        </div>
      </header>

      <div style={{ maxWidth:520, margin:"0 auto", padding:"24px 20px" }}>
        <h1 style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:22, color:C.navy, marginBottom:4 }}>Olá, {profile?.nome ?? ""}</h1>
        <p style={{ fontSize:13, color:C.muted, marginBottom:20 }}>Seus orçamentos recentes</p>

        {/* Card de alerta de crediário em aberto */}
        {qtdAbertas > 0 && (
          <Link href="/dashboard/crediario" style={{ textDecoration:"none" }}>
            <div style={{ background:C.amberBg, border:"1px solid #FDE68A", borderRadius:14, padding:"14px 16px", marginBottom:16, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:C.amber, display:"flex", alignItems:"center", gap:6 }}>
                  ⚠️ {qtdAbertas} {qtdAbertas === 1 ? "conta em aberto" : "contas em aberto"}
                </div>
                <div style={{ fontSize:11, color:C.amber, marginTop:2, opacity:0.85 }}>
                  {vencidas.length > 0 ? `${vencidas.length} vencida${vencidas.length > 1 ? "s" : ""} · ` : ""}
                  Aguardando pagamento
                </div>
              </div>
              <div style={{ fontSize:16, fontWeight:700, color:C.amber }}>
                R$ {totalEmAberto.toFixed(2)}
              </div>
            </div>
          </Link>
        )}

        <Link href="/dashboard/novo-orcamento" style={{ textDecoration:"none" }}>
          <div style={{ background:C.primary, color:"#fff", borderRadius:14, padding:"16px 20px", textAlign:"center", fontFamily:"var(--font-display)", fontWeight:600, fontSize:14, marginBottom:12 }}>+ Novo orçamento</div>
        </Link>

        <Link href="/dashboard/historico" style={{ textDecoration:"none" }}>
          <div style={{ background:C.bg, border:`1px solid ${C.border}`, color:C.navy, borderRadius:14, padding:"14px 20px", textAlign:"center", fontFamily:"var(--font-display)", fontWeight:600, fontSize:13, marginBottom:10 }}>Ver orçamentos</div>
        </Link>

        <Link href="/dashboard/crediario" style={{ textDecoration:"none" }}>
          <div style={{ background:C.bg, border:`1px solid ${C.border}`, color:C.muted, borderRadius:14, padding:"14px 20px", textAlign:"center", fontFamily:"var(--font-display)", fontWeight:600, fontSize:13, marginBottom:24 }}>🤝 Crediário — Contas a Receber</div>
        </Link>

        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {(quotes ?? []).map((q) => {
            const client = q.clients as unknown as { nome:string } | null;
            const href = q.pdf_url ?? "/dashboard/historico";
            const isExternal = Boolean(q.pdf_url);
            return (
              <Link key={q.id} href={href} target={isExternal ? "_blank" : undefined} rel={isExternal ? "noopener noreferrer" : undefined} style={{ textDecoration:"none", background:C.bg, border:`1px solid ${C.border}`, borderRadius:14, padding:"14px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{client?.nome ?? "Cliente"}</div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{STATUS_PT[q.status] ?? q.status}{!q.pdf_url && " · sem PDF"}</div>
                </div>
                <div style={{ fontSize:14, fontWeight:600, color:C.primary }}>R$ {Number(q.total).toFixed(2)}</div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
