"use client";

import Link from "next/link";
import BulkCreateControl from "./bulk-create-control";
import SectionCard from "./section-card";

function resolveBannerLogo(banner) {
  return (
    banner?.logo?.thumb_url ||
    banner?.logo?.display_url ||
    banner?.logo?.image_url ||
    banner?.logo_url ||
    null
  );
}

function resolveStoreFacade(store) {
  return (
    store?.facade?.thumb_url ||
    store?.facade?.display_url ||
    store?.facade?.image_url ||
    store?.facade_url ||
    null
  );
}

function resolveStoreBrandLogo(store, linkedBanner) {
  if (store.kind === "COMPETITOR") {
    return (
      store?.competitor_banner_logo?.thumb_url ||
      store?.competitor_banner_logo?.display_url ||
      store?.competitor_banner_logo?.image_url ||
      store?.competitor_banner_logo_url ||
      resolveBannerLogo(linkedBanner)
    );
  }
  return resolveBannerLogo(linkedBanner);
}

export default function StoreSection({
  tenantId,
  networks,
  banners,
  stores,
  onDelete,
  onBulkCreateOwn = () => ({ total: 0, success: 0, failed: 0, errors: [] }),
  onBulkCreateCompetitor = () => ({ total: 0, success: 0, failed: 0, errors: [] })
}) {
  const networkName = Object.fromEntries(networks.map((item) => [String(item.id), item.name]));
  const bannerMap = Object.fromEntries(banners.map((item) => [String(item.id), item]));
  const bannerName = Object.fromEntries(banners.map((item) => [String(item.id), item.name]));

  return (
    <SectionCard
      title="LOJAS"
      sectionId="lojas"
      hint="Lista de lojas da conta ativa. O cadastro e feito em pagina dedicada."
    >
      {!tenantId ? <div className={"rounded-lg border border-dashed border-slate-300 p-2.5 text-xs opacity-75"}>Selecione uma conta ativa para gerenciar lojas.</div> : null}

      <div className={"flex flex-wrap gap-2"}>
        <Link href="/stores/new" className={"inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2.5 text-[13px] text-white no-underline"}>
          Criar Loja Propria
        </Link>
        <Link href="/stores/competitors/new" className={"inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2.5 text-[13px] text-white no-underline"}>
          Criar Loja Concorrente
        </Link>
        <BulkCreateControl
          onImport={onBulkCreateOwn}
          label="Lote lojas proprias"
          disabled={!tenantId || networks.length === 0}
        />
        <BulkCreateControl
          onImport={onBulkCreateCompetitor}
          label="Lote lojas concorrentes"
          disabled={!tenantId || networks.length === 0}
        />
      </div>

      <div className={"grid gap-1.5"}>
        {stores.length === 0 ? (
          <div className={"rounded-lg border border-dashed border-slate-300 p-2.5 text-xs opacity-75"}>Nenhuma loja cadastrada.</div>
        ) : (
          stores.map((store) => {
            const linkedBanner = bannerMap[String(store.banner_id)] || null;
            const storeLogo = resolveStoreBrandLogo(store, linkedBanner);
            const storeBannerName =
              store.kind === "COMPETITOR"
                ? store.competitor_banner_name || bannerName[String(store.banner_id)] || "N/A"
                : bannerName[String(store.banner_id)] || "N/A";
            const facadeThumb = resolveStoreFacade(store);

            return (
              <article key={store.id} className={"grid gap-1.5 rounded-lg border border-slate-200 bg-white p-2"}>
                <div className={"flex flex-wrap gap-2"}>
                  {storeLogo ? (
                    <img
                      src={storeLogo}
                      alt={`Logo ${linkedBanner?.name || "bandeira"}`}
                      style={{
                        width: 44,
                        height: 44,
                        objectFit: "contain",
                        border: "1px solid #e5e7eb",
                        borderRadius: 6,
                        background: "#fff",
                        padding: 3
                      }}
                    />
                  ) : null}
                  {facadeThumb ? (
                    <img
                      src={facadeThumb}
                      alt={`Fachada ${store.name}`}
                      style={{
                        width: 66,
                        height: 44,
                        objectFit: "cover",
                        border: "1px solid #e5e7eb",
                        borderRadius: 6,
                        background: "#fff"
                      }}
                    />
                  ) : null}
                </div>

                <div className={"flex items-center justify-between gap-2"}>
                  <strong>{store.name}</strong>
                  <div className={"flex flex-wrap gap-1.5"}>
                    <span className={"rounded-full border border-slate-300 px-2 py-0.5 text-[11px]"}>{store.kind}</span>
                    {store.internal_code || store.code ? (
                      <span className={"rounded-full border border-slate-300 px-2 py-0.5 text-[11px]"}>IC: {store.internal_code || store.code}</span>
                    ) : null}
                    {store.kind !== "COMPETITOR" && store.store_number ? (
                      <span className={"rounded-full border border-slate-300 px-2 py-0.5 text-[11px]"}>N: {store.store_number}</span>
                    ) : null}
                    {store.short_name ? <span className={"rounded-full border border-slate-300 px-2 py-0.5 text-[11px]"}>{store.short_name}</span> : null}
                  </div>
                </div>

                <small>
                  Rede: {networkName[String(store.network_id)] || "N/A"} | Bandeira: {storeBannerName}
                </small>
                <small>
                  {store.address?.city || store.address_city || "-"} / {store.address?.state || store.address_state || "-"}
                </small>

                <div className={"flex flex-wrap gap-2"}>
                  <Link href={`/stores/${store.id}/edit`} className={"inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2.5 text-[13px] text-white no-underline"}>
                    Editar
                  </Link>
                  <button
                    type="button"
                    className={`${"cursor-pointer rounded-md border-0 bg-slate-800 px-2.5 py-2 text-xs text-white"} ${"bg-red-700"}`}
                    onClick={() => onDelete(store.id)}
                  >
                    Remover
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </SectionCard>
  );
}

