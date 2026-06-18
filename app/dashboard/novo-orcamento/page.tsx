"use client";

import { useState, useEffect } from "react";
import { createQuote, getServiceCatalog } from "./actions";

const C = { bg:"#FFFFFF", surface:"#F4F6F3", text:"#1A1A2E", muted:"#6B7280", border:"#E5E7EB", primary:"#639922", pale:"#EAF3DE", navy:"#1A1A2E" };
const input: React.CSSProperties = { width:"100%", borderRadius:12, border:`1px solid ${C.border}`, background:C.surface, padding:"12px 14px", fontSize:14, color:C.text, outline:"none", fontFamily:"var(--font-body)" };

type CatalogItem = { id: string; nome: string; valor: number };
type QuoteItem    = { descricao: string; quantidade: number; valor_unit: number };

export default function NovoOrcamentoPage() {
  const [catalog, setCatalog]   = useState<CatalogItem[]>([]);
  const [items, setItems]       = useState<QuoteItem[]>([]);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    getServiceCatalog().then(setCatalog);
  }, []);

  function addFromCatalog(c: CatalogItem) {
    setItems((prev) => [...prev, { descricao: c.nome, quantidade: 1, valor_unit: c.valor }]);
  }

  function addManualItem() {
    setItems((prev) => [...prev, { descricao: "", quantidade: 1, valor_unit: 0 }]);
  }

  function updateItem(index: number, field: keyof QuoteItem, value: string) {
    setItems((prev) => {
      const next = [...prev];
      if (field === "descricao") next[index].descricao = value;
      else next[index][field] = parseFloat(value) || 0;
      return next;
    });
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const total = items.reduce((sum, i) => sum + i.quantidade * i.valor_unit, 0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (items.length === 0) {
      setError("Adicione ao menos um serviço.");
      return;
    }
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    fd.set("items_json", JSON.stringify(items));
    const result = await createQuote(fd);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight:"100vh", background:C.surface, paddingBottom:40 }}>
      <header style={{ background:C.bg, borderBottom:`1px solid ${C.border}`, padding:"16px 20px" }}>
        <span style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:16, color:C.navy }}>
          Novo orçamento
        </span>
      </header>

      <form onSubmit={handleSubmit} style={{ maxWidth:480, margin:"0 auto", padding:"20px" }}>

        {/* dados do cliente */}
        <div style={{ background:C.bg, borderRadius:16, border:`1px solid ${C.border}`, padding:16, marginBottom:16 }}>
          <p style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:13, color:C.navy, marginBottom:10 }}>Cliente</p>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <input type="text" name="client_name" placeholder="Nome do cliente" required style={input} />
            <input type="tel"  name="client_whatsapp" placeholder="WhatsApp (DDD) 9 0000-0000" required style={input} />
          </div>
        </div>

        {/* catálogo rápido */}
        {catalog.length > 0 && (
          <div style={{ marginBottom:16 }}>
            <p style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:13, color:C.navy, marginBottom:10 }}>
              Catálogo — toque para adicionar
            </p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {catalog.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => addFromCatalog(c)}
                  style={{ background:C.pale, border:`1px solid rgba(99,153,34,.3)`, borderRadius:10, padding:"8px 12px", fontSize:12, color:"#3B6D11", cursor:"pointer", fontFamily:"var(--font-body)" }}
                >
                  {c.nome} · R$ {c.valor.toFixed(2)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* itens do orçamento */}
        <div style={{ background:C.bg, borderRadius:16, border:`1px solid ${C.border}`, padding:16, marginBottom:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <p style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:13, color:C.navy }}>Serviços</p>
            <button type="button" onClick={addManualItem} style={{ fontSize:12, color:C.primary, fontWeight:600, background:"none", border:"none", cursor:"pointer" }}>
              + Adicionar item
            </button>
          </div>

          {items.length === 0 && (
            <p style={{ fontSize:12, color:C.muted, padding:"12px 0", textAlign:"center" }}>
              Nenhum serviço adicionado ainda
            </p>
          )}

          {items.map((item, i) => (
            <div key={i} style={{ display:"flex", gap:8, marginBottom:8, alignItems:"center" }}>
              <input
                type="text" placeholder="Descrição" value={item.descricao}
                onChange={(e) => updateItem(i, "descricao", e.target.value)}
                style={{ ...input, flex:2, padding:"8px 10px", fontSize:13 }}
              />
              <input
                type="number" placeholder="Qtd" value={item.quantidade} min={0.1} step={0.1}
                onChange={(e) => updateItem(i, "quantidade", e.target.value)}
                style={{ ...input, width:56, padding:"8px 8px", fontSize:13, textAlign:"center" }}
              />
              <input
                type="number" placeholder="R$" value={item.valor_unit || ""} min={0} step={0.01}
                onChange={(e) => updateItem(i, "valor_unit", e.target.value)}
                style={{ ...input, width:80, padding:"8px 8px", fontSize:13 }}
              />
              <button type="button" onClick={() => removeItem(i)} style={{ background:"none", border:"none", color:"#ef4444", fontSize:16, cursor:"pointer", padding:4 }}>
                ×
              </button>
            </div>
          ))}
        </div>

        {/* total */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0 4px", marginBottom:20 }}>
          <span style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:14, color:C.navy }}>Total</span>
          <span style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:20, color:C.primary }}>
            R$ {total.toFixed(2)}
          </span>
        </div>

        {error && <p style={{ fontSize:12, color:"#ef4444", marginBottom:12, textAlign:"center" }}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          style={{ width:"100%", background:C.primary, color:"#fff", fontWeight:600, fontFamily:"var(--font-display)", fontSize:14, padding:"15px 0", borderRadius:14, border:"none", cursor:loading?"not-allowed":"pointer", opacity:loading?0.7:1 }}
        >
          {loading ? "Gerando orçamento…" : "Gerar orçamento"}
        </button>
      </form>
    </main>
  );
}
