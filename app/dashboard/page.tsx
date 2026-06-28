import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const C = { bg:"#FFFFFF", surface:"#F4F6F3", text:"#1A1A2E", muted:"#6B7280", border:"#E5E7EB", primary:"#639922", navy:"#1A1A2E" };

const STATUS_PT: Record<string, string> = {
  draft: "Rascunho", sent: "Enviado", approved: "Aprovado", paid: "Pago", cancelled: "Cancelado",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("nome").eq("id", user?.id).single();
  const { data: quotes } = await supabase.from("quotes").select("id, status, total, pdf_url, created_at, clients(nome)").order("created_at", { ascending: false }).limit(10);

  return (
    <main style={{ minHeight:"100vh", background:C.surface }}>
      <header style={{ background:C.bg, borderBottom:`1px solid ${C.border}`, padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:18, color:C.navy }}>
          fa<span style={{ color:C.primary }}>c</span>io
        </span>
        <form action="/api/auth/signout" method="post">
          <button type="submit" style={{ fontSize:13, color:C.muted, background:"none", border:"none", cursor:"pointer" }}>Sair</button>
        </form>
      </header>
      <div style={{ maxWidth:520, margin:"0 auto", padding:"24px 20px" }}>
        <h1 style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:22, color:C.navy, marginBottom:4 }}>Olá, {profile?.nome ?? ""}</h1>
        <p style={{ fontSize:13, color:C.muted, marginBottom:24 }}>Seus orçamentos recentes</p>
        <Link href="/dashboard/novo-orcamento" style={{ textDecoration:"none" }}>
          <div style={{ background:C.primary, color:"#fff", borderRadius:14, padding:"16px 20px", textAlign:"center", fontFamily:"var(--font-display)", fontWeight:600, fontSize:14, marginBottom:12 }}>+ Novo orçamento</div>
        </Link>
        <Link href="/dashboard/historico" style={{ textDecoration:"none" }}>
          <div style={{ background:C.bg, border:`1px solid ${C.border}`, color:C.navy, borderRadius:14, padding:"14px 20px", textAlign:"center", fontFamily:"var(--font-display)", fontWeight:600, fontSize:13, marginBottom:10 }}>Ver histórico completo</div>
        </Link>
        <Link href="/dashboard/catalogo" style={{ textDecoration:"none" }}>
          <div style={{ background:C.bg, border:`1px solid ${C.border}`, color:C.muted, borderRadius:14, padding:"14px 20px", textAlign:"center", fontFamily:"var(--font-display)", fontWeight:600, fontSize:13, marginBottom:24 }}>Gerenciar catálogo de serviços</div>
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
