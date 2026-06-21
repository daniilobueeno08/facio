"use client";

import { useState, useRef } from "react";
import { submitLead } from "@/app/actions";
import { isValidEmail, isValidWhatsapp } from "@/lib/validation";

const inputStyle: React.CSSProperties = {
  width: "100%", borderRadius: 12,
  border: "1px solid #E5E7EB",
  background: "#F4F6F3",
  padding: "12px 16px", fontSize: 14,
  color: "#1A1A2E", outline: "none",
  fontFamily: "var(--font-body)",
};

const btnStyle = (loading: boolean): React.CSSProperties => ({
  width: "100%", borderRadius: 12,
  background: loading ? "#97C459" : "#639922",
  color: "#fff", fontWeight: 600, fontSize: 14,
  fontFamily: "var(--font-display)",
  padding: "14px 0", border: "none",
  cursor: loading ? "not-allowed" : "pointer",
  transition: "background 0.2s, transform 0.1s",
  opacity: loading ? 0.7 : 1,
});

export default function LeadForm({ className = "" }: { className?: string }) {
  const [state, setState] = useState<"idle"|"loading"|"done"|"error">("idle");
  const [msg,   setMsg  ] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("loading");
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    const email = (formData.get("email") as string)?.trim() ?? "";
    const whatsapp = (formData.get("whatsapp") as string) ?? "";
    const errors: Record<string, string> = {};

    if (!email) errors.email = "E-mail obrigatório.";
    else if (!isValidEmail(email)) errors.email = "E-mail inválido.";
    if (!whatsapp) errors.whatsapp = "WhatsApp obrigatório.";
    else if (!isValidWhatsapp(whatsapp)) errors.whatsapp = "WhatsApp inválido.";

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      setState("idle");
      return;
    }

    const result = await submitLead(new FormData(e.currentTarget));
    if (result.success) {
      setState("done");
      formRef.current?.reset();
    } else {
      setState("error");
      setMsg(result.error ?? "Tente novamente.");
      setTimeout(() => setState("idle"), 3000);
    }
  }

  if (state === "done") {
    return (
      <div className={className} style={{ borderRadius: 16, background: "#EAF3DE", border: "1px solid rgba(99,153,34,0.2)", padding: 20, textAlign: "center" }}>
        <div style={{ fontSize: 24, marginBottom: 4 }}>✓</div>
        <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, color: "#3B6D11", fontSize: 14 }}>Cadastro confirmado!</p>
        <p style={{ color: "#6B7280", fontSize: 12, marginTop: 4 }}>Você vai receber acesso antecipado assim que abrirmos.</p>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className={className} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <input type="email"   name="email"    placeholder="seu@email.com"              required style={{ ...inputStyle, ...(fieldErrors.email ? { border: "1px solid #ef4444" } : {}) }} />
      {fieldErrors.email && <p style={{ fontSize: 12, color: "#ef4444", marginTop: -4 }}>{fieldErrors.email}</p>}
      <input type="tel"     name="whatsapp" placeholder="WhatsApp (DDD) 9 0000-0000" required style={{ ...inputStyle, ...(fieldErrors.whatsapp ? { border: "1px solid #ef4444" } : {}) }} />
      {fieldErrors.whatsapp && <p style={{ fontSize: 12, color: "#ef4444", marginTop: -4 }}>{fieldErrors.whatsapp}</p>}
      {state === "error" && <p style={{ fontSize: 12, color: "#ef4444", marginTop: -4 }}>{msg}</p>}
      <button type="submit" disabled={state === "loading"} style={btnStyle(state === "loading")}>
        {state === "loading" ? "Enviando…" : "Quero acesso gratuito"}
      </button>
      <p style={{ textAlign: "center", fontSize: 11, color: "#6B7280" }}>
        Grátis agora · R$ 29,90/mês no lançamento · Cancela quando quiser
      </p>
    </form>
  );
}
