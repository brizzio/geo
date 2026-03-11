"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useDomainActions } from "../features/domain/hooks/use-domain-actions";
import {
  RETAIL_BANNER_NETWORK_CHANNELS,
  RETAIL_BANNER_NETWORK_TYPES
} from "../features/domain/models";
import { useDomainState } from "../features/domain/state/domain-state";
import { uploadImageToImgbb } from "../features/domain/services/imgbb-upload";
import {
  selectActiveTenantId,
  selectBannerById,
  selectNetworksByTenant,
  selectTenants
} from "../features/domain/state/selectors";

const INITIAL_FORM = {
  id: "",
  created_at: null,
  tenant_id: "",
  network_id: "",
  code: "",
  name: "",
  network_type: RETAIL_BANNER_NETWORK_TYPES[0]?.id || "",
  network_channel: RETAIL_BANNER_NETWORK_CHANNELS[0]?.id || "",
  description: "",
  logo_url: "",
  logo: null
};

function createForm(activeTenantId = "") {
  return {
    ...INITIAL_FORM,
    tenant_id: activeTenantId || ""
  };
}

function toFormFromBanner(banner) {
  const logo = banner.logo && typeof banner.logo === "object" ? banner.logo : null;
  return {
    ...createForm(),
    id: String(banner.id),
    created_at: banner.created_at || null,
    tenant_id: String(banner.tenant_id || ""),
    network_id: String(banner.network_id || ""),
    code: banner.code || "",
    name: banner.name || "",
    network_type: banner.network_type || RETAIL_BANNER_NETWORK_TYPES[0]?.id || "",
    network_channel: banner.network_channel || RETAIL_BANNER_NETWORK_CHANNELS[0]?.id || "",
    description: banner.description || "",
    logo_url: logo?.image_url || banner.logo_url || "",
    logo: logo
      ? {
          provider: logo.provider || "imgbb",
          id: logo.id || null,
          image_url: logo.image_url || banner.logo_url || null,
          display_url: logo.display_url || logo.image_url || banner.logo_url || null,
          thumb_url: logo.thumb_url || null,
          medium_url: logo.medium_url || null,
          delete_url: logo.delete_url || null
        }
      : banner.logo_url
        ? {
            provider: null,
            id: null,
            image_url: banner.logo_url,
            display_url: banner.logo_url,
            thumb_url: null,
            medium_url: null,
            delete_url: null
          }
        : null
  };
}

