"use client";

import { useEffect, useState } from "react";

function isStandaloneMode() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true ||
    document.referrer.startsWith("android-app://")
  );
}

function isMobileDevice() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
}

function isAppleMobileDevice() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function useMobilePwa() {
  const [ready, setReady] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [mobileDevice, setMobileDevice] = useState(false);
  const [appleMobileDevice, setAppleMobileDevice] = useState(false);
  const [secureContext, setSecureContext] = useState(false);
  const [origin, setOrigin] = useState("");
  const [installPromptEvent, setInstallPromptEvent] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    let active = true;

    function syncState() {
      if (!active) {
        return;
      }

      setIsStandalone(isStandaloneMode());
      setMobileDevice(isMobileDevice());
      setAppleMobileDevice(isAppleMobileDevice());
      setSecureContext(window.isSecureContext);
      setOrigin(window.location.origin);
      setReady(true);
    }

    function registerServiceWorker() {
      if (!("serviceWorker" in navigator)) {
        return;
      }

      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("Falha ao registrar service worker", error);
      });
    }

    function handleBeforeInstallPrompt(event) {
      event.preventDefault();
      setInstallPromptEvent(event);
      syncState();
    }

    function handleInstalled() {
      setInstallPromptEvent(null);
      syncState();
    }

    syncState();

    if (document.readyState === "complete") {
      registerServiceWorker();
    } else {
      window.addEventListener("load", registerServiceWorker, { once: true });
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    const displayModeQuery = window.matchMedia("(display-mode: standalone)");
    const handleDisplayModeChange = () => {
      syncState();
    };

    if (typeof displayModeQuery.addEventListener === "function") {
      displayModeQuery.addEventListener("change", handleDisplayModeChange);
    } else {
      displayModeQuery.addListener(handleDisplayModeChange);
    }

    return () => {
      active = false;
      window.removeEventListener("load", registerServiceWorker);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);

      if (typeof displayModeQuery.removeEventListener === "function") {
        displayModeQuery.removeEventListener("change", handleDisplayModeChange);
      } else {
        displayModeQuery.removeListener(handleDisplayModeChange);
      }
    };
  }, []);

  async function promptInstall() {
    if (!installPromptEvent) {
      return { outcome: "unavailable" };
    }

    await installPromptEvent.prompt();
    const choice = await installPromptEvent.userChoice;
    setInstallPromptEvent(null);
    return choice;
  }

  return {
    ready,
    isStandalone,
    isMobileDevice: mobileDevice,
    isAppleMobileDevice: appleMobileDevice,
    isSecureContext: secureContext,
    origin,
    canPromptInstall: Boolean(installPromptEvent),
    promptInstall
  };
}
