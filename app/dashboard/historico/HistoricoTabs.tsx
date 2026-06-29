"use client";

import { useState } from "react";
import { getTab, type QuoteStatus } from "@/lib/quote-status";
import KanbanCard from "./KanbanCard";

const C = { bg:"#FFFFFF", surface:"#F4F6F3", text:"#1A1A2E", muted:"#6B7280", border:"#E5E7EB", primary:"#639922", navy:"#1A1A2E" };

export type QuoteData = {
  id:             string;
  status:         QuoteStatus;
  total:          number;
  pdfUrl:         string | null;
  createdAt:      string;
  paidAt:         string | null;
  clientId:       string;
  clientName:     string;
  clientWhatsapp: string;
  saldoCrediario: number | null;
};

type TabKey = "novo" | "aprovado" | "pago" | "cancelado";

const TABS: { key: TabKey; label: string }[] = [
  { key: "novo",      label: "Novos" },
  { key: "aprovado",  label: "Aprovados" },
  { key: "pago",      label: "Pagos" },
  { key: "cancelado", label: "Cancelados" },
];

export default function HistoricoTabs({ quotes }: { quotes: QuoteData[] }) {
  const [activeTab, setActiveTab] = useState<TabKey>("novo");

  // conta quantos orçamentos há em cada aba, para mostrar o número no rótulo
  const counts = quotes.reduce((acc, q) => {
    const tab = getTab(q.status);
    acc[tab] = (acc[tab] ?? 0) + 1;
    return acc;
  }, {} as Record<TabKey, number>);

  const visibleQuotes = quotes.filter((q) => getTab(q.status) === activeTab);

  return (
    <div style={{ maxWidth:520, margin:"0 auto", padding:"16px 20px 40px" }}>

      {/* barra de abas com scroll horizontal no celular */}
      <div style={{ display:"flex", gap:6, marginBottom:18, overflowX:"auto", paddingBottom:4 }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const count = counts[tab.key] ?? 0;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flexShrink: 0,
                background: isActive ? C.primary : C.bg,
                color: isActive ? "#fff" : C.muted,
                border: `1px solid ${isActive ? C.primary : C.border}`,
                borderRadius: 99,
                padding: "8px 14px",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "var(--font-display)",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {tab.label}
              {count > 0 && (
                <span style={{ marginLeft:6, opacity:isActive ? 0.85 : 0.6, fontSize:12 }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* lista de cards da aba ativa */}
      {visibleQuotes.length === 0 ? (
        <p style={{ fontSize:13, color:C.muted, textAlign:"center", padding:"40px 0" }}>
          Nenhum orçamento nesta aba.
        </p>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {visibleQuotes.map((q) => (
            <KanbanCard key={q.id} quote={q} tab={activeTab} />
          ))}
        </div>
      )}
    </div>
  );
}
