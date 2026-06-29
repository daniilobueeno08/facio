"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MoreVertical, FileText, Pencil, Trash2, CheckCircle,
  X, CreditCard, Handshake, MessageCircle, Search, Clock, AlertCircle,
} from "lucide-react";
import {
  approveQuote, markQuoteAsPaid, cancelQuote, reactivateQuote, deleteQuote,
} from "./actions";

const C = {
  bg:"#FFFFFF", surface:"#F4F6F3", navy:"#1A1A2E", muted:"#6B7280",
  border:"#E5E7EB", primary:"#639922", pale:"#EAF3DE", dark:"#3B6D11",
  red:"#991B1B", amber:"#92400E", blue:"#1E40AF",
  redBg:"#FEE2E2", amberBg:"#FEF3C7", blueBg:"#DBEAFE",
};

export type QuoteData = {
  id: string;
  status: "draft" | "sent" | "approved" | "paid" | "cancelled";
  total: number;
  pdfUrl: string | null;
  createdAt: string;
  paidAt: string | null;
  clientId: string;
  clientName: string;
  clientWhatsapp: string;
  formaPagamento?: string;
};

type Col = "novo" | "aprovado" | "pago" | "cancelado";

const COLUMNS: { key: Col; label: string; color: string; bg: string }[] = [
  { key:"novo",      label:"Novos",      color:C.amber, bg:C.amberBg },
  { key:"aprovado",  label:"Aprovados",  color:C.blue,  bg:C.blueBg  },
  { key:"pago",      label:"Pagos",      color:C.dark,  bg:C.pale    },
  { key:"cancelado", label:"Cancelados", color:C.red,   bg:C.redBg   },
];

function statusToCol(s: QuoteData["status"]): Col {
  if (s === "approved") return "aprovado";
  if (s === "paid")     return "pago";
  if (s === "cancelled")return "cancelado";
  return "novo";
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day:"2-digit", month:"short" });
}
function fmtBRL(v: number) {
  return `R$ ${v.toFixed(2).replace(".", ",")}`;
}
function isExpired(q: QuoteData) {
  return statusToCol(q.status) === "novo" &&
    Date.now() - new Date(q.createdAt).getTime() > 7 * 24 * 60 * 60 * 1000;
}

// ─── Dropdown de ações secundárias ───────────────────────────
function ActionMenu({ quote, onDelete, busy }: { quote: QuoteData; onDelete: () => void; busy: boolean }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  const col = statusToCol(quote.status);

  return (
    <div style={{ position:"relative" }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        style={{ background:"none", border:"none", cursor:"pointer", padding:4, borderRadius:6, color:C.muted, display:"flex" }}
        aria-label="Mais opções"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ position:"absolute", right:0, top:28, background:C.bg, border:`1px solid ${C.border}`, borderRadius:10, boxShadow:"0 8px 24px rgba(0,0,0,.10)", zIndex:50, minWidth:158, padding:4 }}
        >
          {quote.pdfUrl && (
            <MenuItem icon={<FileText size={14}/>} label="Ver PDF" onClick={() => { window.open(quote.pdfUrl!, "_blank"); setOpen(false); }} />
          )}
          {(col === "novo") && (
            <MenuItem icon={<Pencil size={14}/>} label="Editar" onClick={() => { router.push(`/dashboard/historico/${quote.id}/editar`); setOpen(false); }} />
          )}
          {col === "cancelado" && (
            <MenuItem icon={<CheckCircle size={14}/>} label="Reativar" onClick={async () => { await reactivateQuote(quote.id); setOpen(false); router.refresh(); }} />
          )}
          {col !== "cancelado" && col !== "pago" && (
            <MenuItem icon={<X size={14}/>} label="Cancelar" onClick={async () => { await cancelQuote(quote.id); setOpen(false); router.refresh(); }} />
          )}
          <MenuItem icon={<Trash2 size={14}/>} label="Apagar" danger disabled={busy} onClick={onDelete} />
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon, label, onClick, danger, disabled }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ display:"flex", alignItems:"center", gap:8, width:"100%", padding:"8px 12px", borderRadius:7, border:"none", background:"none", cursor:disabled?"not-allowed":"pointer", fontSize:13, color:danger?"#ef4444":C.navy, textAlign:"left", opacity:disabled?0.5:1 }}
    >
      {icon} {label}
    </button>
  );
}

