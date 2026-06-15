import Navbar   from "@/components/Navbar";
import LeadForm from "@/components/LeadForm";

/* ── design tokens ─────────────────────────────────── */
const C = {
  bg:      "#FFFFFF",  surface: "#F4F6F3",
  text:    "#1A1A2E",  muted:   "#6B7280",
  border:  "#E5E7EB",  primary: "#639922",
  light:   "#97C459",  pale:    "#EAF3DE",
  dark:    "#3B6D11",  navy:    "#1A1A2E",
};
const display = "var(--font-display)";
const body    = "var(--font-body)";
const wrap: React.CSSProperties = { maxWidth: 560, margin: "0 auto", padding: "0 20px" };

const STEPS = [
  { n:"1", emoji:"📝", title:"Cria o orçamento",    desc:"Preenche os dados do serviço em 30 segundos — direto no celular, sem precisar abrir o computador." },
  { n:"2", emoji:"📄", title:"PDF gerado na hora",   desc:"O Facio monta o recibo automaticamente com sua logo, valores e dados do cliente." },
  { n:"3", emoji:"💬", title:"Envia pelo WhatsApp",  desc:"Com um toque, o PDF chega no WhatsApp do cliente. Profissional, rápido, sem enrolação." },
];

const FAQS = [
  { q:"Preciso de computador para usar?",        a:"Não. O Facio foi feito 100% para celular. Você usa onde estiver — na garagem do cliente, no caminho de volta." },
  { q:"É difícil de configurar?",                a:"Nos primeiros 5 minutos você já envia seu primeiro orçamento. Sem manual, sem tutorial longo." },
  { q:"Quanto vai custar?",                      a:"Grátis agora para quem se cadastrar. R$ 29,90/mês no lançamento — e quem entrar antes garante esse valor para sempre." },
  { q:"Funciona para qualquer tipo de serviço?", a:"Sim. Higienização, elétrica, fisioterapia, jardinagem, limpeza, manutenção. Se você presta serviço, o Facio funciona." },
];

const AVATARS  = [
  { i:"HC", bg:"#639922" }, { i:"FD", bg:"#3B6D11" },
  { i:"EJ", bg:"#97C459" }, { i:"LM", bg:"#4E7A1B" },
];
const NICHOS   = ["Higienização","Elétrica","Fisioterapia","Limpeza","Jardinagem","Encanamento"];

