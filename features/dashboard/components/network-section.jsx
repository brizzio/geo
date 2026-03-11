"use client";

import Link from "next/link";
import BulkCreateControl from "./bulk-create-control";
import SectionCard from "./section-card";
import {
  NETWORK_SECTORS,
  NETWORK_SEGMENTS
} from "../../domain/models/network-model";

function labelById(options = [], id) {
  return options.find((item) => String(item.id) === String(id))?.name || id || "N/A";
}

export default function NetworkSection({
  tenantId,
  networks,
  onDelete,
  onBulkCreate = () => ({ total: 0, success: 0, failed: 0, errors: [] })
}) {
  return (
    <SectionCard
      title="REDES"
      sectionId="redes"
      hint="Lista de redes da conta ativa. O cadastro e feito em pagina dedicada."
    >
      {!tenantId ? <div className={"rounded-lg border border-dashed border-slate-300 p-2.5 text-xs opacity-75"}>Selecione uma conta ativa para gerenciar redes.</div> : null}

      <div className={"flex flex-wrap gap-2"}>
        <Link href="/networks/new" className={"inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2.5 text-[13px] text-white no-underline"}>
          Criar Rede
        </Link>
        <BulkCreateControl onImport={onBulkCreate} disabled={!tenantId} />
      </div>

      <div className={"grid gap-1.5"}>
        {networks.length === 0 ? (
          <div className={"rounded-lg border border-dashed border-slate-300 p-2.5 text-xs opacity-75"}>Nenhuma rede cadastrada.</div>
        ) : (
          networks.map((network) => (
            <article key={network.id} className={"grid gap-1.5 rounded-lg border border-slate-200 bg-white p-2"}>
              <div className={"flex items-center justify-between gap-2"}>
                <strong>{network.name}</strong>
                <div className={"flex flex-wrap gap-1.5"}>
                  <span className={"rounded-full border border-slate-300 px-2 py-0.5 text-[11px]"}>{labelById(NETWORK_SECTORS, network.sector)}</span>
                  <span className={"rounded-full border border-slate-300 px-2 py-0.5 text-[11px]"}>{labelById(NETWORK_SEGMENTS, network.segment)}</span>
                </div>
              </div>
              <small>{network.description || "Sem descricao"}</small>
              <small>
                HQ: {network.headquarter?.address?.city || "-"} / {network.headquarter?.address?.state || "-"}
              </small>
              <div className={"flex flex-wrap gap-2"}>
                <Link href={`/networks/${network.id}/edit`} className={"inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2.5 text-[13px] text-white no-underline"}>
                  Editar
                </Link>
                <button type="button" className={`${"cursor-pointer rounded-md border-0 bg-slate-800 px-2.5 py-2 text-xs text-white"} ${"bg-red-700"}`} onClick={() => onDelete(network.id)}>
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

