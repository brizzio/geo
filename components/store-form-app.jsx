"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import AddressFieldset from "./forms/address-fieldset";
import { useDomainActions } from "../features/domain/hooks/use-domain-actions";
import { useAddressLookup } from "../features/domain/hooks/use-address-lookup";
import { formatLatlon, parseLatlonText } from "../features/domain/utils/latlon";
import { STORE_KINDS } from "../features/domain/models";
import { uploadImageToImgbb } from "../features/domain/services/imgbb-upload";
import { useDomainState } from "../features/domain/state/domain-state";
import {
  selectActiveTenantId,
  selectBannerById,
  selectBannersByNetwork,
  selectNetworksByTenant,
  selectStoreById,
  selectTenants
} from "../features/domain/state/selectors";

const INITIAL_FORM = {
  id: "",
  created_at: null,
  tenant_id: "",
  network_id: "",
  banner_id: "",
  kind: STORE_KINDS.OWN,
  internal_code: "",
  short_name: "",
  store_number: "",
  competitor_banner_name: "",
  competitor_banner_logo_url: "",
  competitor_banner_logo: null,
  name: "",
  address: {
    street: "",
    street_number: "",
    neighbourhood: "",
    city: "",
    state: "",
    postcode: "",
    country: "Brasil",
    display_name: ""
  },
  geo: {
    latlon: null,
    source: null
  },
  facade_url: "",
  facade: null
};

const PRIMARY_BUTTON_CLASS =
  "cursor-pointer rounded-md border-0 bg-slate-800 px-2.5 py-2 text-xs text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60";
const SECONDARY_BUTTON_CLASS =
  "cursor-pointer rounded-md border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60";

function normalizeStoreKind(kind) {
  return kind === STORE_KINDS.COMPETITOR ? STORE_KINDS.COMPETITOR : STORE_KINDS.OWN;
}

function createForm(activeTenantId = "", defaultKind = STORE_KINDS.OWN) {
  return {
    ...INITIAL_FORM,
    tenant_id: activeTenantId || "",
    kind: normalizeStoreKind(defaultKind),
    address: {
      ...INITIAL_FORM.address
    },
    geo: {
      ...INITIAL_FORM.geo
    }
  };
}

function toFormFromStore(store) {
  const competitorBannerLogo =
    store.competitor_banner_logo && typeof store.competitor_banner_logo === "object"
      ? {
          provider: store.competitor_banner_logo.provider || null,
          id: store.competitor_banner_logo.id || null,
          image_url:
            store.competitor_banner_logo.image_url || store.competitor_banner_logo_url || null,
          display_url:
            store.competitor_banner_logo.display_url ||
            store.competitor_banner_logo.image_url ||
            store.competitor_banner_logo_url ||
            null,
          thumb_url: store.competitor_banner_logo.thumb_url || null,
          medium_url: store.competitor_banner_logo.medium_url || null,
          delete_url: store.competitor_banner_logo.delete_url || null
        }
      : store.competitor_banner_logo_url
        ? {
            provider: null,
            id: null,
            image_url: store.competitor_banner_logo_url,
            display_url: store.competitor_banner_logo_url,
            thumb_url: null,
            medium_url: null,
            delete_url: null
          }
        : null;

  const facade =
    store.facade && typeof store.facade === "object"
      ? {
          provider: store.facade.provider || null,
          id: store.facade.id || null,
          image_url: store.facade.image_url || store.facade_url || null,
          display_url:
            store.facade.display_url || store.facade.image_url || store.facade_url || null,
          thumb_url: store.facade.thumb_url || null,
          medium_url: store.facade.medium_url || null,
          delete_url: store.facade.delete_url || null
        }
      : store.facade_url
        ? {
            provider: null,
            id: null,
            image_url: store.facade_url,
            display_url: store.facade_url,
            thumb_url: null,
            medium_url: null,
            delete_url: null
          }
        : null;

  const rawAddress = store.address && typeof store.address === "object" ? store.address : {};
  const lat = Number.parseFloat(store?.geo?.latlon?.[0]);
  const lon = Number.parseFloat(store?.geo?.latlon?.[1]);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lon);

  return {
    ...createForm(),
    id: String(store.id),
    created_at: store.created_at || null,
    tenant_id: String(store.tenant_id || ""),
    network_id: String(store.network_id || ""),
    banner_id: String(store.banner_id || ""),
    kind: store.kind === STORE_KINDS.COMPETITOR ? STORE_KINDS.COMPETITOR : STORE_KINDS.OWN,
    internal_code: store.internal_code || store.code || "",
    short_name: store.short_name || "",
    store_number: store.store_number || "",
    competitor_banner_name: store.competitor_banner_name || "",
    competitor_banner_logo_url:
      competitorBannerLogo?.image_url || store.competitor_banner_logo_url || "",
    competitor_banner_logo: competitorBannerLogo,
    name: store.name || "",
    address: {
      street: rawAddress.street || "",
      street_number: rawAddress.street_number || "",
      neighbourhood: rawAddress.neighbourhood || "",
      city: rawAddress.city || store.address_city || "",
      state: rawAddress.state || store.address_state || "",
      postcode: rawAddress.postcode || "",
      country: rawAddress.country || "Brasil",
      display_name: rawAddress.display_name || ""
    },
    geo: {
      latlon: hasCoords ? [lat, lon] : null,
      source: store?.geo?.source || null
    },
    facade_url: facade?.image_url || store.facade_url || "",
    facade
  };
}

