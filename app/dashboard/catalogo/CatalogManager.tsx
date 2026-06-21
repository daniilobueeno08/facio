"use client";

import { useState } from "react";
import { addCatalogItem, deleteCatalogItem } from "../novo-orcamento/actions";

const C = { bg:"#FFFFFF", surface:"#F4F6F3", text:"#1A1A2E", muted:"#6B7280", border:"#E5E7EB", primary:"#639922", pale:"#EAF3DE", navy:"#1A1A2E" };
const input: React.CSSProperties = { width:"100%", borderRadius:12, border:`1px solid ${C.border}`, background:C.surface, padding:"10px 12px", fontSize:13, color:C.text, outline:"none", fontFamily:"var(--font-body)" };

type CatalogItem = {
  id: string;
  nome: string;
  valor_higienizacao: number;
  valor_blindagem: number | null;
  valor_combo: number | null;
};

export default function CatalogManager({ initialItems }: { initialItems: CatalogItem[] }) {
  const [items, setItems]     = useState<CatalogItem[]>(initialItems);
  const [showForm, setShowForm] = useState(initialItems.length === 0);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await addCatalogItem(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // recarrega a lista localmente sem precisar de full reload
    const nome = formData.get("nome") as string;
    const valor_higienizacao = parseFloat(formData.get("valor_higienizacao") as string);
    const blindagemRaw = formData.get("valor_blindagem") as string;
    const comboRaw     = formData.get("valor_combo") as string;

    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(), // id temporário só para a chave da lista — a tela será recarregada no próximo acesso com o id real
        nome,
        valor_higienizacao,
        valor_blindagem: blindagemRaw ? parseFloat(blindagemRaw) : null,
        valor_combo: comboRaw ? parseFloat(comboRaw) : null,
      },
    ].sort((a, b) => a.nome.localeCompare(b.nome)));

    (e.target as HTMLFormElement).reset();
    setLoading(false);
  }

  async function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await deleteCatalogItem(id);
  }

  return (
    <div style={{ maxWidth:520, margin:"0 auto", padding:20 }}>

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          style={{ width:"100%", background:C.primary, color:"#fff", fontWeight:600, fontFamily:"var(--font-display)", fontSize:14, padding:"14px 0", borderRadius:14, border:"none", cursor:"pointer", marginBottom:20 }}
        >
          + Adicionar serviço ao catálogo
        </button>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:16, padding:16, marginBottom:20 }}>
          <p style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:13, color:C.navy, marginBottom:10 }}>
            Novo serviço
          </p>

          <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:12 }}>
            <input type="text" name="nome" placeholder="Nome do serviço (ex: Sofá 3 lugares)" required style={input} />
          </div>

          <p style={{ fontSize:11, color:C.muted, marginBottom:8 }}>
            Preços por tipo de serviço — Higienização é obrigatório, os demais são opcionais
          </p>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:14 }}>
            <div>
              <label style={{ fontSize:10, color:C.muted, display:"block", marginBottom:4 }}>Higienização</label>
              <input type="number" name="valor_higienizacao" placeholder="R$" required min={0} step={0.01} style={{ ...input, padding:"8px 8px", fontSize:12 }} />
            </div>
            <div>
              <label style={{ fontSize:10, color:C.muted, display:"block", marginBottom:4 }}>Blindagem</label>
              <input type="number" name="valor_blindagem" placeholder="R$ (opcional)" min={0} step={0.01} style={{ ...input, padding:"8px 8px", fontSize:12 }} />
            </div>
            <div>
              <label style={{ fontSize:10, color:C.muted, display:"block", marginBottom:4 }}>Combo</label>
              <input type="number" name="valor_combo" placeholder="R$ (opcional)" min={0} step={0.01} style={{ ...input, padding:"8px 8px", fontSize:12 }} />
            </div>
          </div>

          {error && <p style={{ fontSize:12, color:"#ef4444", marginBottom:10 }}>{error}</p>}

          <div style={{ display:"flex", gap:8 }}>
            <button
              type="submit"
              disabled={loading}
              style={{ flex:1, background:C.primary, color:"#fff", fontWeight:600, fontFamily:"var(--font-display)", fontSize:13, padding:"11px 0", borderRadius:10, border:"none", cursor:loading?"not-allowed":"pointer" }}
            >
              {loading ? "Salvando…" : "Salvar serviço"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{ fontSize:13, color:C.muted, background:"none", border:"none", cursor:"pointer", padding:"11px 12px" }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {items.length === 0 && !showForm && (
        <p style={{ fontSize:13, color:C.muted, textAlign:"center", padding:"30px 0" }}>
          Nenhum serviço cadastrado ainda.
        </p>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {items.map((item) => (
          <div key={item.id} style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:14, padding:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
              <span style={{ fontSize:13, fontWeight:600, color:C.text }}>{item.nome}</span>
              <button
                onClick={() => handleDelete(item.id)}
                style={{ fontSize:11, color:"#ef4444", background:"none", border:"none", cursor:"pointer" }}
              >
                Remover
              </button>
            </div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              <span style={{ fontSize:11, background:C.pale, color:"#3B6D11", padding:"3px 9px", borderRadius:8 }}>
                Higienização R$ {item.valor_higienizacao.toFixed(2)}
              </span>
              {item.valor_blindagem != null && (
                <span style={{ fontSize:11, background:C.surface, color:C.muted, padding:"3px 9px", borderRadius:8 }}>
                  Blindagem R$ {item.valor_blindagem.toFixed(2)}
                </span>
              )}
              {item.valor_combo != null && (
                <span style={{ fontSize:11, background:C.surface, color:C.muted, padding:"3px 9px", borderRadius:8 }}>
                  Combo R$ {item.valor_combo.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
