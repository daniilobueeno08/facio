import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import CatalogManager from "./CatalogManager";

const C = { bg:"#FFFFFF", surface:"#F4F6F3", text:"#1A1A2E", muted:"#6B7280", border:"#E5E7EB", navy:"#1A1A2E" };

export default async function CatalogoPage() {
  const supabase = await createClient();

  const { data: items } = await supabase
    .from("service_catalog")
    .select("id, nome, valor_higienizacao, valor_blindagem, valor_combo")
    .order("nome");

  return (
    <main style={{ minHeight:"100vh", background:C.surface }}>
      <header style={{ background:C.bg, borderBottom:`1px solid ${C.border}`, padding:"16px 20px", display:"flex", alignItems:"center", gap:12 }}>
        <Link href="/dashboard" style={{ color:C.muted, textDecoration:"none", fontSize:18 }}>←</Link>
        <span style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:16, color:C.navy }}>
          Catálogo de serviços
        </span>
      </header>

      <CatalogManager initialItems={items ?? []} />
    </main>
  );
}
