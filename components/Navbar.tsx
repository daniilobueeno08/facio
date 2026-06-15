"use client";

import { useState, useEffect } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        transition: "all 0.3s",
        backgroundColor: scrolled ? "rgba(255,255,255,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(8px)" : "none",
        borderBottom: scrolled ? "1px solid #E5E7EB" : "none",
      }}
    >
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 20px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, letterSpacing: "-0.3px", color: "#1A1A2E" }}>
          fa<span style={{ color: "#639922" }}>c</span>io
        </span>
        <a
          href="#cadastro"
          style={{
            fontSize: 12, fontWeight: 600, fontFamily: "var(--font-display)",
            color: "#639922", border: "1px solid rgba(99,153,34,0.4)",
            borderRadius: 8, padding: "6px 14px", textDecoration: "none",
            transition: "background 0.2s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "#EAF3DE")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          Cadastrar grátis
        </a>
      </div>
    </header>
  );
}
