"use client";

import { useState } from "react";
import { receberPagamento } from "../actions";

const C = { bg:"#FFFFFF", surface:"#F4F6F3", text:"#1A1A2E", muted:"#6B7280", border:"#E5E7EB", primary:"#639922", pale:"#EAF3DE", dark:"#3B6D11", navy:"#1A1A2E" };

const STATUS_CFG: Record<string, { label:string; bg:string; color:string }> = {
  pendente: { label:"Pendente",          bg:"#FEF3C7", color:"#92400E" },
  parcial:  { label:"Parcialmente Pago", bg:"#FEE2E2", color:"#991B1B" },
  quitado:  { label:"Quitado",           bg:C.pale,   color:C.dark    },
};

const METODOS = [
  { value:"dinheiro",     label:"💵 Dinheiro" },
  { value:"pix",          label:"⚡ Pix" },
  { value:"cartao",       label:"💳 Cartão" },
  { value:"transferencia",label:"🏦 Transferência" },
  { value:"outro",        label:"📝 Outro" },
];

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

type Pagamento = { id:string; valor:number; metodo_pagamento:string; data_pagamento:string; observacao:string|null };
type Conta = {
  id:string; valor_total:number; valor_pago:number;
  data_vencimento:string|null; status:string;
  created_at:string; quote_id:string|null;
  historico_pagamentos:Pagamento[];
};