/* ── page ───────────────────────────────────────────── */
export default function Home() {
  return (
    <>
      <Navbar />

      {/* ── 1. HERO ──────────────────────────────────── */}
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", paddingTop: 80, paddingBottom: 64, background: C.bg }}>
        <div style={wrap}>

          {/* eyebrow */}
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 20, borderRadius: 99, background: C.pale, border: `1px solid rgba(99,153,34,.2)`, padding: "4px 14px", fontSize: 11, fontWeight: 600, fontFamily: display, letterSpacing: ".06em", textTransform: "uppercase", color: C.dark }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.primary, display: "inline-block" }} />
            Para autônomos em movimento
          </span>

          <h1 style={{ fontFamily: display, fontWeight: 700, fontSize: "clamp(1.75rem, 5vw, 2.25rem)", lineHeight: 1.15, letterSpacing: "-0.5px", color: C.navy, marginBottom: 16 }}>
            Você termina o serviço.{" "}
            <span style={{ color: C.primary }}>O recibo já chegou no cliente.</span>
          </h1>

          <p style={{ fontFamily: body, fontSize: 16, lineHeight: 1.65, color: C.muted, marginBottom: 32 }}>
            Crie orçamentos, gere recibos e envie pelo WhatsApp —
            tudo em 2 minutos, pelo celular, sem abrir computador.
          </p>

          <div id="cadastro">
            <LeadForm />
          </div>

          {/* scroll hint */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 48, gap: 4, opacity: 0.4 }}>
            <span style={{ fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", color: C.muted }}>ver como funciona</span>
            <span style={{ fontSize: 18, animation: "bounce 1.5s infinite" }}>↓</span>
          </div>
        </div>
      </section>

      {/* ── 2. PROVA SOCIAL ──────────────────────────── */}
      <section style={{ background: C.surface, padding: "32px 0" }}>
        <div style={wrap}>
          <p style={{ textAlign: "center", fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 16 }}>
            Já na lista de acesso antecipado
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <div style={{ display: "flex" }}>
              {AVATARS.map((a) => (
                <div key={a.i} style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid #fff", background: a.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: a.bg === "#97C459" ? C.navy : "#fff", fontFamily: display, marginLeft: -6, zIndex: 1 }}>
                  {a.i}
                </div>
              ))}
            </div>
            <p style={{ fontSize: 14, color: C.muted }}>
              <strong style={{ fontFamily: display, color: C.navy }}>+47 autônomos</strong> aguardando o lançamento
            </p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 20 }}>
            {NICHOS.map((n) => (
              <span key={n} style={{ borderRadius: 99, background: C.bg, border: `1px solid ${C.border}`, padding: "4px 12px", fontSize: 11, color: C.muted }}>
                {n}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. COMO FUNCIONA ─────────────────────────── */}
      <section style={{ padding: "64px 0", background: C.bg }}>
        <div style={wrap}>
          <p style={{ fontSize: 11, color: C.primary, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontFamily: display, marginBottom: 8 }}>
            simples assim
          </p>
          <h2 style={{ fontFamily: display, fontWeight: 700, fontSize: "clamp(1.4rem,4vw,1.75rem)", color: C.navy, lineHeight: 1.25, marginBottom: 40 }}>
            Três passos. <span style={{ color: C.primary }}>Dois minutos.</span> Zero computador.
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {STEPS.map((s, i) => (
              <div key={s.n} style={{ display: "flex", gap: 16 }}>
                {/* connector column */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: C.pale, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                    {s.emoji}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{ width: 1, flexGrow: 1, background: C.border, margin: "4px 0" }} />
                  )}
                </div>
                {/* text */}
                <div style={{ paddingBottom: i < STEPS.length - 1 ? 28 : 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.primary, fontFamily: display, textTransform: "uppercase", letterSpacing: ".08em" }}>passo {s.n}</span>
                  <h3 style={{ fontFamily: display, fontWeight: 600, fontSize: 16, color: C.navy, margin: "2px 0 6px" }}>{s.title}</h3>
                  <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* callout */}
          <div style={{ marginTop: 32, borderRadius: 16, background: C.pale, border: `1px solid rgba(99,153,34,.2)`, padding: 20, display: "flex", gap: 12 }}>
            <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>💸</span>
            <p style={{ fontSize: 14, color: C.dark, lineHeight: 1.6 }}>
              <strong style={{ fontFamily: display }}>A planilha não cobra o cliente por você.</strong>{" "}
              O Facio cobra. Acompanhe quem pagou, quem está devendo e quanto você fechou no mês.
            </p>
          </div>
        </div>
      </section>

      {/* ── 4. FAQ ───────────────────────────────────── */}
      <section style={{ background: C.surface, padding: "64px 0" }}>
        <div style={wrap}>
          <p style={{ fontSize: 11, color: C.primary, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontFamily: display, marginBottom: 8 }}>
            dúvidas frequentes
          </p>
          <h2 style={{ fontFamily: display, fontWeight: 700, fontSize: "clamp(1.4rem,4vw,1.75rem)", color: C.navy, lineHeight: 1.25, marginBottom: 32 }}>
            Perguntas diretas. <span style={{ color: C.primary }}>Respostas curtas.</span>
          </h2>

          <div>
            {FAQS.map((faq, i) => (
              <div key={faq.q} style={{ padding: "16px 0", borderBottom: i < FAQS.length - 1 ? `1px solid ${C.border}` : "none", display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ color: C.primary, fontSize: 16, flexShrink: 0, marginTop: 1 }}>✓</span>
                <div>
                  <p style={{ fontFamily: display, fontWeight: 600, fontSize: 14, color: C.navy, marginBottom: 4 }}>{faq.q}</p>
                  <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. CTA FINAL ─────────────────────────────── */}
      <section style={{ background: C.navy, padding: "64px 0" }}>
        <div style={{ ...wrap, textAlign: "center" }}>
          <p style={{ fontSize: 11, color: C.light, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontFamily: display, marginBottom: 12 }}>
            acesso antecipado
          </p>
          <h2 style={{ fontFamily: display, fontWeight: 700, fontSize: "clamp(1.4rem,4vw,1.75rem)", color: "#fff", lineHeight: 1.25, marginBottom: 12 }}>
            Pare de perder cliente{" "}
            <span style={{ color: C.light }}>por demora no orçamento.</span>
          </h2>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,.6)", lineHeight: 1.65, marginBottom: 32 }}>
            Todo autônomo tem talento. Poucos têm controle.
            O Facio resolve o segundo — para você focar no que faz de melhor.
          </p>
          <LeadForm className="text-left" />
          <p style={{ marginTop: 24, fontSize: 12, color: "rgba(255,255,255,.25)", lineHeight: 1.6 }}>
            Sem cartão de crédito agora · Sem compromisso · Acesso antes de todo mundo
          </p>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: "24px 0" }}>
        <div style={{ ...wrap, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: display, fontWeight: 700, fontSize: 16, color: C.navy }}>
            fa<span style={{ color: C.primary }}>c</span>io
          </span>
          <p style={{ fontSize: 11, color: C.muted }}>© 2026 Facio · gestão para autônomos</p>
        </div>
      </footer>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(6px); }
        }
      `}</style>
    </>
  );
}
