"use client";

import { useState, useMemo } from "react";
import { getTab, type QuoteStatus } from "@/lib/quote-status";
import KanbanCard from "./KanbanCard";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:      "#FFFFFF",
  surface: "#F4F6F3",
  text:    "#1A1A2E",
  muted:   "#6B7280",
  border:  "#E5E7EB",
  primary: "#639922",
  navy:    "#1A1A2E",
};

// ─── Tipos ────────────────────────────────────────────────────────────────────
export type QuoteData = {
  id:            string;
  status:        QuoteStatus;
  total:         number;
  pdfUrl:        string | null;
  createdAt:     string;
  paidAt:        string | null;
  clientId:      string;
  clientName:    string;
  clientWhatsapp: string;
};

type ColumnKey = "novo" | "aprovado" | "pago" | "cancelado";

const COLUMNS: { key: ColumnKey; label: string; accent: string }[] = [
  { key: "novo",      label: "Novos",      accent: "#D97706" },
  { key: "aprovado",  label: "Aprovados",  accent: "#1D4ED8" },
  { key: "pago",      label: "Pagos",      accent: "#16A34A" },
  { key: "cancelado", label: "Cancelados", accent: "#DC2626" },
];

// ─── Ícone de busca ───────────────────────────────────────────────────────────
const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

// ─── Componente principal ─────────────────────────────────────────────────────
export default function HistoricoKanban({ quotes }: { quotes: QuoteData[] }) {
  const [activeTab, setActiveTab]     = useState<ColumnKey>("novo");
  const [search, setSearch]           = useState("");

  // ── Filtragem por busca ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!search.trim()) return quotes;
    const q = search.trim().toLowerCase();
    return quotes.filter((o) => o.clientName.toLowerCase().includes(q));
  }, [quotes, search]);

  // ── Agrupamento por coluna ───────────────────────────────────────────────
  const grouped = useMemo(() =>
    filtered.reduce((acc, q) => {
      const col = getTab(q.status) as ColumnKey;
      (acc[col] ??= []).push(q);
      return acc;
    }, {} as Record<ColumnKey, QuoteData[]>),
  [filtered]);

  // ── Resumo financeiro por coluna (sugestão de engenharia de dados) ───────
  // Expor totais agrupados no próprio kanban reduz requisições ao banco
  const totals = useMemo(() =>
    COLUMNS.reduce((acc, col) => {
      const items = grouped[col.key] ?? [];
      acc[col.key] = items.reduce((s, q) => s + q.total, 0);
      return acc;
    }, {} as Record<ColumnKey, number>),
  [grouped]);

  return (
    <div style={{ padding: "16px 0 48px" }}>

      {/* ── Barra de busca ── */}
      <div style={{ padding: "0 16px 16px" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: C.bg,
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          padding: "10px 14px",
        }}>
          <IconSearch />
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: 14,
              color: C.text,
              background: "transparent",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, padding: 0, lineHeight: 1 }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          MOBILE  — Tabs (visível apenas em telas < 768px via CSS class)
          ════════════════════════════════════════════════════════════════ */}
      <div className="kanban-mobile">
        {/* Tabs header */}
        <div style={{
          display: "flex",
          overflowX: "auto",
          gap: 0,
          padding: "0 16px",
          borderBottom: `1px solid ${C.border}`,
          scrollbarWidth: "none",
        }}>
          {COLUMNS.map((col) => {
            const count  = (grouped[col.key] ?? []).length;
            const active = activeTab === col.key;
            return (
              <button
                key={col.key}
                onClick={() => setActiveTab(col.key)}
                style={{
                  flexShrink: 0,
                  padding: "12px 16px 11px",
                  border: "none",
                  borderBottom: active ? `2px solid ${col.accent}` : "2px solid transparent",
                  background: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  color: active ? col.accent : C.muted,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "color 0.15s, border-color 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                {col.label}
                {count > 0 && (
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    background: active ? col.accent : C.surface,
                    color: active ? "#fff" : C.muted,
                    borderRadius: 99,
                    padding: "1px 6px",
                    minWidth: 18,
                    textAlign: "center",
                    transition: "background 0.15s",
                  }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Conteúdo da aba ativa */}
        {(() => {
          const col   = COLUMNS.find((c) => c.key === activeTab)!;
          const items = grouped[activeTab] ?? [];
          return (
            <div style={{ padding: "16px" }}>
              {/* Subtotal da coluna */}
              {items.length > 0 && (
                <p style={{ margin: "0 0 12px", fontSize: 12, color: C.muted }}>
                  {items.length} orçamento{items.length > 1 ? "s" : ""} ·{" "}
                  <strong style={{ color: C.navy }}>
                    {totals[activeTab].toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </strong>
                </p>
              )}

              {items.length === 0 ? (
                <EmptyState search={search} colLabel={col.label} />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {items.map((q) => (
                    <KanbanCard
                      key={q.id}
                      quote={q}
                      tab={activeTab}
                      // onRequestPayment será conectado na Etapa 2
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          DESKTOP — Colunas lado a lado (visível apenas em telas ≥ 768px)
          ════════════════════════════════════════════════════════════════ */}
      <div className="kanban-desktop">
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 14,
          padding: "0 20px",
          alignItems: "start",
        }}>
          {COLUMNS.map((col) => {
            const items = grouped[col.key] ?? [];
            return (
              <div
                key={col.key}
                style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 16,
                  padding: "14px 12px",
                  minHeight: 220,
                }}
              >
                {/* Cabeçalho da coluna */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 14,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: col.accent, display: "inline-block", flexShrink: 0,
                    }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>
                      {col.label}
                    </span>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: C.muted,
                    background: C.bg, borderRadius: 99, padding: "2px 8px",
                  }}>
                    {items.length}
                  </span>
                </div>

                {/* Subtotal desktop */}
                {items.length > 0 && (
                  <p style={{ margin: "0 0 10px 16px", fontSize: 11, color: C.muted }}>
                    {totals[col.key].toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                )}

                {/* Cards */}
                {items.length === 0 ? (
                  <EmptyState search={search} colLabel={col.label} compact />
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {items.map((q) => (
                      <KanbanCard
                        key={q.id}
                        quote={q}
                        tab={col.key}
                        // onRequestPayment será conectado na Etapa 2
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── CSS responsivo injetado inline (sem dependência de globals.css) ── */}
      <style>{`
        .kanban-mobile  { display: block; }
        .kanban-desktop { display: none;  }

        @media (min-width: 768px) {
          .kanban-mobile  { display: none;  }
          .kanban-desktop { display: block; }
        }

        /* Esconde scrollbar das tabs no mobile mantendo funcionalidade */
        .kanban-mobile div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

// ─── Estado vazio ─────────────────────────────────────────────────────────────
function EmptyState({ search, colLabel, compact = false }: { search: string; colLabel: string; compact?: boolean }) {
  return (
    <div style={{ textAlign: "center", padding: compact ? "20px 8px" : "40px 16px" }}>
      <p style={{ margin: 0, fontSize: compact ? 12 : 14, color: C.muted }}>
        {search
          ? `Nenhum resultado para "${search}"`
          : `Sem orçamentos em ${colLabel}`}
      </p>
    </div>
  );
}
