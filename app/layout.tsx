import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Facio — Gestão para autônomos",
  description:
    "Crie orçamentos, gere recibos e envie pelo WhatsApp em 2 minutos. Sem computador. Feito para quem trabalha em movimento.",
  openGraph: {
    title: "Facio — Gestão para autônomos",
    description: "Orçamento pronto, recibo no WhatsApp, dinheiro na mão.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Inter:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-facio-bg text-facio-text antialiased">
        {children}
      </body>
    </html>
  );
}