function ContaCard({ conta }: { conta: Conta }) {
  const [status, setStatus]   = useState(conta.status);
  const [pago, setPago]       = useState(conta.valor_pago);
  const [hist, setHist]       = useState(conta.historico_pagamentos);
  const [showForm, setShowForm] = useState(false);
  const [showHist, setShowHist] = useState(false);
  const [valorInput, setValorInput] = useState("");
  const [metodo, setMetodo]   = useState("dinheiro");
  const [obs, setObs]         = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const restante = conta.valor_total - pago;
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.pendente;
  const pct = Math.min((pago / conta.valor_total) * 100, 100);

  async function handlePagar() {
    setError("");
    const v = parseFloat(valorInput.replace(",", "."));
    if (isNaN(v) || v <= 0) { setError("Informe um valor válido."); return; }
    setLoading(true);
    const res = await receberPagamento(conta.id, valorInput, metodo, obs);
    if (res?.error) { setError(res.error); setLoading(false); return; }
    const novoP = Math.min(pago + v, conta.valor_total);
    setStatus(novoP >= conta.valor_total ? "quitado" : "parcial");
    setPago(novoP);
    setHist((prev) => [{
      id: Date.now().toString(), valor: v, metodo_pagamento: metodo,
      data_pagamento: new Date().toISOString(), observacao: obs || null,
    }, ...prev]);
    setValorInput(""); setObs(""); setShowForm(false); setLoading(false);
  }

  const metodoLabel = (m: string) => METODOS.find((x) => x.value === m)?.label ?? m;

  return (
    <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:14, padding:16, marginBottom:10 }}>
      {/* Cabeçalho */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
        <div>
          <div style={{ fontSize:12, color:C.muted }}>Lançado em {fmt(conta.created_at)}</div>
          {conta.data_vencimento && (
            <div style={{ fontSize:12, color:"#92400E", marginTop:2 }}>
              Vence em {fmt(conta.data_vencimento)}
            </div>
          )}
        </div>
        <span style={{ fontSize:10, fontWeight:600, padding:"3px 9px", borderRadius:99, background:cfg.bg, color:cfg.color }}>
          {cfg.label}
        </span>
      </div>

      {/* Valores */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:10 }}>
        {[
          { label:"Total",    valor:conta.valor_total, color:C.text },
          { label:"Pago",     valor:pago,              color:C.primary },
          { label:"Restante", valor:restante,           color:"#991B1B" },
        ].map(({ label, valor, color }) => (
          <div key={label} style={{ textAlign:"center" }}>
            <div style={{ fontSize:10, color:C.muted, marginBottom:2 }}>{label}</div>
            <div style={{ fontSize:14, fontWeight:700, color }}>R$ {valor.toFixed(2)}</div>
          </div>
        ))}
      </div>

      {/* Barra de progresso */}
      <div style={{ background:C.surface, borderRadius:99, height:5, marginBottom:12, overflow:"hidden" }}>
        <div style={{ background:C.primary, height:"100%", width:`${pct}%`, borderRadius:99, transition:"width 0.4s" }} />
      </div>

      {/* Formulário de pagamento */}
      {status !== "quitado" && (
        <>
          {!showForm ? (
            <button onClick={() => setShowForm(true)} style={{ width:"100%", background:C.primary, color:"#fff", fontWeight:600, fontFamily:"var(--font-display)", fontSize:13, padding:"11px 0", borderRadius:10, border:"none", cursor:"pointer" }}>
              Receber Pagamento
            </button>
          ) : (
            <div style={{ background:C.surface, borderRadius:12, padding:12 }}>
              <p style={{ fontSize:12, fontWeight:600, color:C.navy, marginBottom:10 }}>Registrar pagamento</p>

              <label style={{ fontSize:11, color:C.muted, display:"block", marginBottom:4 }}>
                Valor (máx. R$ {restante.toFixed(2)})
              </label>
              <input
                type="number" placeholder="0,00" value={valorInput}
                onChange={(e) => setValorInput(e.target.value)}
                max={restante} min={0.01} step={0.01}
                style={{ width:"100%", borderRadius:10, border:`1px solid ${C.border}`, background:C.bg, padding:"10px 12px", fontSize:14, color:C.text, outline:"none", marginBottom:10 }}
              />

              <label style={{ fontSize:11, color:C.muted, display:"block", marginBottom:4 }}>Forma de pagamento</label>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 }}>
                {METODOS.map((m) => (
                  <button
                    key={m.value} type="button"
                    onClick={() => setMetodo(m.value)}
                    style={{
                      padding:"6px 10px", borderRadius:8, fontSize:12, fontWeight:500,
                      border:`1px solid ${metodo === m.value ? C.primary : C.border}`,
                      background: metodo === m.value ? C.pale : C.bg,
                      color: metodo === m.value ? C.dark : C.muted,
                      cursor:"pointer",
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <input
                type="text" placeholder="Observação (opcional)" value={obs}
                onChange={(e) => setObs(e.target.value)}
                style={{ width:"100%", borderRadius:10, border:`1px solid ${C.border}`, background:C.bg, padding:"10px 12px", fontSize:13, color:C.text, outline:"none", marginBottom:10 }}
              />

              {error && <p style={{ fontSize:12, color:"#ef4444", marginBottom:8 }}>{error}</p>}

              <div style={{ display:"flex", gap:8 }}>
                <button onClick={handlePagar} disabled={loading} style={{ flex:1, background:C.primary, color:"#fff", fontWeight:600, fontFamily:"var(--font-display)", fontSize:13, padding:"11px 0", borderRadius:10, border:"none", cursor:loading ? "not-allowed" : "pointer" }}>
                  {loading ? "Registrando…" : "Confirmar"}
                </button>
                <button onClick={() => { setShowForm(false); setError(""); }} style={{ fontSize:13, color:C.muted, background:"none", border:"none", cursor:"pointer", padding:"11px 14px" }}>
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Histórico de pagamentos */}
      {hist.length > 0 && (
        <div style={{ marginTop:12 }}>
          <button onClick={() => setShowHist((v) => !v)} style={{ fontSize:11, color:C.muted, background:"none", border:"none", cursor:"pointer", padding:0 }}>
            {showHist ? "▲" : "▼"} {hist.length} pagamento{hist.length > 1 ? "s" : ""} registrado{hist.length > 1 ? "s" : ""}
          </button>
          {showHist && (
            <div style={{ marginTop:8, display:"flex", flexDirection:"column", gap:6 }}>
              {hist.map((p) => (
                <div key={p.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:C.surface, borderRadius:8, padding:"8px 10px" }}>
                  <div>
                    <div style={{ fontSize:12, color:C.text }}>{fmt(p.data_pagamento)} · {metodoLabel(p.metodo_pagamento)}</div>
                    {p.observacao && <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{p.observacao}</div>}
                  </div>
                  <div style={{ fontSize:13, fontWeight:600, color:C.primary }}>+ R$ {Number(p.valor).toFixed(2)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type Props = {
  clientId: string;
  clientName: string;
  saldoDevedor: number;
  limiteCredito: number;
  contas: Conta[];
};

export default function ExtratoCliente({ clientName, saldoDevedor, limiteCredito, contas }: Props) {
  const overLimit  = limiteCredito > 0 && saldoDevedor > limiteCredito;
  const abertas    = contas.filter((c) => c.status !== "quitado");
  const quitadas   = contas.filter((c) => c.status === "quitado");
  const pct        = limiteCredito > 0 ? Math.min((saldoDevedor / limiteCredito) * 100, 100) : 0;

  return (
    <div style={{ maxWidth:520, margin:"0 auto", padding:"20px" }}>

      {/* Saldo e limite */}
      <div style={{ background: overLimit ? "#991B1B" : C.navy, borderRadius:16, padding:20, marginBottom:20 }}>
        <div style={{ textAlign:"center", marginBottom: limiteCredito > 0 ? 12 : 0 }}>
          <p style={{ fontSize:12, color:"rgba(255,255,255,0.6)", marginBottom:4 }}>Saldo devedor</p>
          <p style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:30, color:"#fff" }}>
            R$ {saldoDevedor.toFixed(2)}
          </p>
          {saldoDevedor === 0 && (
            <p style={{ fontSize:12, color:"rgba(255,255,255,0.8)", marginTop:4 }}>✓ {clientName} está em dia</p>
          )}
        </div>

        {limiteCredito > 0 && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
              <span style={{ fontSize:11, color:"rgba(255,255,255,0.6)" }}>Uso do limite</span>
              <span style={{ fontSize:11, color:"rgba(255,255,255,0.8)" }}>
                R$ {saldoDevedor.toFixed(2)} / R$ {limiteCredito.toFixed(2)}
              </span>
            </div>
            <div style={{ background:"rgba(255,255,255,0.2)", borderRadius:99, height:6, overflow:"hidden" }}>
              <div style={{ background: overLimit ? "#FCA5A5" : "#fff", height:"100%", width:`${pct}%`, borderRadius:99, transition:"width 0.4s" }} />
            </div>
            {overLimit && (
              <p style={{ fontSize:12, color:"#FCA5A5", marginTop:8, textAlign:"center" }}>
                ⚠️ Limite ultrapassado em R$ {(saldoDevedor - limiteCredito).toFixed(2)}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Contas abertas */}
      {abertas.length > 0 && (
        <div style={{ marginBottom:20 }}>
          <p style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:13, color:C.navy, marginBottom:10 }}>Em aberto</p>
          {abertas.map((c) => <ContaCard key={c.id} conta={c} />)}
        </div>
      )}

      {/* Contas quitadas */}
      {quitadas.length > 0 && (
        <div>
          <p style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:13, color:C.muted, marginBottom:10 }}>Quitadas</p>
          {quitadas.map((c) => <ContaCard key={c.id} conta={c} />)}
        </div>
      )}

      {contas.length === 0 && (
        <p style={{ fontSize:13, color:C.muted, textAlign:"center", padding:"40px 0" }}>
          Nenhuma conta registrada para este cliente.
        </p>
      )}
    </div>
  );
}
