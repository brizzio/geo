"use client";

import { useEffect, useState } from "react";
import { useMobilePwa } from "../features/mobile/hooks/use-mobile-pwa";

const DEV_BROWSER_BYPASS_KEY = "nket-mobile-dev-browser-bypass";
const IS_DEVELOPMENT = process.env.NODE_ENV === "development";

function LoadingScreen() {
  return (
    <main className={"grid min-h-screen place-items-center bg-[linear-gradient(160deg,#f8fafc_0%,#dbeafe_52%,#e2e8f0_100%)] p-6"}>
      <p className={"m-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-[0_12px_24px_rgba(15,23,42,0.08)]"}>
        Preparando app mobile...
      </p>
    </main>
  );
}

function InstallScreen({
  title,
  subtitle,
  description,
  isMobileDevice,
  isAppleMobileDevice,
  isSecureContext,
  origin,
  canPromptInstall,
  promptInstall,
  canBypassInBrowser,
  onBypassInBrowser
}) {
  const [feedback, setFeedback] = useState("");

  async function handleInstall() {
    const choice = await promptInstall();
    if (choice?.outcome === "accepted") {
      setFeedback("Instalacao iniciada. Abra o app pela tela inicial.");
      return;
    }

    if (choice?.outcome === "dismissed") {
      setFeedback("Instalacao cancelada. Voce pode tentar novamente a qualquer momento.");
      return;
    }

    setFeedback("Use o menu do navegador e escolha a opcao para instalar o app.");
  }

  return (
    <main className={"grid min-h-screen place-items-center bg-[radial-gradient(circle_at_10%_12%,rgba(34,197,94,0.18),transparent_35%),radial-gradient(circle_at_88%_90%,rgba(59,130,246,0.2),transparent_40%),linear-gradient(145deg,#f8fafc_0%,#e2e8f0_46%,#f1f5f9_100%)] p-6"}>
      <section className={"w-full max-w-[460px] rounded-2xl border border-slate-200 bg-white/[0.94] p-6 shadow-[0_20px_40px_rgba(15,23,42,0.12)]"}>
        <header className={"grid gap-2"}>
          <p className={"m-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500"}>
            NKET Mobile
          </p>
          <h1 className={"m-0 text-2xl text-slate-900"}>{title || "Instale o app mobile"}</h1>
          <p className={"m-0 text-sm text-slate-600"}>{subtitle || "Esta area mobile so fica disponivel no app instalado."}</p>
          <p className={"m-0 text-sm text-slate-600"}>
            {description || "Abra o app pela tela inicial do dispositivo para liberar login e dashboard mobile."}
          </p>
        </header>

        <div className={"mt-5 grid gap-3"}>
          {!isSecureContext ? (
            <div className={"grid gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"}>
              <strong>Instalacao bloqueada nesta URL</strong>
              <p className={"m-0"}>
                Voce abriu em <strong>{origin || "HTTP"}</strong>. Em ambiente de desenvolvimento, o navegador so libera instalacao de PWA em contexto seguro.
              </p>
              <p className={"m-0"}>
                Rode <code>npm run dev:https</code> no projeto e teste pelo HTTPS local. Se o celular nao confiar no certificado local, use um tunel HTTPS.
              </p>
            </div>
          ) : null}

          {canPromptInstall ? (
            <button
              type="button"
              onClick={handleInstall}
              className={"cursor-pointer rounded-lg border border-slate-900 bg-slate-900 px-3 py-2.5 text-sm text-white"}
            >
              Instalar app
            </button>
          ) : null}

          {canBypassInBrowser ? (
            <button
              type="button"
              onClick={onBypassInBrowser}
              className={"cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"}
            >
              Continuar no navegador (dev)
            </button>
          ) : null}

          {!canPromptInstall && isAppleMobileDevice ? (
            <p className={"m-0 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800"}>
              No iPhone ou iPad, abra no Safari em HTTPS, toque em Compartilhar e depois em Adicionar a Tela de Inicio.
            </p>
          ) : null}

          {!canPromptInstall && isMobileDevice && !isAppleMobileDevice && isSecureContext ? (
            <p className={"m-0 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800"}>
              No Android, abra o menu do navegador e escolha Instalar app ou Adicionar a tela inicial se o prompt automatico nao aparecer.
            </p>
          ) : null}

          {!canPromptInstall && isMobileDevice && !isAppleMobileDevice && !isSecureContext ? (
            <p className={"m-0 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800"}>
              No Android, o item Instalar app normalmente so aparece quando a pagina esta em HTTPS.
            </p>
          ) : null}

          {!isMobileDevice ? (
            <p className={"m-0 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"}>
              Esta area foi bloqueada fora do app instalado. Use um celular para instalar e abrir o NKET Mobile.
            </p>
          ) : null}

          {feedback ? (
            <p className={"m-0 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800"}>
              {feedback}
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}

export default function MobileStandaloneGuard({ children, title, subtitle, description }) {
  const pwa = useMobilePwa();
  const [browserBypassEnabled, setBrowserBypassEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !IS_DEVELOPMENT) {
      return;
    }

    setBrowserBypassEnabled(window.sessionStorage.getItem(DEV_BROWSER_BYPASS_KEY) === "1");
  }, []);

  if (!pwa.ready) {
    return <LoadingScreen />;
  }

  const canBypassInBrowser = IS_DEVELOPMENT && !pwa.isMobileDevice;

  function handleBypassInBrowser() {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(DEV_BROWSER_BYPASS_KEY, "1");
    }
    setBrowserBypassEnabled(true);
  }

  if (!pwa.isStandalone && !browserBypassEnabled) {
    return (
      <InstallScreen
        title={title}
        subtitle={subtitle}
        description={description}
        isMobileDevice={pwa.isMobileDevice}
        isAppleMobileDevice={pwa.isAppleMobileDevice}
        isSecureContext={pwa.isSecureContext}
        origin={pwa.origin}
        canPromptInstall={pwa.canPromptInstall}
        promptInstall={pwa.promptInstall}
        canBypassInBrowser={canBypassInBrowser}
        onBypassInBrowser={handleBypassInBrowser}
      />
    );
  }

  return children;
}
