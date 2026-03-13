"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import AddressFieldset from "./forms/address-fieldset";
import { useAddressLookup } from "../features/domain/hooks/use-address-lookup";
import { TENANT_TYPES } from "../features/domain/models";
import { useDomainActions } from "../features/domain/hooks/use-domain-actions";
import { formatLatlon, parseLatlonText } from "../features/domain/utils/latlon";
import { useDomainState } from "../features/domain/state/domain-state";
import { selectTenantById } from "../features/domain/state/selectors";

const INITIAL_FORM = {
  id: "",
  created_at: null,
  name: "",
  person_type: TENANT_TYPES.COMPANY,
  document: "",
  logo_base64: null,
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
};

const PRIMARY_BUTTON_CLASS =
  "cursor-pointer rounded-md border-0 bg-slate-800 px-2.5 py-2 text-xs text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60";

function createEmptyForm() {
  return {
    ...INITIAL_FORM,
    address: { ...INITIAL_FORM.address },
    geo: { ...INITIAL_FORM.geo }
  };
}

function toFormFromTenant(tenant) {
  const lat = Number.parseFloat(tenant?.geo?.latlon?.[0]);
  const lon = Number.parseFloat(tenant?.geo?.latlon?.[1]);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lon);

  return {
    ...createEmptyForm(),
    id: String(tenant?.id || ""),
    created_at: tenant?.created_at || null,
    name: tenant?.name || "",
    person_type:
      tenant?.person_type === TENANT_TYPES.INDIVIDUAL ? TENANT_TYPES.INDIVIDUAL : TENANT_TYPES.COMPANY,
    document: tenant?.document || "",
    logo_base64: typeof tenant?.logo_base64 === "string" ? tenant.logo_base64 : null,
    address: {
      ...INITIAL_FORM.address,
      ...(tenant?.address || {})
    },
    geo: {
      latlon: hasCoords ? [lat, lon] : null,
      source: tenant?.geo?.source || null
    }
  };
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Falha ao ler arquivo de imagem."));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataURL) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Falha ao processar imagem."));
    image.src = dataURL;
  });
}

async function optimizeLogo(file) {
  const original = await readFileAsDataURL(file);
  if (!original) {
    return null;
  }

  const image = await loadImage(original);
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  const maxEdge = 320;
  const scale = Math.min(1, maxEdge / Math.max(width || 1, height || 1));
  const nextWidth = Math.max(1, Math.round(width * scale));
  const nextHeight = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = nextWidth;
  canvas.height = nextHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return original;
  }

  ctx.drawImage(image, 0, 0, nextWidth, nextHeight);
  return canvas.toDataURL("image/webp", 0.85);
}

