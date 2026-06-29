"use client";

import { getTab, type QuoteStatus } from "@/lib/quote-status";
import KanbanCard from "./KanbanCard";

const C = { bg:"#FFFFFF", surface:"#F4F6F3", text:"#1A1A2E", muted:"#6B7280", border:"#E5E7EB", primary:"#639922", navy:"#1A1A2E" };

export type QuoteData = {
  id: string;
  status: QuoteStatus;
  total: number;
  pdfUrl: string | null;
  createdAt: string;
  paidAt: string | null;
  clientId: string;
  clientName: string;
  clientWhatsapp: string;
};

type ColumnKey = "novo" | "aprovado" | "pago" | "cancelado";

const COLUMNS: { key: ColumnKey; label: string; accent: string }[] = [
  { key: "novo",      label: "Novos",      accent: "#92400E" },
  { key: "aprovado",  label: "Aprovados",  accent: "#1E40AF" },
  { key: "pago",      label: "Pagos",      accent: "#3B6D11" },
  { key: "cancelado", label: "Cancelados", accent: "#991B1B" },
];

export default function HistoricoKanban({ quotes }: { quotes: QuoteData[] }) {
  // agrupa os orçamentos por coluna
  const grouped = quotes.reduce((acc, q) => {
    const col = getTab(q.status);
    (acc[col] ??= []).push(q);
    return acc;
  }, {} as Record<ColumnKey, QuoteData[]>);

  return (
    <div style={{ padding:"16px 0 40px" }}>
      {/* trilho horizontal — desliza com o dedo no celular */}
      <div
        style={{
          display: "flex",
          gap: 12,
          overflowX: "auto",
          padding: "0 16px",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {COLUMNS.map((col) => {
          const items = grouped[col.key] ?? [];
          return (
            <div
              key={col.key}
              style={{
                flex: "0 0 82%",          // cada coluna ocupa 82% da largura visível (espia a próxima)
                maxWidth: 340,
                scrollSnapAlign: "start",
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 16,
                padding: 12,
                display: "flex",
                flexDirection: "column",
                minHeight: 200,
              }}
            >
              {/* cabeçalho da coluna */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12, paddingLeft:4 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ width:8, height:8, borderRadius:"50%", background:col.accent, display:"inline-block" }} />
                  <span style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:14, color:C.navy }}>
                    {col.label}
                  </span>
                </div>
                <span style={{ fontSize:12, fontWeight:600, color:C.muted, background:C.bg, borderRadius:99, padding:"2px 9px", minWidth:24, textAlign:"center" }}>
                  {items.length}
                </span>
              </div>

              {/* cards empilhados */}
              {items.length === 0 ? (
                <p style={{ fontSize:12, color:C.muted, textAlign:"center", padding:"30px 8px" }}>
                  Vazio
                </p>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {items.map((q) => (
                    <KanbanCard key={q.id} quote={q} tab={col.key} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p style={{ fontSize:11, color:C.muted, textAlign:"center", marginTop:14, paddingLeft:16, paddingRight:16 }}>
        Deslize para o lado para ver todas as colunas
      </p>
    </div>
  );
}
