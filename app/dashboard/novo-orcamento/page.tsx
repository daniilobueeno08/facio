"use client";

import { useState } from "react";
import Link from "next/link";
import { createQuote } from "./actions";
import { isValidWhatsapp } from "@/lib/validation";

const C = { bg:"#FFFFFF", surface:"#F4F6F3", text:"#1A1A2E", muted:"#6B7280", border:"#E5E7EB", primary:"#639922", pale:"#EAF3DE", dark:"#3B6D11", navy:"#1A1A2E" };
const inp: React.CSSProperties = { width:"100%", borderRadius:12, border:`1px solid ${C.border}`, background:C.surface, padding:"12px 16px", fontSize:14, color:C.text, outline:"none", fontFamily:"var(--font-body)" };
const errStyle: React.CSSProperties = { border:"1px solid #ef4444" };

type QuoteItem = { descricao:string; quantidade:number; valor_unit:number };

export default function NovoOrcamentoPage() {
  const [items, setItems]             = useState<QuoteItem[]>([]);
  const [error, setError]             = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading]         = useState(false);

  function updateItem(index: number, field: keyof QuoteItem, value: string) {
    setItems((prev) => {
      const next = [...prev];
      if (field === "descricao") next[index].descricao = value;
      else next[index][field] = parseFloat(value) || 0;
      return next;
    });
  }

  const total = items.reduce((s, i) => s + i.quantidade * i.valor_unit, 0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(""); setFieldErrors({});
    const fd = new FormData(e.currentTarget);
    const whatsapp = fd.get("client_whatsapp") as string;
    const fe: Record<string, string> = {};
    if (!fd.get("client_name")) fe.nome = "Informe o nome do cliente.";
    if (!isValidWhatsapp(whatsapp)) fe.whatsapp = "WhatsApp inválido.";
    if (Object.keys(fe).length) { setFieldErrors(fe); return; }
    if (items.length === 0) { setError("Adicione ao menos um serviço."); return; }
    setLoading(true);
    fd.set("items_json", JSON.stringify(items));
    const result = await createQuote(fd);
    if (result?.error) { setError(result.error); setLoading(false); }
  }

  return (
    <main style={{ minHeight:"100vh", background:C.surface, paddingBottom:40 }}>
      <header style={{ background:C.bg, borderBottom:`1px solid ${C.border}`, padding:"16px 20px", display:"flex", alignItems:"center", gap:12 }}>
        <Link href="/dashboard" style={{ color:C.muted, textDecoration:"none", fontSize:18 }}>←</Link>
        <span style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:16, color:C.navy }}>Novo orçamento</span>
      </header>

      <form onSubmit={handleSubmit} style={{ maxWidth:480, margin:"0 auto", padding:"20px" }}>

        {/* CLIENTE */}
        <div style={{ background:C.bg, borderRadius:16, border:`1px solid ${C.border}`, padding:16, marginBottom:16 }}>
          <p style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:13, color:C.navy, marginBottom:10 }}>Cliente</p>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <input type="text" name="client_name" placeholder="Nome do cliente" required style={{ ...inp, ...(fieldErrors.nome ? errStyle : {}) }} />
            {fieldErrors.nome && <p style={{ fontSize:11, color:"#ef4444", marginTop:-6 }}>{fieldErrors.nome}</p>}
            <input type="tel" name="client_whatsapp" placeholder="WhatsApp (DDD) 9 0000-0000" required style={{ ...inp, ...(fieldErrors.whatsapp ? errStyle : {}) }} />
            {fieldErrors.whatsapp && <p style={{ fontSize:11, color:"#ef4444", marginTop:-6 }}>{fieldErrors.whatsapp}</p>}
          </div>
        </div>

        {/* SERVIÇOS */}
        <div style={{ background:C.bg, borderRadius:16, border:`1px solid ${C.border}`, padding:16, marginBottom:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <p style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:13, color:C.navy }}>Serviços</p>
            <button type="button" onClick={() => setItems((p) => [...p, { descricao:"", quantidade:1, valor_unit:0 }])} style={{ fontSize:12, color:C.primary, fontWeight:600, background:"none", border:"none", cursor:"pointer" }}>+ Adicionar item</button>
          </div>
          {items.length === 0 && <p style={{ fontSize:12, color:C.muted, textAlign:"center", padding:"12px 0" }}>Nenhum serviço adicionado ainda</p>}
          {items.map((item, i) => (
            <div key={i} style={{ display:"flex", gap:8, marginBottom:8, alignItems:"center" }}>
              <input type="text" placeholder="Descrição" value={item.descricao} onChange={(e) => updateItem(i, "descricao", e.target.value)} style={{ ...inp, flex:2, padding:"8px 10px", fontSize:13 }} />
              <input type="number" placeholder="Qtd" value={item.quantidade} min={0.1} step={0.1} onChange={(e) => updateItem(i, "quantidade", e.target.value)} style={{ ...inp, width:54, padding:"8px 6px", fontSize:13, textAlign:"center" }} />
              <input type="number" placeholder="R$" value={item.valor_unit||""} min={0} step={0.01} onChange={(e) => updateItem(i, "valor_unit", e.target.value)} style={{ ...inp, width:76, padding:"8px 6px", fontSize:13 }} />
              <button type="button" onClick={() => setItems((p) => p.filter((_,j) => j!==i))} style={{ background:"none", border:"none", color:"#ef4444", fontSize:18, cursor:"pointer", padding:4 }}>×</button>
            </div>
          ))}
        </div>

        {/* TOTAL */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0 4px", marginBottom:20 }}>
          <span style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:14, color:C.navy }}>Total</span>
          <span style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:22, color:C.primary }}>R$ {total.toFixed(2)}</span>
        </div>

        {error && <p style={{ fontSize:13, color:"#ef4444", marginBottom:12, textAlign:"center" }}>{error}</p>}

        <button type="submit" disabled={loading} style={{ width:"100%", background:C.primary, color:"#fff", fontWeight:600, fontFamily:"var(--font-display)", fontSize:15, padding:"16px 0", borderRadius:14, border:"none", cursor:loading?"not-allowed":"pointer", opacity:loading?0.7:1 }}>
          {loading?"Gerando orçamento…":"Gerar orçamento"}
        </button>
      </form>
    </main>
  );
}
