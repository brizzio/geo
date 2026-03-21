"use client";

import Link from "next/link";
import SectionCard from "../../dashboard/components/section-card";

export default function ResearcherStatsCard({
  total = 0,
  active = 0,
  loading = false,
  error = "",
  href = "/users"
}) {
  return (
    <SectionCard
      title="PESQUISADORES"
      hint="Contagem global de usuarios researcher com status registered e quantidade com sessao aberta."
    >
      {error ? (
        <p className={"m-0 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-800"}>
          {error}
        </p>
      ) : null}

      <div className={"grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]"}>
        <article className={"rounded-xl border border-slate-200 bg-slate-50 p-3"}>
          <div className={"text-[11px] tracking-[0.4px] opacity-75"}>REGISTRADOS</div>
          <div className={"mt-2 text-2xl"}>{loading ? "..." : total}</div>
        </article>

        <article className={"rounded-xl border border-emerald-200 bg-emerald-50 p-3"}>
          <div className={"text-[11px] tracking-[0.4px] opacity-75"}>ATIVOS AGORA</div>
          <div className={"mt-2 text-2xl"}>{loading ? "..." : active}</div>
        </article>
      </div>

      <div className={"flex flex-wrap gap-2"}>
        <Link
          href={href}
          className={"inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-900 no-underline"}
        >
          Ver usuarios
        </Link>
      </div>
    </SectionCard>
  );
}
