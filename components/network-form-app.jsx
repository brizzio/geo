"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import AddressFieldset from "./forms/address-fieldset";
import { useDomainActions } from "../features/domain/hooks/use-domain-actions";
import { useAddressLookup } from "../features/domain/hooks/use-address-lookup";
import { formatLatlon, parseLatlonText } from "../features/domain/utils/latlon";
import {
  NETWORK_SECTORS,
  NETWORK_SEGMENTS
} from "../features/domain/models/network-model";
import { useDomainState } from "../features/domain/state/domain-state";
import {
  selectActiveTenantId,
  selectNetworkById,
  selectTenants
} from "../features/domain/state/selectors";

const INITIAL_FORM = {
  id: "",
  created_at: null,
  tenant_id: "",
  name: "",
  description: "",
  sector: NETWORK_SECTORS[0]?.id || "",
  segment: NETWORK_SEGMENTS[0]?.id || "",
  headquarter: {
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
    }
  }
};

const PRIMARY_BUTTON_CLASS =
  "cursor-pointer rounded-md border-0 bg-slate-800 px-2.5 py-2 text-xs text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60";

function createFormWithActiveTenant(activeTenantId = "") {
  return {
    ...INITIAL_FORM,
    tenant_id: activeTenantId || "",
    headquarter: {
      address: { ...INITIAL_FORM.headquarter.address },
      geo: { ...INITIAL_FORM.headquarter.geo }
    }
  };
}

function toFormFromNetwork(network) {
  const lat = Number.parseFloat(network?.headquarter?.geo?.latlon?.[0]);
  const lon = Number.parseFloat(network?.headquarter?.geo?.latlon?.[1]);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lon);

  return {
    ...createFormWithActiveTenant(),
    id: String(network.id),
    created_at: network.created_at || null,
    tenant_id: String(network.tenant_id || ""),
    name: network.name || "",
    description: network.description || "",
    sector: network.sector || NETWORK_SECTORS[0]?.id || "",
    segment: network.segment || NETWORK_SEGMENTS[0]?.id || "",
    headquarter: {
      address: {
        ...INITIAL_FORM.headquarter.address,
        ...(network.headquarter?.address || {})
      },
      geo: {
        latlon: hasCoords ? [lat, lon] : null,
        source: network.headquarter?.geo?.source || null
      }
    }
  };
}