function resolveBannerLogo(banner) {
  return (
    banner?.logo?.thumb_url ||
    banner?.logo?.display_url ||
    banner?.logo?.image_url ||
    banner?.logo_url ||
    null
  );
}

function StoreFormRuntime({
  mode = "create",
  storeId = null,
  defaultKind = STORE_KINDS.OWN,
  lockKind = false
}) {
  const isEdit = mode === "edit";
  const preferredKind = normalizeStoreKind(defaultKind);
  const currentStoreId = storeId ? String(storeId) : null;
  const router = useRouter();
  const { state, hydrationDone } = useDomainState();
  const { saveStore } = useDomainActions();

  const tenants = useMemo(() => selectTenants(state), [state]);
  const activeTenantId = useMemo(() => selectActiveTenantId(state), [state]);
  const storeToEdit = useMemo(() => {
    if (!isEdit || !currentStoreId) {
      return null;
    }
    return selectStoreById(state, currentStoreId);
  }, [state, isEdit, currentStoreId]);

  const [form, setForm] = useState(() => createForm(activeTenantId, preferredKind));
  const [bootstrapped, setBootstrapped] = useState(!isEdit);
  const [uploadingFacade, setUploadingFacade] = useState(false);
  const [uploadingCompetitorLogo, setUploadingCompetitorLogo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const networkOptions = useMemo(() => {
    if (!form.tenant_id) {
      return [];
    }
    return selectNetworksByTenant(state, form.tenant_id);
  }, [state, form.tenant_id]);

  const bannerOptions = useMemo(() => {
    if (!form.network_id) {
      return [];
    }
    return selectBannersByNetwork(state, form.network_id);
  }, [state, form.network_id]);

  const selectedBanner = useMemo(() => selectBannerById(state, form.banner_id), [state, form.banner_id]);
  const isCompetitor = form.kind === STORE_KINDS.COMPETITOR;
  const inheritedLogoUrl = useMemo(() => resolveBannerLogo(selectedBanner), [selectedBanner]);
  const competitorBannerLogoPreviewUrl = useMemo(
    () =>
      form.competitor_banner_logo?.thumb_url ||
      form.competitor_banner_logo?.display_url ||
      form.competitor_banner_logo?.image_url ||
      form.competitor_banner_logo_url ||
      null,
    [form.competitor_banner_logo, form.competitor_banner_logo_url]
  );
  const facadePreviewUrl = useMemo(
    () => form.facade?.display_url || form.facade?.image_url || form.facade_url || null,
    [form.facade, form.facade_url]
  );

  useEffect(() => {
    if (!isCompetitor) {
      return;
    }
    if (form.competitor_banner_name || !selectedBanner?.name) {
      return;
    }
    setForm((prev) => ({
      ...prev,
      competitor_banner_name: selectedBanner.name
    }));
  }, [isCompetitor, form.competitor_banner_name, selectedBanner]);

  const latlonValue = useMemo(() => formatLatlon(form.geo?.latlon), [form.geo?.latlon]);

  useEffect(() => {
    if (isEdit) {
      return;
    }

    setForm((prev) => {
      if (prev.tenant_id) {
        return prev;
      }
      return {
        ...prev,
        tenant_id: activeTenantId || "",
        kind: lockKind ? preferredKind : prev.kind
      };
    });
  }, [activeTenantId, isEdit, lockKind, preferredKind]);

  useEffect(() => {
    if (isEdit || !lockKind) {
      return;
    }

    setForm((prev) => {
      if (prev.kind === preferredKind) {
        return prev;
      }

      return {
        ...prev,
        kind: preferredKind
      };
    });
  }, [isEdit, lockKind, preferredKind]);

  useEffect(() => {
    if (!isEdit || !storeToEdit) {
      return;
    }
    setForm(toFormFromStore(storeToEdit));
    setBootstrapped(true);
  }, [isEdit, storeToEdit]);

  function update(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value
    }));
  }

  function updateKind(nextKind) {
    const normalized = normalizeStoreKind(nextKind);
    setForm((prev) => {
      if (normalized === STORE_KINDS.COMPETITOR) {
        return {
          ...prev,
          kind: normalized,
          banner_id: "",
          store_number: ""
        };
      }

      return {
        ...prev,
        kind: STORE_KINDS.OWN,
        competitor_banner_name: "",
        competitor_banner_logo_url: "",
        competitor_banner_logo: null
      };
    });
  }

  function updateAddress(field, value) {
    resetAddressLookup();
    setForm((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }));
  }

  function applyResolvedAddress(resolved) {
    if (!resolved) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        ...resolved.address
      },
      geo: resolved.geo
    }));
  }

  function handleLatlonCommit(value) {
    try {
      const parsed = parseLatlonText(value);
      setForm((prev) => ({
        ...prev,
        geo: {
          ...prev.geo,
          latlon: parsed,
          source: parsed ? "manual" : prev.geo?.source || null
        }
      }));
      setError("");
    } catch (err) {
      if (!String(value || "").trim()) {
        setForm((prev) => ({
          ...prev,
          geo: {
            ...prev.geo,
            latlon: null
          }
        }));
        setError("");
        return;
      }
      setError(err?.message || "Latitude/longitude invalidas.");
    }
  }

  function updateTenant(tenantId) {
    setForm((prev) => ({
      ...prev,
      tenant_id: tenantId,
      network_id: tenantId === prev.tenant_id ? prev.network_id : "",
      banner_id: tenantId === prev.tenant_id ? prev.banner_id : ""
    }));
  }

  function updateNetwork(networkId) {
    setForm((prev) => ({
      ...prev,
      network_id: networkId,
      banner_id: networkId === prev.network_id ? prev.banner_id : ""
    }));
  }

  const {
    searchValue: addressSearch,
    setSearchValue,
    resolving: resolvingAddress,
    addressOptions,
    selectedAddressOption,
    resetAddressLookup,
    selectAddressOption,
    resolveAddress: resolveAddressLookup
  } = useAddressLookup({
    getAddressInput: () => ({
      street: form.address.street,
      street_number: form.address.street_number,
      city: form.address.city,
      state: form.address.state,
      country: form.address.country
    }),
    applyResolvedAddress,
    countryCode: "br"
  });

  useEffect(() => {
    if (!isEdit || !storeToEdit) {
      return;
    }
    setSearchValue(storeToEdit?.address?.display_name || "");
  }, [isEdit, storeToEdit, setSearchValue]);

  async function resolveAddress({ throwOnError = false } = {}) {
    setError("");

    try {
      return await resolveAddressLookup({ throwOnError: true });
    } catch (err) {
      setError(err?.message || "Falha ao consultar endereco.");
      if (throwOnError) {
        throw err;
      }
      return null;
    }
  }

  async function handleFacadeUpload(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setError("");
    setUploadingFacade(true);

    try {
      const result = await uploadImageToImgbb(file, {
        name: `${Date.now()}-${file.name}`
      });
      setForm((prev) => ({
        ...prev,
        facade_url: result.imageUrl || result.url || "",
        facade: {
          provider: "imgbb",
          id: result.id || null,
          image_url: result.imageUrl || result.url || null,
          display_url: result.displayUrl || result.imageUrl || result.url || null,
          thumb_url: result.thumbUrl || null,
          medium_url: result.mediumUrl || null,
          delete_url: result.deleteUrl || null
        }
      }));
    } catch (err) {
      setError(err?.message || "Falha ao enviar foto da fachada.");
    } finally {
      setUploadingFacade(false);
      event.target.value = "";
    }
  }

  async function handleCompetitorBannerLogoUpload(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setError("");
    setUploadingCompetitorLogo(true);

    try {
      const result = await uploadImageToImgbb(file, {
        name: `${Date.now()}-${file.name}`
      });
      setForm((prev) => ({
        ...prev,
        competitor_banner_logo_url: result.imageUrl || result.url || "",
        competitor_banner_logo: {
          provider: "imgbb",
          id: result.id || null,
          image_url: result.imageUrl || result.url || null,
          display_url: result.displayUrl || result.imageUrl || result.url || null,
          thumb_url: result.thumbUrl || null,
          medium_url: result.mediumUrl || null,
          delete_url: result.deleteUrl || null
        }
      }));
    } catch (err) {
      setError(err?.message || "Falha ao enviar logo da bandeira concorrente.");
    } finally {
      setUploadingCompetitorLogo(false);
      event.target.value = "";
    }
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      if (isEdit && !storeToEdit) {
        throw new Error("Loja nao encontrada para edicao.");
      }

      let payload = form;
      if (!form.geo?.latlon) {
        const resolved = await resolveAddress({ throwOnError: true });
        payload = {
          ...form,
          address: {
            ...form.address,
            ...resolved.address
          },
          geo: resolved.geo
        };
      }

      saveStore(payload);
      router.push("/");
    } catch (err) {
      setError(err?.message || "Falha ao salvar loja.");
    } finally {
      setSaving(false);
    }
  }

  if (isEdit && !hydrationDone) {
    return (
      <main className={"min-h-screen p-6 text-slate-900 bg-[radial-gradient(circle_at_12%_10%,rgba(255,208,82,0.18),transparent_32%),radial-gradient(circle_at_85%_90%,rgba(37,99,235,0.16),transparent_40%),linear-gradient(180deg,#f7f7f8_0%,#f0f2f5_100%)]"}>
        <div className={"mx-auto grid max-w-[1440px] gap-4"}>
          <section className={"grid gap-2.5 rounded-xl border border-slate-900/10 bg-white/90 p-[14px]"}>
            <h2 className={"m-0 text-lg"}>Carregando loja...</h2>
          </section>
        </div>
      </main>
    );
  }

  if (isEdit && hydrationDone && !storeToEdit) {
    return (
      <main className={"min-h-screen p-6 text-slate-900 bg-[radial-gradient(circle_at_12%_10%,rgba(255,208,82,0.18),transparent_32%),radial-gradient(circle_at_85%_90%,rgba(37,99,235,0.16),transparent_40%),linear-gradient(180deg,#f7f7f8_0%,#f0f2f5_100%)]"}>
        <div className={"mx-auto grid max-w-[1440px] gap-4"}>
          <section className={"grid gap-2.5 rounded-xl border border-slate-900/10 bg-white/90 p-[14px]"}>
            <h2 className={"m-0 text-lg"}>Loja nao encontrada</h2>
            <p className={"m-0 text-xs opacity-70"}>A loja foi removida ou o ID informado e invalido.</p>
            <div className={"flex flex-wrap gap-2"}>
              <Link href="/dashboard" className={"inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2.5 text-[13px] text-white no-underline"}>
                Voltar ao dashboard
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (isEdit && !bootstrapped) {
    return (
      <main className={"min-h-screen p-6 text-slate-900 bg-[radial-gradient(circle_at_12%_10%,rgba(255,208,82,0.18),transparent_32%),radial-gradient(circle_at_85%_90%,rgba(37,99,235,0.16),transparent_40%),linear-gradient(180deg,#f7f7f8_0%,#f0f2f5_100%)]"}>
        <div className={"mx-auto grid max-w-[1440px] gap-4"}>
          <section className={"grid gap-2.5 rounded-xl border border-slate-900/10 bg-white/90 p-[14px]"}>
            <h2 className={"m-0 text-lg"}>Preparando formulario...</h2>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className={"min-h-screen p-6 text-slate-900 bg-[radial-gradient(circle_at_12%_10%,rgba(255,208,82,0.18),transparent_32%),radial-gradient(circle_at_85%_90%,rgba(37,99,235,0.16),transparent_40%),linear-gradient(180deg,#f7f7f8_0%,#f0f2f5_100%)]"}>
      <div className={"mx-auto grid max-w-[1440px] gap-4"}>
        <header className={"flex items-center justify-between gap-4 rounded-[14px] bg-white/[0.85] px-5 py-[18px] shadow-[0_10px_20px_rgba(15,23,42,0.08)]"}>
          <div>
            <h1 className={"m-0 text-[30px] tracking-[0.5px]"}>
              {isEdit
                ? "Editar Loja"
                : preferredKind === STORE_KINDS.COMPETITOR
                  ? "Criar Loja Concorrente"
                  : "Criar Loja"}
            </h1>
            <p className={"mb-0 mt-1 text-sm [opacity:0.85]"}>
              {isCompetitor
                ? "Loja concorrente exige bandeira propria (nome + logo) e pode ter fachada opcional."
                : "Loja propria herda logo da bandeira e pode ter foto de fachada opcional."}
            </p>
          </div>
          <div className={"flex flex-wrap items-center gap-2"}>
            <Link href="/dashboard" className={"inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2.5 text-[13px] text-white no-underline"}>
              Voltar ao dashboard
            </Link>
          </div>
        </header>

        <section className={"grid gap-2.5 rounded-xl border border-slate-900/10 bg-white/90 p-[14px]"}>
          <h2 className={"m-0 text-lg"}>Formulario de Loja</h2>
          <form onSubmit={submit} className={"grid gap-2"}>
            <div className={"grid grid-cols-3 gap-2 max-[980px]:grid-cols-1"}>
              <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>Conta</span>
                <select
                  value={form.tenant_id}
                  onChange={(e) => updateTenant(e.target.value)}
                  disabled={isEdit}
                  required
                >
                  <option value="">Selecione...</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>Rede</span>
                <select
                  value={form.network_id}
                  onChange={(e) => updateNetwork(e.target.value)}
                  disabled={!form.tenant_id}
                  required
                >
                  <option value="">Selecione...</option>
                  {networkOptions.map((network) => (
                    <option key={network.id} value={network.id}>
                      {network.name}
                    </option>
                  ))}
                </select>
              </label>

              {isCompetitor ? (
                <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                  <span>Bandeira concorrente</span>
                  <input
                    value={form.competitor_banner_name || ""}
                    onChange={(e) => update("competitor_banner_name", e.target.value)}
                    placeholder="Ex: Carrefour"
                    required
                  />
                </label>
              ) : (
                <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                  <span>Bandeira</span>
                  <select
                    value={form.banner_id}
                    onChange={(e) => update("banner_id", e.target.value)}
                    disabled={!form.network_id}
                    required
                  >
                    <option value="">Selecione...</option>
                    {bannerOptions.map((banner) => (
                      <option key={banner.id} value={banner.id}>
                        {banner.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            {isEdit ? (
              <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>ID da loja</span>
                <input value={form.id} readOnly />
              </label>
            ) : null}

            <div className={"grid grid-cols-3 gap-2 max-[980px]:grid-cols-1"}>
              <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>Tipo</span>
                <select
                  value={form.kind}
                  onChange={(e) => updateKind(e.target.value)}
                  disabled={lockKind}
                >
                  <option value={STORE_KINDS.OWN}>Propria (OWN)</option>
                  <option value={STORE_KINDS.COMPETITOR}>Concorrente (COMPETITOR)</option>
                </select>
              </label>
              <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>Codigo interno</span>
                <input
                  value={form.internal_code}
                  onChange={(e) => update("internal_code", e.target.value)}
                  placeholder="Referencia interna"
                />
              </label>
              {isCompetitor ? (
                <div className={"grid gap-1 text-xs rounded-md border border-amber-200 bg-amber-50 p-2 text-amber-900"}>
                  <span>Bandeira da loja concorrente deve ser diferente das bandeiras da rede.</span>
                </div>
              ) : (
                <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                  <span>Numero da loja</span>
                  <input
                    value={form.store_number}
                    onChange={(e) => update("store_number", e.target.value)}
                    placeholder="Ex: 0142"
                  />
                </label>
              )}
            </div>

            <div className={"grid grid-cols-2 gap-2 max-[980px]:grid-cols-1"}>
              <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>Nome</span>
                <input
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Nome da loja"
                  required
                />
              </label>
              <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>Nome curto</span>
                <input
                  value={form.short_name}
                  onChange={(e) => update("short_name", e.target.value)}
                  placeholder="Abreviatura para relatorios"
                />
              </label>
            </div>

            <AddressFieldset
              address={form.address}
              onAddressChange={updateAddress}
              searchValue={addressSearch}
              onSearchValueChange={setSearchValue}
              onSearch={() => resolveAddress()}
              searching={resolvingAddress}
              options={addressOptions}
              selectedOption={selectedAddressOption}
              onSelectedOptionChange={selectAddressOption}
              latlonValue={latlonValue}
              onLatlonCommit={handleLatlonCommit}
              latlonTitle="Latitude / Longitude"
            />

            {isCompetitor ? (
              <div className={"grid grid-cols-2 gap-2 max-[980px]:grid-cols-1"}>
                <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                  <span>Logo da bandeira concorrente (URL)</span>
                  <input
                    value={form.competitor_banner_logo_url || ""}
                    onChange={(e) => {
                      const next = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        competitor_banner_logo_url: next,
                        competitor_banner_logo: next
                          ? {
                              provider: prev.competitor_banner_logo?.provider || null,
                              id: prev.competitor_banner_logo?.id || null,
                              image_url: next,
                              display_url: next,
                              thumb_url: prev.competitor_banner_logo?.thumb_url || null,
                              medium_url: prev.competitor_banner_logo?.medium_url || null,
                              delete_url: prev.competitor_banner_logo?.delete_url || null
                            }
                          : null
                      }));
                    }}
                    placeholder="https://..."
                  />
                </label>
                <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                  <span>Upload logo da bandeira concorrente</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCompetitorBannerLogoUpload}
                    disabled={uploadingCompetitorLogo}
                  />
                </label>
              </div>
            ) : null}

            <div className={"grid grid-cols-2 gap-2 max-[980px]:grid-cols-1"}>
              <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>Foto da fachada (URL)</span>
                <input
                  value={form.facade_url}
                  onChange={(e) => {
                    const next = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      facade_url: next,
                      facade: next
                        ? {
                            provider: prev.facade?.provider || null,
                            id: prev.facade?.id || null,
                            image_url: next,
                            display_url: next,
                            thumb_url: prev.facade?.thumb_url || null,
                            medium_url: prev.facade?.medium_url || null,
                            delete_url: prev.facade?.delete_url || null
                          }
                        : null
                    }));
                  }}
                  placeholder="https://..."
                />
              </label>
              <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>Upload fachada (opcional)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFacadeUpload}
                  disabled={uploadingFacade}
                />
              </label>
            </div>

            {(inheritedLogoUrl || competitorBannerLogoPreviewUrl || facadePreviewUrl) ? (
              <div className={"flex flex-wrap gap-2"}>
                {!isCompetitor && inheritedLogoUrl ? (
                  <div className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                    <span>Logo herdado da bandeira</span>
                    <img
                      src={inheritedLogoUrl}
                      alt="Logo da bandeira"
                      style={{
                        width: 72,
                        height: 72,
                        objectFit: "contain",
                        border: "1px solid #d1d5db",
                        borderRadius: 8,
                        background: "#fff",
                        padding: 6
                      }}
                    />
                  </div>
                ) : null}
                {isCompetitor && competitorBannerLogoPreviewUrl ? (
                  <div className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                    <span>Logo da bandeira concorrente</span>
                    <img
                      src={competitorBannerLogoPreviewUrl}
                      alt={`Logo ${form.competitor_banner_name || "concorrente"}`}
                      style={{
                        width: 72,
                        height: 72,
                        objectFit: "contain",
                        border: "1px solid #d1d5db",
                        borderRadius: 8,
                        background: "#fff",
                        padding: 6
                      }}
                    />
                  </div>
                ) : null}
                {facadePreviewUrl ? (
                  <div className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                    <span>Preview fachada</span>
                    <img
                      src={facadePreviewUrl}
                      alt="Fachada"
                      style={{
                        width: 120,
                        height: 72,
                        objectFit: "cover",
                        border: "1px solid #d1d5db",
                        borderRadius: 8,
                        background: "#fff"
                      }}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}

            {error ? <p className={"m-0 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-800"}>{error}</p> : null}
            <div className={"flex flex-wrap gap-2"}>
              {(form.competitor_banner_logo || form.competitor_banner_logo_url) ? (
                <button
                  type="button"
                  className={SECONDARY_BUTTON_CLASS}
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      competitor_banner_logo: null,
                      competitor_banner_logo_url: ""
                    }))
                  }
                >
                  Remover logo concorrente
                </button>
              ) : null}
              {(form.facade || form.facade_url) ? (
                <button
                  type="button"
                  className={SECONDARY_BUTTON_CLASS}
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      facade: null,
                      facade_url: ""
                    }))
                  }
                >
                  Remover fachada
                </button>
              ) : null}
              <button
                type="submit"
                className={PRIMARY_BUTTON_CLASS}
                disabled={saving || uploadingFacade || uploadingCompetitorLogo}
              >
                {saving ? "Salvando..." : isEdit ? "Salvar alteracoes" : "Criar loja"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

export default function StoreFormApp({
  mode = "create",
  storeId = null,
  defaultKind = STORE_KINDS.OWN,
  lockKind = false
}) {
  return (
    <StoreFormRuntime
      mode={mode}
      storeId={storeId}
      defaultKind={defaultKind}
      lockKind={lockKind}
    />
  );
}


