"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createQuote, getServiceCatalog } from "./actions";
import { isValidWhatsapp } from "@/lib/validation";

const C = { bg:"#FFFFFF", surface:"#F4F6F3", text:"#1A1A2E", muted:"#6B7280", border:"#E5E7EB", primary:"#639922", pale:"#EAF3DE", dark:"#3B6D11", navy:"#1A1A2E" };
const inp: React.CSSProperties = { width:"100%", borderRadius:12, border:`1px solid ${C.border}`, background:C.surface, padding:"12px 16px", fontSize:14, color:C.text, outline:"none", fontFamily:"var(--font-body)" };
const err: React.CSSProperties = { border:"1px solid #ef4444" };

type CatalogItem = { id:string; nome:string; valor_higienizacao:number; valor_blindagem:number|null; valor_combo:number|null };
type QuoteItem   = { descricao:string; quantidade:number; valor_unit:number };

export default function NovoOrcamentoPage() {
  const [catalog, setCatalog]         = useState<CatalogItem[]>([]);
  const [items, setItems]             = useState<QuoteItem[]>([]);
  const [error, setError]             = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading]         = useState(false);
  const [formaPagamento, setFormaPagamento] = useState<"avista" | "crediario">("avista");
  const [dataVencimento, setDataVencimento] = useState("");

  useEffect(() => { getServiceCatalog().then(setCatalog); }, []);

  function addFromCatalog(nome: string, valor: number, tier: string) {
    setItems((prev) => [...prev, { descricao: `${nome} (${tier})`, quantidade: 1, valor_unit: valor }]);
  }

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
    fd.set("forma_pagamento", formaPagamento);
    fd.set("data_vencimento", dataVencimento);
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
            <input type="text" name="client_name" placeholder="Nome do cliente" required style={{ ...inp, ...(fieldErrors.nome ? err : {}) }} />
            {fieldErrors.nome && <p style={{ fontSize:11, color:"#ef4444", marginTop:-6 }}>{fieldErrors.nome}</p>}
            <input type="tel" name="client_whatsapp" placeholder="WhatsApp (DDD) 9 0000-0000" required style={{ ...inp, ...(fieldErrors.whatsapp ? err : {}) }} />
            {fieldErrors.whatsapp && <p style={{ fontSize:11, color:"#ef4444", marginTop:-6 }}>{fieldErrors.whatsapp}</p>}
          </div>
        </div>

        {/* CATÁLOGO */}
        {catalog.length > 0 && (
          <div style={{ background:C.bg, borderRadius:16, border:`1px solid ${C.border}`, padding:16, marginBottom:16, overflow:"hidden" }}>
            <p style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:13, color:C.navy, marginBottom:10 }}>Catálogo — toque no preço para adicionar</p>
            <div style={{ display:"grid", gridTemplateColumns:"1.4fr 0.85fr 0.85fr 0.85fr", gap:6, marginBottom:6, paddingBottom:6, borderBottom:`1px solid ${C.border}` }}>
              {["Serviço","Higien.","Blind.","Combo"].map((h) => (
                <span key={h} style={{ fontSize:10, color:C.muted, fontWeight:600, textAlign: h==="Serviço" ? "left" : "center" }}>{h}</span>
              ))}
            </div>
            {catalog.map((c) => (
              <div key={c.id} style={{ display:"grid", gridTemplateColumns:"1.4fr 0.85fr 0.85fr 0.85fr", gap:6, alignItems:"center", padding:"8px 0", borderBottom:`1px solid ${C.surface}` }}>
                <span style={{ fontSize:12, color:C.text, lineHeight:1.3 }}>{c.nome}</span>
                <button type="button" onClick={() => addFromCatalog(c.nome, c.valor_higienizacao, "Higienização")} style={{ background:C.pale, border:"1px solid rgba(99,153,34,.3)", borderRadius:8, padding:"6px 2px", fontSize:11, fontWeight:600, color:C.dark, cursor:"pointer" }}>
                  {c.valor_higienizacao.toFixed(0)}
                </button>
                {c.valor_blindagem != null ? (
                  <button type="button" onClick={() => addFromCatalog(c.nome, c.valor_blindagem!, "Blindagem")} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 2px", fontSize:11, fontWeight:600, color:C.text, cursor:"pointer" }}>
                    {c.valor_blindagem.toFixed(0)}
                  </button>
                ) : <span style={{ textAlign:"center", fontSize:11, color:"#D1D5DB" }}>—</span>}
                {c.valor_combo != null ? (
                  <button type="button" onClick={() => addFromCatalog(c.nome, c.valor_combo!, "Combo")} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 2px", fontSize:11, fontWeight:600, color:C.text, cursor:"pointer" }}>
                    {c.valor_combo.toFixed(0)}
                  </button>
                ) : <span style={{ textAlign:"center", fontSize:11, color:"#D1D5DB" }}>—</span>}
              </div>
            ))}
            <Link href="/dashboard/catalogo" style={{ display:"block", textAlign:"center", fontSize:11, color:C.muted, textDecoration:"none", marginTop:10 }}>Gerenciar catálogo</Link>
          </div>
        )}

        {catalog.length === 0 && (
          <div style={{ background:C.pale, borderRadius:16, border:"1px solid rgba(99,153,34,.2)", padding:16, marginBottom:16, textAlign:"center" }}>
            <p style={{ fontSize:12, color:C.dark, marginBottom:8 }}>Cadastre seus serviços para agilizar a criação de orçamentos</p>
            <Link href="/dashboard/catalogo" style={{ fontSize:12, color:C.primary, fontWeight:600, textDecoration:"none" }}>+ Cadastrar catálogo</Link>
          </div>
        )}

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
              <input type="number" placeholder="R$" value={item.valor_unit || ""} min={0} step={0.01} onChange={(e) => updateItem(i, "valor_unit", e.target.value)} style={{ ...inp, width:76, padding:"8px 6px", fontSize:13 }} />
              <button type="button" onClick={() => setItems((p) => p.filter((_, j) => j !== i))} style={{ background:"none", border:"none", color:"#ef4444", fontSize:18, cursor:"pointer", padding:4 }}>×</button>
            </div>
          ))}
        </div>

        {/* TOTAL */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0 4px", marginBottom:20 }}>
          <span style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:14, color:C.navy }}>Total</span>
          <span style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:22, color:C.primary }}>R$ {total.toFixed(2)}</span>
        </div>

        {/* ── FORMA DE PAGAMENTO ── */}
        <div style={{ background:C.bg, borderRadius:16, border:`1px solid ${C.border}`, padding:16, marginBottom:20 }}>
          <p style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:13, color:C.navy, marginBottom:12 }}>Forma de pagamento</p>
          <div style={{ display:"flex", gap:10, marginBottom: formaPagamento === "crediario" ? 12 : 0 }}>
            {(["avista", "crediario"] as const).map((op) => (
              <button
                key={op}
                type="button"
                onClick={() => setFormaPagamento(op)}
                style={{
                  flex: 1,
                  padding: "12px 0",
                  borderRadius: 12,
                  border: `2px solid ${formaPagamento === op ? C.primary : C.border}`,
                  background: formaPagamento === op ? C.pale : C.surface,
                  color: formaPagamento === op ? C.dark : C.muted,
                  fontWeight: 600,
                  fontSize: 13,
                  fontFamily: "var(--font-display)",
                  cursor: "pointer",
                }}
              >
                {op === "avista" ? "💳 À Vista" : "🤝 Crediário"}
              </button>
            ))}
          </div>

          {formaPagamento === "crediario" && (
            <div>
              <label style={{ fontSize:12, color:C.muted, display:"block", marginBottom:6 }}>
                Data de vencimento (opcional)
              </label>
              <input
                type="date"
                value={dataVencimento}
                onChange={(e) => setDataVencimento(e.target.value)}
                style={{ ...inp, fontSize:13, padding:"10px 12px" }}
              />
              <p style={{ fontSize:11, color:"#92400E", marginTop:6 }}>
                Ao aprovar, este orçamento vai para o controle de Crediário automaticamente.
              </p>
            </div>
          )}
        </div>

        {error && <p style={{ fontSize:13, color:"#ef4444", marginBottom:12, textAlign:"center" }}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          style={{ width:"100%", background:C.primary, color:"#fff", fontWeight:600, fontFamily:"var(--font-display)", fontSize:15, padding:"16px 0", borderRadius:14, border:"none", cursor:loading ? "not-allowed" : "pointer", opacity:loading ? 0.7 : 1 }}
        >
          {loading ? "Gerando orçamento…" : "Gerar orçamento"}
        </button>
      </form>
    </main>
  );
}