function NetworkFormRuntime({ mode = "create", networkId = null }) {
  const router = useRouter();
  const { state, hydrationDone } = useDomainState();
  const { saveNetwork } = useDomainActions();
  const isEdit = mode === "edit";
  const currentNetworkId = networkId ? String(networkId) : null;
  const tenants = useMemo(() => selectTenants(state), [state]);
  const activeTenantId = useMemo(() => selectActiveTenantId(state), [state]);
  const networkToEdit = useMemo(() => {
    if (!isEdit || !currentNetworkId) {
      return null;
    }
    return selectNetworkById(state, currentNetworkId);
  }, [state, isEdit, currentNetworkId]);
  const [form, setForm] = useState(() => createFormWithActiveTenant(activeTenantId));
  const [bootstrapped, setBootstrapped] = useState(!isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
        tenant_id: activeTenantId || ""
      };
    });
  }, [activeTenantId, isEdit]);

  useEffect(() => {
    if (!isEdit || !networkToEdit) {
      return;
    }

    setForm(toFormFromNetwork(networkToEdit));
    setBootstrapped(true);
  }, [isEdit, networkToEdit]);

  const latlonValue = useMemo(
    () => formatLatlon(form.headquarter?.geo?.latlon),
    [form.headquarter?.geo?.latlon]
  );

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateHqAddress(field, value) {
    resetAddressLookup();
    setForm((prev) => ({
      ...prev,
      headquarter: {
        ...prev.headquarter,
        address: {
          ...prev.headquarter.address,
          [field]: value
        }
      }
    }));
  }

  function applyResolvedHeadquarter(resolved) {
    if (!resolved) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      headquarter: {
        address: {
          ...prev.headquarter.address,
          ...resolved.address
        },
        geo: resolved.geo
      }
    }));
  }

  function handleLatlonCommit(value) {
    try {
      const parsed = parseLatlonText(value);
      setForm((prev) => ({
        ...prev,
        headquarter: {
          ...prev.headquarter,
          geo: {
            ...prev.headquarter.geo,
            latlon: parsed,
            source: parsed ? "manual" : prev.headquarter.geo?.source || null
          }
        }
      }));
      setError("");
    } catch (err) {
      if (!String(value || "").trim()) {
        setForm((prev) => ({
          ...prev,
          headquarter: {
            ...prev.headquarter,
            geo: {
              ...prev.headquarter.geo,
              latlon: null
            }
          }
        }));
        setError("");
        return;
      }
      setError(err?.message || "Latitude/longitude invalidas.");
    }
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
      street: form.headquarter.address.street,
      street_number: form.headquarter.address.street_number,
      city: form.headquarter.address.city,
      state: form.headquarter.address.state,
      country: form.headquarter.address.country
    }),
    applyResolvedAddress: applyResolvedHeadquarter,
    countryCode: "br"
  });

  useEffect(() => {
    if (!isEdit || !networkToEdit) {
      return;
    }
    setSearchValue(networkToEdit?.headquarter?.address?.display_name || "");
  }, [isEdit, networkToEdit, setSearchValue]);

  async function resolveHeadquarter({ throwOnError = false } = {}) {
    setError("");
    try {
      return await resolveAddressLookup({ throwOnError: true });
    } catch (err) {
      setError(err?.message || "Falha ao consultar endereco administrativo.");
      if (throwOnError) {
        throw err;
      }
      return null;
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (isEdit && !networkToEdit) {
        throw new Error("Rede nao encontrada para edicao.");
      }

      let payload = form;
      if (!payload.headquarter?.geo?.latlon) {
        const resolved = await resolveHeadquarter({ throwOnError: true });
        payload = {
          ...payload,
          headquarter: {
            address: {
              ...payload.headquarter.address,
              ...resolved.address
            },
            geo: resolved.geo
          }
        };
      }

      saveNetwork(payload);
      router.push("/");
    } catch (err) {
      setError(err?.message || "Falha ao salvar rede.");
    } finally {
      setSaving(false);
    }
  }

  if (isEdit && !hydrationDone) {
    return (
      <main className={"min-h-screen p-6 text-slate-900 bg-[radial-gradient(circle_at_12%_10%,rgba(255,208,82,0.18),transparent_32%),radial-gradient(circle_at_85%_90%,rgba(37,99,235,0.16),transparent_40%),linear-gradient(180deg,#f7f7f8_0%,#f0f2f5_100%)]"}>
        <div className={"mx-auto grid max-w-[1440px] gap-4"}>
          <section className={"grid gap-2.5 rounded-xl border border-slate-900/10 bg-white/90 p-[14px]"}>
            <h2 className={"m-0 text-lg"}>Carregando rede...</h2>
          </section>
        </div>
      </main>
    );
  }

  if (isEdit && hydrationDone && !networkToEdit) {
    return (
      <main className={"min-h-screen p-6 text-slate-900 bg-[radial-gradient(circle_at_12%_10%,rgba(255,208,82,0.18),transparent_32%),radial-gradient(circle_at_85%_90%,rgba(37,99,235,0.16),transparent_40%),linear-gradient(180deg,#f7f7f8_0%,#f0f2f5_100%)]"}>
        <div className={"mx-auto grid max-w-[1440px] gap-4"}>
          <section className={"grid gap-2.5 rounded-xl border border-slate-900/10 bg-white/90 p-[14px]"}>
            <h2 className={"m-0 text-lg"}>Rede nao encontrada</h2>
            <p className={"m-0 text-xs opacity-70"}>
              A rede informada nao existe no tenant ativo ou foi removida.
            </p>
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
            <h1 className={"m-0 text-[30px] tracking-[0.5px]"}>{isEdit ? "Editar Rede" : "Criar Rede"}</h1>
            <p className={"mb-0 mt-1 text-sm [opacity:0.85]"}>
              {isEdit
                ? "Atualize setor, segmento e endereco administrativo (headquarter)."
                : "Defina setor, segmento e endereco administrativo (headquarter)."}
            </p>
          </div>
          <div className={"flex flex-wrap items-center gap-2"}>
            <Link href="/dashboard" className={"inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2.5 text-[13px] text-white no-underline"}>
              Voltar ao dashboard
            </Link>
          </div>
        </header>

        <section className={"grid gap-2.5 rounded-xl border border-slate-900/10 bg-white/90 p-[14px]"}>
          <h2 className={"m-0 text-lg"}>Formulario de Rede</h2>
          <form onSubmit={handleSubmit} className={"grid gap-2"}>
            <div className={"grid grid-cols-3 gap-2 max-[980px]:grid-cols-1"}>
              <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>Conta</span>
                <select
                  value={form.tenant_id}
                  onChange={(e) => update("tenant_id", e.target.value)}
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
                <span>Setor</span>
                <select
                  value={form.sector}
                  onChange={(e) => update("sector", e.target.value)}
                  required
                >
                  {NETWORK_SECTORS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>Segmento</span>
                <select
                  value={form.segment}
                  onChange={(e) => update("segment", e.target.value)}
                  required
                >
                  {NETWORK_SEGMENTS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {isEdit ? (
              <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>ID da rede</span>
                <input value={form.id} readOnly />
              </label>
            ) : null}

            <div className={"grid grid-cols-2 gap-2 max-[980px]:grid-cols-1"}>
              <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>Nome da rede</span>
                <input
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Ex: Rede Sul"
                  required
                />
              </label>
              <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>Descricao</span>
                <input
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="Opcional"
                />
              </label>
            </div>

            <AddressFieldset
              address={form.headquarter.address}
              onAddressChange={updateHqAddress}
              searchValue={addressSearch}
              onSearchValueChange={setSearchValue}
              onSearch={() => resolveHeadquarter()}
              searching={resolvingAddress}
              searchLabel="Endereco administrativo (busca)"
              options={addressOptions}
              selectedOption={selectedAddressOption}
              onSelectedOptionChange={selectAddressOption}
              latlonValue={latlonValue}
              onLatlonCommit={handleLatlonCommit}
              latlonTitle="Latitude / Longitude do headquarter"
            />

            {error ? <p className={"m-0 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-800"}>{error}</p> : null}

            <div className={"flex flex-wrap gap-2"}>
              <button type="submit" className={PRIMARY_BUTTON_CLASS} disabled={saving}>
                {saving ? "Salvando..." : isEdit ? "Salvar alteracoes" : "Criar rede"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

export default function NetworkFormApp({ mode = "create", networkId = null }) {
  return <NetworkFormRuntime mode={mode} networkId={networkId} />;
}


