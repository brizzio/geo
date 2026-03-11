"use client";

import Link from "next/link";
import BulkCreateControl from "./bulk-create-control";
import SectionCard from "./section-card";
import {
  RETAIL_BANNER_NETWORK_CHANNELS,
  RETAIL_BANNER_NETWORK_TYPES
} from "../../domain/models";

function labelById(options = [], id) {
  return options.find((item) => String(item.id) === String(id))?.name || id || "N/A";
}

function resolveBannerThumb(banner) {
  return (
    banner?.logo?.thumb_url ||
    banner?.logo?.display_url ||
    banner?.logo?.image_url ||
    banner?.logo_url ||
    null
  );
}

export default function BannerSection({
  tenantId,
  networks,
  banners,
  onDelete,
  onBulkCreate = () => ({ total: 0, success: 0, failed: 0, errors: [] })
}) {
  const networkName = Object.fromEntries(networks.map((item) => [String(item.id), item.name]));

  return (
    <SectionCard
      title="BANDEIRAS"
      sectionId="bandeiras"
      hint="Lista de bandeiras da conta ativa. O cadastro e feito em pagina dedicada."
    >
      {!tenantId ? <div className={"rounded-lg border border-dashed border-slate-300 p-2.5 text-xs opacity-75"}>Selecione uma conta ativa para gerenciar bandeiras.</div> : null}

      <div className={"flex flex-wrap gap-2"}>
        <Link href="/banners/new" className={"inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2.5 text-[13px] text-white no-underline"}>
          Criar Bandeira
        </Link>
        <BulkCreateControl onImport={onBulkCreate} disabled={!tenantId || networks.length === 0} />
      </div>

      <div className={"grid gap-1.5"}>
        {banners.length === 0 ? (
          <div className={"rounded-lg border border-dashed border-slate-300 p-2.5 text-xs opacity-75"}>Nenhuma bandeira cadastrada.</div>
        ) : (
          banners.map((banner) => (
            <article key={banner.id} className={"grid gap-1.5 rounded-lg border border-slate-200 bg-white p-2"}>
              {resolveBannerThumb(banner) ? (
                <img
                  src={resolveBannerThumb(banner)}
                  alt={`Logo ${banner.name}`}
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
              <div className={"flex items-center justify-between gap-2"}>
                <strong>{banner.name}</strong>
                <div className={"flex flex-wrap gap-1.5"}>
                  {banner.code ? <span className={"rounded-full border border-slate-300 px-2 py-0.5 text-[11px]"}>{banner.code}</span> : null}
                  <span className={"rounded-full border border-slate-300 px-2 py-0.5 text-[11px]"}>
                    {labelById(RETAIL_BANNER_NETWORK_TYPES, banner.network_type)}
                  </span>
                  <span className={"rounded-full border border-slate-300 px-2 py-0.5 text-[11px]"}>
                    {labelById(RETAIL_BANNER_NETWORK_CHANNELS, banner.network_channel)}
                  </span>
                </div>
              </div>
              <small>Rede: {networkName[String(banner.network_id)] || "N/A"}</small>
              {banner.description ? <small>{banner.description}</small> : null}
              <div className={"flex flex-wrap gap-2"}>
                <Link href={`/banners/${banner.id}/edit`} className={"inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2.5 text-[13px] text-white no-underline"}>
                  Editar
                </Link>
                <button
                  type="button"
                  className={`${"cursor-pointer rounded-md border-0 bg-slate-800 px-2.5 py-2 text-xs text-white"} ${"bg-red-700"}`}
                  onClick={() => onDelete(banner.id)}
                >
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

