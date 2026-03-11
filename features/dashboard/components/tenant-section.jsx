"use client";

import Link from "next/link";
import BulkCreateControl from "./bulk-create-control";
import SectionCard from "./section-card";

export default function TenantSection({
  tenants,
  activeTenantId,
  onDelete,
  onActivate,
  onBulkCreate = () => ({ total: 0, success: 0, failed: 0, errors: [] })
}) {
  return (
    <SectionCard
      title="CONTA"
      sectionId="conta"
      hint="Contas cadastradas no sistema. Para criar, use a pagina dedicada de formulario."
    >
      <div className={"flex flex-wrap gap-2"}>
        <Link href="/accounts/new" className={"inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2.5 text-[13px] text-white no-underline"}>
          Criar CONTA
        </Link>
        <BulkCreateControl onImport={onBulkCreate} />
      </div>

      <div className={"grid gap-1.5"}>
        {tenants.length === 0 ? (
          <div className={"rounded-lg border border-dashed border-slate-300 p-2.5 text-xs opacity-75"}>Nenhuma conta cadastrada.</div>
        ) : (
          tenants.map((tenant) => (
            <article key={tenant.id} className={"grid gap-1.5 rounded-lg border border-slate-200 bg-white p-2"}>
              <div className={"flex items-center justify-between gap-2"}>
                <strong>{tenant.name}</strong>
                <div className={"flex flex-wrap gap-1.5"}>
                  <span className={"rounded-full border border-slate-300 px-2 py-0.5 text-[11px]"}>{tenant.person_type}</span>
                  {String(activeTenantId) === String(tenant.id) ? (
                    <span className={"inline-flex items-center justify-center rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] text-indigo-900"}>Ativa</span>
                  ) : null}
                </div>
              </div>
              <small>
                {tenant.document || "Sem documento"}{" "}
                {tenant.address?.city || tenant.address?.state
                  ? `| ${tenant.address?.city || "-"} / ${tenant.address?.state || "-"}`
                  : ""}
              </small>
              {tenant.logo_base64 ? (
                <img
                  src={tenant.logo_base64}
                  alt={`Logo ${tenant.name}`}
                  style={{
                    width: 52,
                    height: 52,
                    objectFit: "contain",
                    border: "1px solid #e5e7eb",
                    borderRadius: 6,
                    background: "#fff",
                    padding: 4
                  }}
                />
              ) : null}
              <div className={"flex flex-wrap gap-2"}>
                <button type="button" className={"cursor-pointer rounded-md border-0 bg-slate-800 px-2.5 py-2 text-xs text-white"} onClick={() => onActivate(tenant.id)}>
                  Usar conta
                </button>
                <button type="button" className={`${"cursor-pointer rounded-md border-0 bg-slate-800 px-2.5 py-2 text-xs text-white"} ${"bg-red-700"}`} onClick={() => onDelete(tenant.id)}>
                  Remover
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </SectionCard>
  );
}

