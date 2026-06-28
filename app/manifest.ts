import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Facio — Gestão para autônomos",
    short_name: "Facio",
    description: "Crie orçamentos, gere recibos e envie pelo WhatsApp em 2 minutos.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#1A1A2E",
    theme_color: "#639922",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
