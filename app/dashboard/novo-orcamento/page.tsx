"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createQuote, getServiceCatalog } from "./actions";
import { isValidWhatsapp } from "@/lib/validation";

const C = { bg:"#FFFFFF", surface:"#F4F6F3", text:"#1A1A2E", muted:"#6B7280", border:"#E5E7EB", primary:"#639922", pale:"#EAF3DE", navy:"#1A1A2E" };
const input: React.CSSProperties = { width:"100%", borderRadius:12, border:`1px solid ${C.border}`, background:C.surface, padding:"12px 14px", fontSize:14, color:C.text, outline:"none", fontFamily:"var(--font-body)" };
const errorInput: React.CSSProperties = { border: "1px solid #ef4444" };

type CatalogItem = {
  id: string;
  nome: string;
  valor_higienizacao: number;
  valor_blindagem: number | null;
  valor_combo: number | null;
};
type QuoteItem    = { descricao: string; quantidade: number; valor_unit: number };

export default function NovoOrcamentoPage() {
  const [catalog, setCatalog]   = useState<CatalogItem[]>([]);
  const [items, setItems]       = useState<QuoteItem[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [itemErrors, setItemErrors] = useState<string[]>([]);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    getServiceCatalog().then(setCatalog);
  }, []);

  function addFromCatalog(nome: string, valor: number, tier: string) {
    setItems((prev) => [...prev, { descricao: `${nome} (${tier})`, quantidade: 1, valor_unit: valor }]);
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
    setFieldErrors({});
    setItemErrors([]);

    const formData = new FormData(e.currentTarget);
    const clientName = (formData.get("client_name") as string)?.trim() ?? "";
    const clientWhatsapp = (formData.get("client_whatsapp") as string) ?? "";
    const errors: Record<string, string> = {};
    const itemValidation: string[] = [];

    if (!clientName) errors.client_name = "Nome do cliente obrigatório.";
    if (!clientWhatsapp) errors.client_whatsapp = "WhatsApp do cliente obrigatório.";
    else if (!isValidWhatsapp(clientWhatsapp)) errors.client_whatsapp = "WhatsApp do cliente inválido.";

    items.forEach((item, index) => {
      if (!item.descricao.trim()) {
        itemValidation[index] = "Descrição obrigatória.";
        return;
      }
      if (!(item.quantidade > 0)) {
        itemValidation[index] = "Quantidade deve ser maior que zero.";
        return;
      }
      if (!(item.valor_unit >= 0)) {
        itemValidation[index] = "Valor deve ser zero ou maior.";
      }
    });

    if (items.length === 0) {
      setError("Adicione ao menos um serviço.");
      return;
    }
    if (Object.keys(errors).length || itemValidation.some(Boolean)) {
      setFieldErrors(errors);
      setItemErrors(itemValidation);
      setError("Corrija os campos marcados.");
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
            <input type="text" name="client_name" placeholder="Nome do cliente" required style={{ ...input, ...(fieldErrors.client_name ? errorInput : {}) }} />
            {fieldErrors.client_name && <p style={{ fontSize:12, color:"#ef4444", marginTop:-4 }}>{fieldErrors.client_name}</p>}
            <input type="tel"  name="client_whatsapp" placeholder="WhatsApp (DDD) 9 0000-0000" required style={{ ...input, ...(fieldErrors.client_whatsapp ? errorInput : {}) }} />
            {fieldErrors.client_whatsapp && <p style={{ fontSize:12, color:"#ef4444", marginTop:-4 }}>{fieldErrors.client_whatsapp}</p>}
          </div>
        </div>

        {/* catálogo — formato cardápio, 3 colunas de preço */}
        {catalog.length > 0 && (
          <div style={{ background:C.bg, borderRadius:16, border:`1px solid ${C.border}`, padding:16, marginBottom:16, overflow:"hidden" }}>
            <p style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:13, color:C.navy, marginBottom:10 }}>
              Catálogo — toque no preço para adicionar
            </p>

            {/* cabeçalho das colunas */}
            <div style={{ display:"grid", gridTemplateColumns:"1.4fr 0.85fr 0.85fr 0.85fr", gap:6, marginBottom:6, paddingBottom:6, borderBottom:`1px solid ${C.border}` }}>
              <span style={{ fontSize:10, color:C.muted, fontWeight:600 }}>Serviço</span>
              <span style={{ fontSize:10, color:C.muted, fontWeight:600, textAlign:"center" }}>Higien.</span>
              <span style={{ fontSize:10, color:C.muted, fontWeight:600, textAlign:"center" }}>Blind.</span>
              <span style={{ fontSize:10, color:C.muted, fontWeight:600, textAlign:"center" }}>Combo</span>
            </div>

            {/* linhas do cardápio */}
            <div style={{ display:"flex", flexDirection:"column" }}>
              {catalog.map((c) => (
                <div
                  key={c.id}
                  style={{ display:"grid", gridTemplateColumns:"1.4fr 0.85fr 0.85fr 0.85fr", gap:6, alignItems:"center", padding:"8px 0", borderBottom:`1px solid ${C.surface}` }}
                >
                  <span style={{ fontSize:12, color:C.text, lineHeight:1.3 }}>{c.nome}</span>

                  <button
                    type="button"
                    onClick={() => addFromCatalog(c.nome, c.valor_higienizacao, "Higienização")}
                    style={{ background:C.pale, border:"1px solid rgba(99,153,34,.3)", borderRadius:8, padding:"6px 2px", fontSize:11, fontWeight:600, color:"#3B6D11", cursor:"pointer" }}
                  >
                    {c.valor_higienizacao.toFixed(0)}
                  </button>

                  {c.valor_blindagem != null ? (
                    <button
                      type="button"
                      onClick={() => addFromCatalog(c.nome, c.valor_blindagem!, "Blindagem")}
                      style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 2px", fontSize:11, fontWeight:600, color:C.text, cursor:"pointer" }}
                    >
                      {c.valor_blindagem.toFixed(0)}
                    </button>
                  ) : (
                    <span style={{ textAlign:"center", fontSize:11, color:"#D1D5DB" }}>—</span>
                  )}

                  {c.valor_combo != null ? (
                    <button
                      type="button"
                      onClick={() => addFromCatalog(c.nome, c.valor_combo!, "Combo")}
                      style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 2px", fontSize:11, fontWeight:600, color:C.text, cursor:"pointer" }}
                    >
                      {c.valor_combo.toFixed(0)}
                    </button>
                  ) : (
                    <span style={{ textAlign:"center", fontSize:11, color:"#D1D5DB" }}>—</span>
                  )}
                </div>
              ))}
            </div>

            <Link href="/dashboard/catalogo" style={{ display:"block", textAlign:"center", fontSize:11, color:C.muted, textDecoration:"none", marginTop:10 }}>
              Gerenciar catálogo
            </Link>
          </div>
        )}

        {catalog.length === 0 && (
          <div style={{ background:C.pale, borderRadius:16, border:"1px solid rgba(99,153,34,.2)", padding:16, marginBottom:16, textAlign:"center" }}>
            <p style={{ fontSize:12, color:"#3B6D11", marginBottom:8 }}>
              Cadastre seus serviços para agilizar a criação de orçamentos
            </p>
            <Link href="/dashboard/catalogo" style={{ fontSize:12, color:C.primary, fontWeight:600, textDecoration:"none" }}>
              + Cadastrar catálogo
            </Link>
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
            <div key={i} style={{ display:"flex", flexDirection:"column", gap:4, marginBottom:8 }}>
              <div style={{ display:"flex", gap:8, alignItems:"center", border: itemErrors[i] ? "1px solid #ef4444" : undefined, borderRadius:12, padding:itemErrors[i] ? "8px" : "0" }}>
                <input
                  type="text" placeholder="Descrição" value={item.descricao}
                  onChange={(e) => updateItem(i, "descricao", e.target.value)}
                  style={{ ...input, flex:2, padding:"8px 10px", fontSize:13, ...(itemErrors[i] ? errorInput : {}) }}
                />
                <input
                  type="number" placeholder="Qtd" value={item.quantidade} min={0.1} step={0.1}
                  onChange={(e) => updateItem(i, "quantidade", e.target.value)}
                  style={{ ...input, width:56, padding:"8px 8px", fontSize:13, textAlign:"center", ...(itemErrors[i] ? errorInput : {}) }}
                />
                <input
                  type="number" placeholder="R$" value={item.valor_unit || ""} min={0} step={0.01}
                  onChange={(e) => updateItem(i, "valor_unit", e.target.value)}
                  style={{ ...input, width:80, padding:"8px 8px", fontSize:13, ...(itemErrors[i] ? errorInput : {}) }}
                />
                <button type="button" onClick={() => removeItem(i)} style={{ background:"none", border:"none", color:"#ef4444", fontSize:16, cursor:"pointer", padding:4 }}>
                  ×
                </button>
              </div>
              {itemErrors[i] && <p style={{ fontSize:12, color:"#ef4444", marginTop:0 }}>{itemErrors[i]}</p>}
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
