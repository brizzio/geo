import "./globals.css";
import "leaflet/dist/leaflet.css";
import AppProviders from "../components/app-providers";
import AppShell from "../components/app-shell";

export const metadata = {
  title: "Inteligencia de Precos",
  description: "Migracao incremental para Next.js"
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
