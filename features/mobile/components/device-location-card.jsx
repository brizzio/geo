"use client";

import { useState } from "react";

function formatCoordinate(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return String(value);
  }

  return parsed.toFixed(6);
}

export default function DeviceLocationCard({
  title,
  description,
  buttonLabel,
  currentLat,
  currentLon,
  currentDisplayName,
  disabled = false,
  onLocationCaptured
}) {
  const [capturing, setCapturing] = useState(false);
  const [feedback, setFeedback] = useState("");

  async function handleCapture() {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setFeedback("Geolocalizacao indisponivel neste dispositivo.");
      return;
    }

    setCapturing(true);
    setFeedback("");

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const latitude = Number(position?.coords?.latitude);
      const longitude = Number(position?.coords?.longitude);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        throw new Error("Coordenadas invalidas retornadas pelo dispositivo.");
      }

      const nextLocation = {
        latitude,
        longitude,
        displayName: "GPS atual do dispositivo"
      };

      await onLocationCaptured?.(nextLocation);
      setFeedback("Localizacao atual capturada com sucesso.");
    } catch (captureError) {
      const errorCode = Number(captureError?.code);
      if (errorCode === 1) {
        setFeedback("Permissao de localizacao negada.");
      } else if (errorCode === 2) {
        setFeedback("Nao foi possivel obter a localizacao do dispositivo.");
      } else if (errorCode === 3) {
        setFeedback("Tempo esgotado ao tentar ler o GPS.");
      } else {
        setFeedback(captureError?.message || "Falha ao capturar localizacao.");
      }
    } finally {
      setCapturing(false);
    }
  }

  const hasCoordinates =
    currentLat !== null &&
    currentLat !== undefined &&
    currentLat !== "" &&
    currentLon !== null &&
    currentLon !== undefined &&
    currentLon !== "";

  return (
    <div className={"grid gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-2.5"}>
      <div className={"grid gap-1"}>
        <strong className={"text-xs text-slate-900"}>{title}</strong>
        {description ? <p className={"m-0 text-[11px] text-slate-600"}>{description}</p> : null}
      </div>

      <button
        type="button"
        onClick={handleCapture}
        disabled={disabled || capturing}
        className={"w-fit cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"}
      >
        {capturing ? "Lendo GPS..." : buttonLabel || "Usar GPS do dispositivo"}
      </button>

      {hasCoordinates ? (
        <div className={"grid gap-1 rounded-lg border border-slate-200 bg-white p-2 text-[11px] text-slate-600"}>
          <span>Latitude: {formatCoordinate(currentLat)}</span>
          <span>Longitude: {formatCoordinate(currentLon)}</span>
          {currentDisplayName ? <span>Origem: {currentDisplayName}</span> : null}
        </div>
      ) : null}

      {feedback ? (
        <p className={"m-0 rounded-lg border border-slate-200 bg-white p-2 text-[11px] text-slate-700"}>{feedback}</p>
      ) : null}
    </div>
  );
}
