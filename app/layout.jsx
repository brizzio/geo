import "./globals.css";
import "leaflet/dist/leaflet.css";
import AppProviders from "../components/app-providers";
import AppShell from "../components/app-shell";

export const metadata = {
  title: "Inteligencia de Precos",
  description: "Migracao incremental para Next.js",
  applicationName: "NKET Mobile",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NKET Mobile"
  },
  formatDetection: {
    telephone: false
  },
  icons: {
    shortcut: "/icons/favicon.ico",
    apple: "/icons/icon-192.png",
    icon: [
      { url: "/icons/favicon.ico", sizes: "any", type: "image/x-icon" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }
    ]
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f172a"
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