// ─── Card ─────────────────────────────────────────────────────
function QuoteCard({
  quote, onApprove, onPay, onDelete, onDragStart, dragging, busy,
}: {
  quote: QuoteData;
  onApprove: () => void;
  onPay: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  dragging: boolean;
  busy: boolean;
}) {
  const col = statusToCol(quote.status);
  const expired = isExpired(quote);

  function whatsapp() {
    const phone = quote.clientWhatsapp.replace(/\D/g, "");
    const msg = encodeURIComponent(`Olá ${quote.clientName}! Segue seu orçamento: ${fmtBRL(quote.total)}.`);
    window.open(`https://wa.me/55${phone}?text=${msg}`, "_blank");
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      style={{
        background:C.bg, border:`1px solid ${expired ? "#FCA5A5" : C.border}`,
        borderRadius:14, padding:"14px 16px", cursor:"grab", userSelect:"none",
        opacity:dragging?0.4:1, boxShadow:"0 1px 4px rgba(0,0,0,.05)", transition:"box-shadow .15s",
      }}
    >
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
        <div>
          <div style={{ fontWeight:600, fontSize:14, color:C.navy }}>{quote.clientName}</div>
          <div style={{ fontSize:11, color:C.muted, display:"flex", alignItems:"center", gap:4, marginTop:2 }}>
            <Clock size={10}/> {fmtDate(quote.createdAt)}
            {quote.paidAt && <> · pago {fmtDate(quote.paidAt)}</>}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:2 }}>
          {expired && <AlertCircle size={14} color="#EF4444"/>}
          <ActionMenu quote={quote} onDelete={onDelete} busy={busy} />
        </div>
      </div>

      <div style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:20, color:C.primary, marginBottom:10 }}>
        {fmtBRL(quote.total)}
      </div>

      {(quote.formaPagamento === "crediario" || expired) && (
        <div style={{ display:"flex", gap:6, marginBottom:12, flexWrap:"wrap" }}>
          {quote.formaPagamento === "crediario" && (
            <span style={{ fontSize:10, fontWeight:600, background:C.amberBg, color:C.amber, borderRadius:99, padding:"2px 8px" }}>🤝 Crediário</span>
          )}
          {expired && (
            <span style={{ fontSize:10, fontWeight:600, background:C.redBg, color:C.red, borderRadius:99, padding:"2px 8px" }}>Expirado</span>
          )}
        </div>
      )}

      {/* Ação principal por coluna */}
      {col === "novo" && (
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={onApprove} disabled={busy} style={{ flex:1, background:C.primary, color:"#fff", border:"none", borderRadius:10, padding:"10px 0", fontWeight:600, fontSize:13, cursor:busy?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6, opacity:busy?0.6:1 }}>
            <CheckCircle size={14}/> Aprovar
          </button>
          <button onClick={whatsapp} style={{ width:44, background:"#25D366", color:"#fff", border:"none", borderRadius:10, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }} aria-label="Enviar no WhatsApp">
            <MessageCircle size={17}/>
          </button>
        </div>
      )}

      {col === "aprovado" && (
        <button onClick={onPay} disabled={busy} style={{ width:"100%", background:C.blue, color:"#fff", border:"none", borderRadius:10, padding:"10px 0", fontWeight:600, fontSize:13, cursor:busy?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6, opacity:busy?0.6:1 }}>
          <CreditCard size={14}/> Registrar pagamento
        </button>
      )}

      {col === "pago" && quote.formaPagamento === "crediario" && (
        <a href={`/dashboard/crediario/${quote.clientId}`} style={{ display:"block", textAlign:"center", width:"100%", background:C.surface, color:C.dark, border:`1px solid ${C.border}`, borderRadius:10, padding:"9px 0", fontWeight:600, fontSize:12, textDecoration:"none" }}>
          Ver crediário
        </a>
      )}
    </div>
  );
}

