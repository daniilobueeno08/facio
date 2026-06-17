"use client";

import { useState } from "react";
import Link from "next/link";
import { signUp } from "@/app/auth-actions";

const C = { bg:"#FFFFFF", surface:"#F4F6F3", text:"#1A1A2E", muted:"#6B7280", border:"#E5E7EB", primary:"#639922", pale:"#EAF3DE" };
const input: React.CSSProperties = { width:"100%", borderRadius:12, border:`1px solid ${C.border}`, background:C.surface, padding:"12px 16px", fontSize:14, color:C.text, outline:"none", fontFamily:"var(--font-body)" };

export default function CadastroPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signUp(new FormData(e.currentTarget));
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:C.bg, padding:20 }}>
      <div style={{ width:"100%", maxWidth:380 }}>
        <Link href="/" style={{ textDecoration:"none" }}>
          <div style={{ textAlign:"center", marginBottom:32, fontFamily:"var(--font-display)", fontWeight:700, fontSize:22, color:C.text }}>
            fa<span style={{ color:C.primary }}>c</span>io
          </div>
        </Link>

        <h1 style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:20, color:C.text, marginBottom:6, textAlign:"center" }}>
          Criar sua conta gratuita
        </h1>
        <p style={{ fontSize:13, color:C.muted, textAlign:"center", marginBottom:28 }}>
          Comece a enviar orçamentos em minutos
        </p>

        <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <input type="text"  name="nome"     placeholder="Seu nome"                    required style={input} />
          <input type="tel"   name="whatsapp" placeholder="WhatsApp (DDD) 9 0000-0000"  required style={input} />
          <input type="email" name="email"    placeholder="seu@email.com"               required style={input} />
          <input type="password" name="password" placeholder="Crie uma senha (mín. 6 caracteres)" required minLength={6} style={input} />
          {error && <p style={{ fontSize:12, color:"#ef4444", marginTop:-4 }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{ width:"100%", borderRadius:12, background:C.primary, color:"#fff", fontWeight:600, fontSize:14, fontFamily:"var(--font-display)", padding:"14px 0", border:"none", cursor:loading?"not-allowed":"pointer", opacity:loading?0.7:1 }}
          >
            {loading ? "Criando conta…" : "Criar conta gratuita"}
          </button>
          <p style={{ textAlign:"center", fontSize:11, color:C.muted }}>
            Grátis agora · R$ 29,90/mês no lançamento · Cancela quando quiser
          </p>
        </form>

        <p style={{ textAlign:"center", fontSize:13, color:C.muted, marginTop:20 }}>
          Já tem conta?{" "}
          <Link href="/login" style={{ color:C.primary, fontWeight:600, textDecoration:"none" }}>
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
