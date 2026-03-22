"use client";

import { useEffect, useMemo, useState } from "react";

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(parsed);
}

function formatRemaining(ms) {
  if (!Number.isFinite(ms) || ms <= 0) {
    return "00:00:00";
  }

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((item) => String(item).padStart(2, "0")).join(":");
}

export default function MobileTaskCountdownCard({
  acceptedAt,
  deadlineAt,
  currentStepLabel = "Etapa atual"
}) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const remainingMs = useMemo(() => {
    if (!deadlineAt) {
      return 0;
    }

    const parsed = new Date(deadlineAt).getTime();
    if (!Number.isFinite(parsed)) {
      return 0;
    }

    return Math.max(0, parsed - now);
  }, [deadlineAt, now]);

  const expired = remainingMs <= 0;

  return (
    <section className={"grid gap-2 rounded-xl border border-slate-200 bg-white/[0.94] p-3 shadow-[0_10px_24px_rgba(15,23,42,0.08)]"}>
      <div className={"flex items-center justify-between gap-2"}>
        <strong className={"text-sm text-slate-900"}>Tempo da tarefa</strong>
        <span
          className={
            expired
              ? "rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] text-red-700"
              : "rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700"
          }
        >
          {expired ? "Prazo expirado" : "Dentro do prazo"}
        </span>
      </div>

      <div className={"grid gap-1 rounded-lg border border-slate-200 bg-slate-50 p-2.5"}>
        <div className={"text-[11px] uppercase tracking-[0.1em] text-slate-500"}>{currentStepLabel}</div>
        <div className={"text-[28px] font-semibold tracking-[0.04em] text-slate-900"}>{formatRemaining(remainingMs)}</div>
      </div>

      <div className={"grid gap-1 text-[11px] text-slate-600"}>
        <span>Aceite: {formatDateTime(acceptedAt)}</span>
        <span>Prazo final: {formatDateTime(deadlineAt)}</span>
      </div>
    </section>
  );
}