function AccountFormRuntime({ mode = "create", accountId = null }) {
  const router = useRouter();
  const { state, hydrationDone } = useDomainState();
  const { saveTenant, setActiveTenant } = useDomainActions();
  const isEdit = mode === "edit";
  const currentAccountId = accountId ? String(accountId) : null;
  const tenantToEdit = useMemo(() => {
    if (!isEdit || !currentAccountId) {
      return null;
    }
    return selectTenantById(state, currentAccountId);
  }, [state, isEdit, currentAccountId]);
  const [form, setForm] = useState(() => createEmptyForm());
  const [bootstrapped, setBootstrapped] = useState(!isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEdit || !tenantToEdit) {
      return;
    }

    setForm(toFormFromTenant(tenantToEdit));
    setBootstrapped(true);
  }, [isEdit, tenantToEdit]);

  const logoPreview = useMemo(() => form.logo_base64 || null, [form.logo_base64]);
  const latlonValue = useMemo(() => formatLatlon(form.geo?.latlon), [form.geo?.latlon]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
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
    if (!isEdit || !tenantToEdit) {
      return;
    }
    setSearchValue(tenantToEdit?.address?.display_name || "");
  }, [isEdit, tenantToEdit, setSearchValue]);

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

  async function handleLogoChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setError("");
    try {
      const logo = await optimizeLogo(file);
      setForm((prev) => ({
        ...prev,
        logo_base64: logo
      }));
    } catch (_error) {
      setError("Falha ao ler logo.");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (isEdit && !tenantToEdit) {
        throw new Error("Conta nao encontrada para edicao.");
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

      const saved = saveTenant(payload);
      setActiveTenant(saved.id);
      router.push("/accounts");
    } catch (err) {
      setError(err?.message || "Falha ao salvar conta.");
    } finally {
      setSaving(false);
    }
  }

  if (isEdit && !hydrationDone) {
    return (
      <main className={"min-h-screen p-6 text-slate-900 bg-[radial-gradient(circle_at_12%_10%,rgba(255,208,82,0.18),transparent_32%),radial-gradient(circle_at_85%_90%,rgba(37,99,235,0.16),transparent_40%),linear-gradient(180deg,#f7f7f8_0%,#f0f2f5_100%)]"}>
        <div className={"mx-auto grid max-w-[1440px] gap-4"}>
          <section className={"grid gap-2.5 rounded-xl border border-slate-900/10 bg-white/90 p-[14px]"}>
            <h2 className={"m-0 text-lg"}>Carregando conta...</h2>
          </section>
        </div>
      </main>
    );
  }

  if (isEdit && hydrationDone && !tenantToEdit) {
    return (
      <main className={"min-h-screen p-6 text-slate-900 bg-[radial-gradient(circle_at_12%_10%,rgba(255,208,82,0.18),transparent_32%),radial-gradient(circle_at_85%_90%,rgba(37,99,235,0.16),transparent_40%),linear-gradient(180deg,#f7f7f8_0%,#f0f2f5_100%)]"}>
        <div className={"mx-auto grid max-w-[1440px] gap-4"}>
          <section className={"grid gap-2.5 rounded-xl border border-slate-900/10 bg-white/90 p-[14px]"}>
            <h2 className={"m-0 text-lg"}>Conta nao encontrada</h2>
            <p className={"m-0 text-xs opacity-70"}>
              A conta informada nao existe ou foi removida.
            </p>
            <div className={"flex flex-wrap gap-2"}>
              <Link href="/accounts" className={"inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2.5 text-[13px] text-white no-underline"}>
                Voltar para contas
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
            <h1 className={"m-0 text-[30px] tracking-[0.5px]"}>{isEdit ? "Editar CONTA" : "Criar CONTA"}</h1>
            <p className={"mb-0 mt-1 text-sm [opacity:0.85]"}>
              {isEdit
                ? "Atualize os dados da conta com endereco validado via Nominatim e geolocalizacao."
                : "Cadastro de conta com endereco validado via Nominatim e geolocalizacao."}
            </p>
          </div>
          <div className={"flex flex-wrap items-center gap-2"}>
            <Link href="/accounts" className={"inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2.5 text-[13px] text-white no-underline"}>
              Voltar para contas
            </Link>
          </div>
        </header>

        <section className={"grid gap-2.5 rounded-xl border border-slate-900/10 bg-white/90 p-[14px]"}>
          <h2 className={"m-0 text-lg"}>Dados da Conta</h2>
          <form onSubmit={handleSubmit} className={"grid gap-2"}>
            <div className={"grid grid-cols-3 gap-2 max-[980px]:grid-cols-1"}>
              <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>Nome da conta</span>
                <input
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Nome da conta"
                  required
                />
              </label>
              <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>Tipo</span>
                <select
                  value={form.person_type}
                  onChange={(e) => update("person_type", e.target.value)}
                >
                  <option value={TENANT_TYPES.COMPANY}>Pessoa Juridica (PJ)</option>
                  <option value={TENANT_TYPES.INDIVIDUAL}>Pessoa Fisica (PF)</option>
                </select>
              </label>
              <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>Documento</span>
                <input
                  value={form.document || ""}
                  onChange={(e) => update("document", e.target.value)}
                  placeholder="CNPJ ou CPF"
                />
              </label>
            </div>

            {isEdit ? (
              <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>ID da conta</span>
                <input value={form.id} readOnly />
              </label>
            ) : null}

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

            <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
              <span>Logo</span>
              <input type="file" accept="image/*" onChange={handleLogoChange} />
            </label>

            {logoPreview ? (
              <div className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>Preview do logo</span>
                <img
                  src={logoPreview}
                  alt="Preview da conta"
                  style={{
                    width: 140,
                    height: 140,
                    objectFit: "contain",
                    border: "1px solid #d1d5db",
                    borderRadius: 8,
                    background: "#fff",
                    padding: 8
                  }}
                />
              </div>
            ) : null}

            {error ? <p className={"m-0 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-800"}>{error}</p> : null}

            <div className={"flex flex-wrap gap-2"}>
              <button type="submit" className={PRIMARY_BUTTON_CLASS} disabled={saving}>
                {saving ? "Salvando..." : isEdit ? "Salvar alteracoes" : "Criar conta"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

export default function AccountFormApp({ mode = "create", accountId = null }) {
  return <AccountFormRuntime mode={mode} accountId={accountId} />;
}


