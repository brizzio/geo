export default function manifest() {
  return {
    id: "/mobile",
    name: "NKET Mobile",
    short_name: "NKET",
    description: "Acesso mobile para pesquisadores.",
    start_url: "/mobile",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f8fafc",
    theme_color: "#0f172a",
    lang: "pt-BR",
    icons: [
      {
        src: "/icons/favicon.ico",
        sizes: "any",
        type: "image/x-icon"
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  };
}