// ─── Modal de Pagamento ───────────────────────────────────────
function PaymentModal({
  quote, onClose, onConfirm, busy,
}: {
  quote: QuoteData | null;
  onClose: () => void;
  onConfirm: (tipo: "avista" | "crediario", vencimento: string | null) => void;
  busy: boolean;
}) {
  const [step, setStep] = useState<"escolha" | "crediario">("escolha");
  const [venc, setVenc] = useState("");

  useEffect(() => { if (quote) { setStep("escolha"); setVenc(""); } }, [quote]);

  if (!quote) return null;

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(26,26,46,.45)", backdropFilter:"blur(4px)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background:C.bg, borderRadius:20, padding:26, width:"100%", maxWidth:400, boxShadow:"0 20px 60px rgba(0,0,0,.18)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
          <div>
            <div style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:16, color:C.navy }}>Registrar pagamento</div>
            <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{quote.clientName} · {fmtBRL(quote.total)}</div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:C.muted, padding:4 }}><X size={18}/></button>
        </div>

        {step === "escolha" && (
          <>
            <p style={{ fontSize:13, color:C.muted, marginBottom:14 }}>Como o cliente vai pagar?</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <button onClick={() => onConfirm("avista", null)} disabled={busy} style={{ background:C.pale, border:`1.5px solid ${C.primary}`, borderRadius:14, padding:"18px 12px", cursor:busy?"not-allowed":"pointer", textAlign:"center" }}>
                <CreditCard size={22} style={{ margin:"0 auto 8px", display:"block", color:C.primary }}/>
                <div style={{ fontWeight:600, fontSize:14, color:C.navy }}>À Vista</div>
                <div style={{ fontSize:11, color:C.muted, marginTop:3 }}>Pago agora</div>
              </button>
              <button onClick={() => setStep("crediario")} disabled={busy} style={{ background:"#FEF9ED", border:"1.5px solid #F59E0B", borderRadius:14, padding:"18px 12px", cursor:busy?"not-allowed":"pointer", textAlign:"center" }}>
                <Handshake size={22} style={{ margin:"0 auto 8px", display:"block", color:"#D97706" }}/>
                <div style={{ fontWeight:600, fontSize:14, color:C.navy }}>Crediário</div>
                <div style={{ fontSize:11, color:C.muted, marginTop:3 }}>Fica em aberto</div>
              </button>
            </div>
          </>
        )}

        {step === "crediario" && (
          <>
            <div style={{ background:C.surface, borderRadius:12, padding:14, marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:12, color:C.muted }}>Valor que ficará em aberto</span>
                <span style={{ fontSize:15, fontWeight:700, color:C.primary }}>{fmtBRL(quote.total)}</span>
              </div>
            </div>
            <label style={{ fontSize:12, color:C.muted, display:"block", marginBottom:6 }}>Data de vencimento (opcional)</label>
            <input type="date" value={venc} onChange={(e) => setVenc(e.target.value)} style={{ width:"100%", borderRadius:10, border:`1px solid ${C.border}`, background:C.surface, padding:"11px 13px", fontSize:14, color:C.navy, outline:"none", marginBottom:18 }} />
            <p style={{ fontSize:11, color:C.amber, marginBottom:18 }}>O valor entra como conta a receber. A baixa é feita no extrato do cliente.</p>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => onConfirm("crediario", venc || null)} disabled={busy} style={{ flex:1, background:C.primary, color:"#fff", border:"none", borderRadius:12, padding:"13px 0", fontWeight:600, fontSize:14, cursor:busy?"not-allowed":"pointer", opacity:busy?0.6:1 }}>
                {busy ? "Salvando…" : "Confirmar crediário"}
              </button>
              <button onClick={() => setStep("escolha")} disabled={busy} style={{ background:C.surface, color:C.muted, border:"none", borderRadius:12, padding:"13px 16px", fontWeight:600, fontSize:13, cursor:"pointer" }}>Voltar</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Coluna (desktop) ─────────────────────────────────────────
function Column({
  col, quotes, onApprove, onPay, onDelete, onDrop, onDragStart, dragging, busyId,
}: {
  col: typeof COLUMNS[0];
  quotes: QuoteData[];
  onApprove: (q: QuoteData) => void;
  onPay: (q: QuoteData) => void;
  onDelete: (q: QuoteData) => void;
  onDrop: (col: Col) => void;
  onDragStart: (id: string) => void;
  dragging: string | null;
  busyId: string | null;
}) {
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={() => { onDrop(col.key); setOver(false); }}
      style={{ flex:"0 0 248px", background:over?col.bg:C.surface, borderRadius:16, padding:13, border:`2px dashed ${over?col.color:"transparent"}`, transition:"all .2s", minHeight:200 }}
    >
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12, paddingLeft:2 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ width:8, height:8, borderRadius:"50%", background:col.color }}/>
          <span style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:13, color:C.navy }}>{col.label}</span>
        </div>
        <span style={{ fontSize:12, fontWeight:600, color:C.muted, background:C.bg, borderRadius:99, padding:"2px 8px", minWidth:22, textAlign:"center" }}>{quotes.length}</span>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {quotes.length === 0 ? <p style={{ fontSize:12, color:C.muted, textAlign:"center", padding:"24px 0", opacity:.6 }}>Vazio</p> :
          quotes.map((q) => (
            <QuoteCard key={q.id} quote={q} onApprove={() => onApprove(q)} onPay={() => onPay(q)} onDelete={() => onDelete(q)} onDragStart={() => onDragStart(q.id)} dragging={dragging === q.id} busy={busyId === q.id} />
          ))}
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────
export default function HistoricoKanban({ quotes: initialQuotes }: { quotes: QuoteData[] }) {
  const router = useRouter();
  const [quotes, setQuotes]     = useState(initialQuotes);
  const [search, setSearch]     = useState("");
  const [activeTab, setActiveTab] = useState<Col>("novo");
  const [dragging, setDragging] = useState<string | null>(null);
  const [modalQuote, setModalQuote] = useState<QuoteData | null>(null);
  const [busyId, setBusyId]     = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => { setQuotes(initialQuotes); }, [initialQuotes]);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const filtered = quotes.filter((q) =>
    q.clientName.toLowerCase().includes(search.toLowerCase())
  );
  const byCol = (c: Col) => filtered.filter((q) => statusToCol(q.status) === c);

  async function handleApprove(q: QuoteData) {
    setBusyId(q.id);
    await approveQuote(q.id, q.clientId);
    setBusyId(null);
    router.refresh();
  }

  function handlePay(q: QuoteData) {
    setModalQuote(q);
  }

  async function handleConfirmPayment(tipo: "avista" | "crediario", vencimento: string | null) {
    if (!modalQuote) return;
    setBusyId(modalQuote.id);
    if (tipo === "avista") {
      await markQuoteAsPaid(modalQuote.id, modalQuote.clientId);
    } else {
      await markQuoteAsPaid(modalQuote.id, modalQuote.clientId, true, vencimento);
    }
    setBusyId(null);
    setModalQuote(null);
    router.refresh();
  }

  async function handleDrop(targetCol: Col) {
    if (!dragging) return;
    const q = quotes.find((x) => x.id === dragging);
    setDragging(null);
    if (!q) return;
    const from = statusToCol(q.status);
    if (from === targetCol) return;

    if (targetCol === "pago") { setModalQuote(q); return; }
    if (targetCol === "aprovado" && from === "novo") { await handleApprove(q); return; }
    if (targetCol === "cancelado") { setBusyId(q.id); await cancelQuote(q.id); setBusyId(null); router.refresh(); return; }
    if (targetCol === "novo" && from === "cancelado") { setBusyId(q.id); await reactivateQuote(q.id); setBusyId(null); router.refresh(); return; }
  }

  async function handleDelete(q: QuoteData) {
    if (!confirm("Apagar este orçamento definitivamente?")) return;
    setBusyId(q.id);
    await deleteQuote(q.id);
    setBusyId(null);
    router.refresh();
  }

  return (
    <div style={{ minHeight:"100vh", background:C.surface }}>
      {/* Header com busca */}
      <div style={{ background:C.bg, borderBottom:`1px solid ${C.border}`, padding:"14px 20px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
          <a href="/dashboard" style={{ color:C.muted, textDecoration:"none", fontSize:18 }}>←</a>
          <span style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:16, color:C.navy }}>Orçamentos</span>
          <span style={{ fontSize:12, color:C.muted }}>{quotes.length}</span>
        </div>
        <div style={{ position:"relative" }}>
          <Search size={15} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:C.muted }} />
          <input
            type="text" placeholder="Buscar cliente…" value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ width:"100%", borderRadius:10, border:`1px solid ${C.border}`, background:C.surface, padding:"10px 12px 10px 36px", fontSize:14, color:C.navy, outline:"none" }}
          />
        </div>
      </div>

      {/* Tabs (mobile) */}
      {isMobile && (
        <div style={{ display:"flex", gap:6, padding:"14px 16px 0", overflowX:"auto", background:C.bg, borderBottom:`1px solid ${C.border}` }}>
          {COLUMNS.map((col) => {
            const count = byCol(col.key).length;
            const active = activeTab === col.key;
            return (
              <button key={col.key} onClick={() => setActiveTab(col.key)} style={{ flexShrink:0, padding:"8px 16px", borderRadius:99, border:`1.5px solid ${active?col.color:C.border}`, background:active?col.bg:"none", fontWeight:600, fontSize:12, color:active?col.color:C.muted, cursor:"pointer", marginBottom:14, whiteSpace:"nowrap" }}>
                {col.label} {count > 0 && <span style={{ opacity:.7 }}>{count}</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* Board */}
      <div style={{ padding:"20px", overflowX:"auto" }}>
        {isMobile ? (
          <div style={{ maxWidth:480, margin:"0 auto", display:"flex", flexDirection:"column", gap:10 }}>
            {byCol(activeTab).length === 0 ? (
              <p style={{ fontSize:13, color:C.muted, textAlign:"center", padding:"48px 0" }}>Nenhum orçamento aqui.</p>
            ) : byCol(activeTab).map((q) => (
              <QuoteCard key={q.id} quote={q} onApprove={() => handleApprove(q)} onPay={() => handlePay(q)} onDelete={() => handleDelete(q)} onDragStart={() => {}} dragging={false} busy={busyId === q.id} />
            ))}
          </div>
        ) : (
          <div style={{ display:"flex", gap:16, minWidth:"max-content" }}>
            {COLUMNS.map((col) => (
              <Column key={col.key} col={col} quotes={byCol(col.key)} onApprove={handleApprove} onPay={handlePay} onDelete={handleDelete} onDrop={handleDrop} onDragStart={setDragging} dragging={dragging} busyId={busyId} />
            ))}
          </div>
        )}
      </div>

      <PaymentModal quote={modalQuote} onClose={() => setModalQuote(null)} onConfirm={handleConfirmPayment} busy={busyId === modalQuote?.id} />
    </div>
  );
}