function BannerFormRuntime({ mode = "create", bannerId = null }) {
  const isEdit = mode === "edit";
  const currentBannerId = bannerId ? String(bannerId) : null;
  const router = useRouter();
  const { state, hydrationDone } = useDomainState();
  const { saveRetailBanner } = useDomainActions();

  const tenants = useMemo(() => selectTenants(state), [state]);
  const activeTenantId = useMemo(() => selectActiveTenantId(state), [state]);
  const bannerToEdit = useMemo(() => {
    if (!isEdit || !currentBannerId) {
      return null;
    }
    return selectBannerById(state, currentBannerId);
  }, [state, isEdit, currentBannerId]);

  const [form, setForm] = useState(() => createForm(activeTenantId));
  const [bootstrapped, setBootstrapped] = useState(!isEdit);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const networkOptions = useMemo(() => {
    if (!form.tenant_id) {
      return [];
    }
    return selectNetworksByTenant(state, form.tenant_id);
  }, [state, form.tenant_id]);

  const previewLogoUrl = useMemo(() => {
    return form.logo?.display_url || form.logo?.image_url || form.logo_url || null;
  }, [form.logo, form.logo_url]);

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
    if (!isEdit || !bannerToEdit) {
      return;
    }
    setForm(toFormFromBanner(bannerToEdit));
    setBootstrapped(true);
  }, [isEdit, bannerToEdit]);

  function update(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value
    }));
  }

  function updateTenant(tenantId) {
    setForm((prev) => ({
      ...prev,
      tenant_id: tenantId,
      network_id: tenantId === prev.tenant_id ? prev.network_id : ""
    }));
  }

  async function handleLogoFile(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setError("");
    setUploadingLogo(true);

    try {
      const result = await uploadImageToImgbb(file, {
        name: `${Date.now()}-${file.name}`
      });
      setForm((prev) => ({
        ...prev,
        logo_url: result.imageUrl || result.url || "",
        logo: {
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
      setError(err?.message || "Falha no upload do logo.");
    } finally {
      setUploadingLogo(false);
      event.target.value = "";
    }
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (isEdit && !bannerToEdit) {
        throw new Error("Bandeira nao encontrada para edicao.");
      }
      saveRetailBanner(form);
      router.push("/");
    } catch (err) {
      setError(err?.message || "Falha ao salvar bandeira.");
    } finally {
      setSaving(false);
    }
  }

  if (isEdit && !hydrationDone) {
    return (
      <main className={"min-h-screen p-6 text-slate-900 bg-[radial-gradient(circle_at_12%_10%,rgba(255,208,82,0.18),transparent_32%),radial-gradient(circle_at_85%_90%,rgba(37,99,235,0.16),transparent_40%),linear-gradient(180deg,#f7f7f8_0%,#f0f2f5_100%)]"}>
        <div className={"mx-auto grid max-w-[1440px] gap-4"}>
          <section className={"grid gap-2.5 rounded-xl border border-slate-900/10 bg-white/90 p-[14px]"}>
            <h2 className={"m-0 text-lg"}>Carregando bandeira...</h2>
          </section>
        </div>
      </main>
    );
  }

  if (isEdit && hydrationDone && !bannerToEdit) {
    return (
      <main className={"min-h-screen p-6 text-slate-900 bg-[radial-gradient(circle_at_12%_10%,rgba(255,208,82,0.18),transparent_32%),radial-gradient(circle_at_85%_90%,rgba(37,99,235,0.16),transparent_40%),linear-gradient(180deg,#f7f7f8_0%,#f0f2f5_100%)]"}>
        <div className={"mx-auto grid max-w-[1440px] gap-4"}>
          <section className={"grid gap-2.5 rounded-xl border border-slate-900/10 bg-white/90 p-[14px]"}>
            <h2 className={"m-0 text-lg"}>Bandeira nao encontrada</h2>
            <p className={"m-0 text-xs opacity-70"}>A bandeira foi removida ou o ID informado e invalido.</p>
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
            <h1 className={"m-0 text-[30px] tracking-[0.5px]"}>{isEdit ? "Editar Bandeira" : "Criar Bandeira"}</h1>
            <p className={"mb-0 mt-1 text-sm [opacity:0.85]"}>
              Cadastro com tipo de rede, canal e upload de logo via imgbb.
            </p>
          </div>
          <div className={"flex flex-wrap items-center gap-2"}>
            <Link href="/dashboard" className={"inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2.5 text-[13px] text-white no-underline"}>
              Voltar ao dashboard
            </Link>
          </div>
        </header>

        <section className={"grid gap-2.5 rounded-xl border border-slate-900/10 bg-white/90 p-[14px]"}>
          <h2 className={"m-0 text-lg"}>Formulario de Bandeira</h2>
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
                  onChange={(e) => update("network_id", e.target.value)}
                  disabled={isEdit || !form.tenant_id || networkOptions.length === 0}
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
              <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>Codigo</span>
                <input
                  value={form.code}
                  onChange={(e) => update("code", e.target.value)}
                  placeholder="Ex: BAN_A"
                />
              </label>
            </div>

            {form.tenant_id && networkOptions.length === 0 ? (
              <p className={"m-0 text-xs opacity-70"}>
                Nenhuma rede disponivel para esta conta. Crie uma rede antes em{" "}
                <Link href="/networks/new">/networks/new</Link>.
              </p>
            ) : null}

            {isEdit ? (
              <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>ID da bandeira</span>
                <input value={form.id} readOnly />
              </label>
            ) : null}

            <div className={"grid grid-cols-2 gap-2 max-[980px]:grid-cols-1"}>
              <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>Nome da bandeira</span>
                <input
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Nome da bandeira"
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

            <div className={"grid grid-cols-2 gap-2 max-[980px]:grid-cols-1"}>
              <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>Tipo de rede</span>
                <select
                  value={form.network_type}
                  onChange={(e) => update("network_type", e.target.value)}
                  required
                >
                  {RETAIL_BANNER_NETWORK_TYPES.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>Canal</span>
                <select
                  value={form.network_channel}
                  onChange={(e) => update("network_channel", e.target.value)}
                  required
                >
                  {RETAIL_BANNER_NETWORK_CHANNELS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className={"grid grid-cols-2 gap-2 max-[980px]:grid-cols-1"}>
              <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>Logo URL</span>
                <input
                  value={form.logo_url}
                  onChange={(e) => {
                    const next = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      logo_url: next,
                      logo: next
                        ? {
                            provider: prev.logo?.provider || null,
                            id: prev.logo?.id || null,
                            image_url: next,
                            display_url: next,
                            thumb_url: prev.logo?.thumb_url || null,
                            medium_url: prev.logo?.medium_url || null,
                            delete_url: prev.logo?.delete_url || null
                          }
                        : null
                    }));
                  }}
                  placeholder="https://..."
                />
              </label>
              <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>Upload de logo (imgbb)</span>
                <input type="file" accept="image/*" onChange={handleLogoFile} disabled={uploadingLogo} />
              </label>
            </div>

            {previewLogoUrl ? (
              <div className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>Preview do logo</span>
                <img
                  src={previewLogoUrl}
                  alt={`Logo ${form.name || "bandeira"}`}
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
              <button
                type="button"
                className={`${"cursor-pointer rounded-md border-0 bg-slate-800 px-2.5 py-2 text-xs text-white"} ${"border border-slate-300 bg-white text-slate-900"}`}
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    logo_url: "",
                    logo: null
                  }))
                }
                disabled={!form.logo_url && !form.logo}
              >
                Remover logo
              </button>
              <button type="submit" className={"cursor-pointer rounded-md border-0 bg-slate-800 px-2.5 py-2 text-xs text-white"} disabled={saving || uploadingLogo}>
                {saving ? "Salvando..." : isEdit ? "Salvar alteracoes" : "Criar bandeira"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

export default function BannerFormApp({ mode = "create", bannerId = null }) {
  return <BannerFormRuntime mode={mode} bannerId={bannerId} />;
}


