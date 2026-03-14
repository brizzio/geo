"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useDomainActions } from "../features/domain/hooks/use-domain-actions";
import { uploadImageToImgbb } from "../features/domain/services/imgbb-upload";
import { useDomainState } from "../features/domain/state/domain-state";
import {
  selectActiveTenantId,
  selectProductById,
  selectTenants
} from "../features/domain/state/selectors";

const INITIAL_FORM = {
  id: "",
  created_at: null,
  tenant_id: "",
  internal_reference: "",
  ean: "",
  name: "",
  description: "",
  code_plu: "",
  image_url: "",
  image: null,
  brand: "",
  line: "",
  industry_name: "",
  presentation: "",
  package_type: "",
  package_model: "",
  package_material: "",
  package_format: "",
  package_dimensions_unit: "cm",
  package_dimensions_height: "",
  package_dimensions_width: "",
  package_dimensions_depth: "",
  package_weight_unit: "",
  package_gross_weight: "",
  package_net_weight: "",
  weight: "",
  weight_unit: "",
  volume: "",
  volume_unit: "",
  category: ""
};

const PRIMARY_BUTTON_CLASS =
  "cursor-pointer rounded-md border-0 bg-slate-800 px-2.5 py-2 text-xs text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60";
const SECONDARY_BUTTON_CLASS =
  "cursor-pointer rounded-md border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60";

function createForm(activeTenantId = "") {
  return {
    ...INITIAL_FORM,
    tenant_id: activeTenantId || ""
  };
}

function toFormFromProduct(product) {
  const image =
    product.image && typeof product.image === "object"
      ? {
          provider: product.image.provider || null,
          id: product.image.id || null,
          image_url: product.image.image_url || product.image_url || null,
          display_url: product.image.display_url || product.image.image_url || product.image_url || null,
          thumb_url: product.image.thumb_url || null,
          medium_url: product.image.medium_url || null,
          delete_url: product.image.delete_url || null
        }
      : product.image_url
        ? {
            provider: null,
            id: null,
            image_url: product.image_url,
            display_url: product.image_url,
            thumb_url: null,
            medium_url: null,
            delete_url: null
          }
        : null;

  return {
    ...createForm(),
    id: String(product.id),
    created_at: product.created_at || null,
    tenant_id: String(product.tenant_id || ""),
    internal_reference: product.internal_reference || "",
    ean: product.ean || "",
    name: product.name || "",
    description: product.description || "",
    code_plu: product.code_plu || "",
    image_url: image?.image_url || product.image_url || "",
    image,
    brand: product.brand || "",
    line: product.line || "",
    industry_name: product.industry_name || "",
    presentation: product.presentation || "",
    package_type: product.package_type || "",
    package_model: product.package_model || "",
    package_material: product.package_material || "",
    package_format: product.package_format || "",
    package_dimensions_unit: product.package_dimensions_unit || "cm",
    package_dimensions_height:
      product.package_dimensions_height === null || product.package_dimensions_height === undefined
        ? ""
        : String(product.package_dimensions_height),
    package_dimensions_width:
      product.package_dimensions_width === null || product.package_dimensions_width === undefined
        ? ""
        : String(product.package_dimensions_width),
    package_dimensions_depth:
      product.package_dimensions_depth === null || product.package_dimensions_depth === undefined
        ? ""
        : String(product.package_dimensions_depth),
    package_weight_unit: product.package_weight_unit || "",
    package_gross_weight:
      product.package_gross_weight === null || product.package_gross_weight === undefined
        ? ""
        : String(product.package_gross_weight),
    package_net_weight:
      product.package_net_weight === null || product.package_net_weight === undefined
        ? ""
        : String(product.package_net_weight),
    weight: product.weight === null || product.weight === undefined ? "" : String(product.weight),
    weight_unit: product.weight_unit || "",
    volume: product.volume === null || product.volume === undefined ? "" : String(product.volume),
    volume_unit: product.volume_unit || "",
    category: product.category || ""
  };
}

function ProductFormRuntime({ mode = "create", productId = null }) {
  const isEdit = mode === "edit";
  const isClone = mode === "clone";
  const isExistingSourceMode = isEdit || isClone;
  const currentProductId = productId ? String(productId) : null;
  const router = useRouter();
  const { state, hydrationDone } = useDomainState();
  const { saveProduct } = useDomainActions();

  const tenants = useMemo(() => selectTenants(state), [state]);
  const activeTenantId = useMemo(() => selectActiveTenantId(state), [state]);
  const productToEdit = useMemo(() => {
    if (!isExistingSourceMode || !currentProductId) {
      return null;
    }
    return selectProductById(state, currentProductId);
  }, [state, isExistingSourceMode, currentProductId]);

  const [form, setForm] = useState(() => createForm(activeTenantId));
  const [bootstrapped, setBootstrapped] = useState(!isExistingSourceMode);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const imagePreviewUrl = useMemo(() => {
    return form.image?.display_url || form.image?.image_url || form.image_url || null;
  }, [form.image, form.image_url]);

  useEffect(() => {
    if (isExistingSourceMode) {
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
  }, [activeTenantId, isExistingSourceMode]);

  useEffect(() => {
    if (!isExistingSourceMode || !productToEdit) {
      return;
    }

    if (isClone) {
      const clonedForm = toFormFromProduct(productToEdit);
      setForm({
        ...clonedForm,
        id: "",
        created_at: null,
        name: clonedForm.name ? `${clonedForm.name} (copia)` : clonedForm.name
      });
      setBootstrapped(true);
      return;
    }

    setForm(toFormFromProduct(productToEdit));
    setBootstrapped(true);
  }, [isExistingSourceMode, isClone, productToEdit]);

  function update(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value
    }));
  }

  async function handleImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setError("");
    setUploadingImage(true);

    try {
      const result = await uploadImageToImgbb(file, {
        name: `${Date.now()}-${file.name}`
      });

      setForm((prev) => ({
        ...prev,
        image_url: result.imageUrl || result.url || "",
        image: {
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
      setError(err?.message || "Falha ao enviar imagem do produto.");
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      if (isExistingSourceMode && !productToEdit) {
        throw new Error("Produto base nao encontrado.");
      }

      const payload = isClone
        ? {
            ...form,
            id: "",
            created_at: null
          }
        : form;

      saveProduct(payload);
      router.replace("/dashboard");
    } catch (err) {
      setError(err?.message || "Falha ao salvar produto.");
    } finally {
      setSaving(false);
    }
  }

  if (isExistingSourceMode && !hydrationDone) {
    return (
      <main className={"min-h-screen p-6 text-slate-900 bg-[radial-gradient(circle_at_12%_10%,rgba(255,208,82,0.18),transparent_32%),radial-gradient(circle_at_85%_90%,rgba(37,99,235,0.16),transparent_40%),linear-gradient(180deg,#f7f7f8_0%,#f0f2f5_100%)]"}>
        <div className={"mx-auto grid max-w-[1440px] gap-4"}>
          <section className={"grid gap-2.5 rounded-xl border border-slate-900/10 bg-white/90 p-[14px]"}>
            <h2 className={"m-0 text-lg"}>Carregando produto...</h2>
          </section>
        </div>
      </main>
    );
  }

  if (isExistingSourceMode && hydrationDone && !productToEdit) {
    return (
      <main className={"min-h-screen p-6 text-slate-900 bg-[radial-gradient(circle_at_12%_10%,rgba(255,208,82,0.18),transparent_32%),radial-gradient(circle_at_85%_90%,rgba(37,99,235,0.16),transparent_40%),linear-gradient(180deg,#f7f7f8_0%,#f0f2f5_100%)]"}>
        <div className={"mx-auto grid max-w-[1440px] gap-4"}>
          <section className={"grid gap-2.5 rounded-xl border border-slate-900/10 bg-white/90 p-[14px]"}>
            <h2 className={"m-0 text-lg"}>Produto base nao encontrado</h2>
            <p className={"m-0 text-xs opacity-70"}>O produto informado foi removido ou o ID e invalido.</p>
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

  if (isExistingSourceMode && !bootstrapped) {
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
              {isEdit ? "Editar Produto" : isClone ? "Novo Produto Baseado em Item Existente" : "Criar Produto"}
            </h1>
            <p className={"mb-0 mt-1 text-sm [opacity:0.85]"}>
              Cadastro de catalogo para uso em pesquisas.
            </p>
          </div>
          <div className={"flex flex-wrap items-center gap-2"}>
            <Link href="/dashboard" className={"inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2.5 text-[13px] text-white no-underline"}>
              Voltar ao dashboard
            </Link>
          </div>
        </header>

        <section className={"grid gap-2.5 rounded-xl border border-slate-900/10 bg-white/90 p-[14px]"}>
          <h2 className={"m-0 text-lg"}>Formulario de Produto</h2>
          <form onSubmit={submit} className={"grid gap-2"}>
            <div className={"grid grid-cols-3 gap-2 max-[980px]:grid-cols-1"}>
              <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>Conta</span>
                <select
                  value={form.tenant_id}
                  onChange={(e) => update("tenant_id", e.target.value)}
                  disabled={isEdit || isClone}
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
                <span>Nome</span>
                <input
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Nome do produto"
                  required
                />
              </label>
              <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>Categoria</span>
                <input
                  value={form.category}
                  onChange={(e) => update("category", e.target.value)}
                  placeholder="Categoria"
                />
              </label>
            </div>

            {isEdit ? (
              <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>ID do produto</span>
                <input value={form.id} readOnly />
              </label>
            ) : null}

            <div className={"grid grid-cols-3 gap-2 max-[980px]:grid-cols-1"}>
              <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>Referencia interna</span>
                <input
                  value={form.internal_reference}
                  onChange={(e) => update("internal_reference", e.target.value)}
                  placeholder="SKU interno"
                />
              </label>
              <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>EAN</span>
                <input
                  value={form.ean}
                  onChange={(e) => update("ean", e.target.value)}
                  placeholder="Codigo de barras"
                />
              </label>
              <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>Codigo PLU</span>
                <input
                  value={form.code_plu}
                  onChange={(e) => update("code_plu", e.target.value)}
                  placeholder="PLU"
                />
              </label>
            </div>

            <div className={"grid grid-cols-3 gap-2 max-[980px]:grid-cols-1"}>
              <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>Marca</span>
                <input
                  value={form.brand}
                  onChange={(e) => update("brand", e.target.value)}
                  placeholder="Marca"
                />
              </label>
              <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>Linha</span>
                <input
                  value={form.line}
                  onChange={(e) => update("line", e.target.value)}
                  placeholder="Linha do produto"
                />
              </label>
              <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>Industria</span>
                <input
                  value={form.industry_name}
                  onChange={(e) => update("industry_name", e.target.value)}
                  placeholder="Industria"
                />
              </label>
            </div>

            <section className={"grid gap-2 rounded-lg border border-slate-200 bg-white p-2"}>
              <h3 className={"m-0 text-sm"}>Embalagem</h3>

              <div className={"grid grid-cols-3 gap-2 max-[980px]:grid-cols-1"}>
                <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                  <span>Tipo de embalagem</span>
                  <input
                    value={form.package_type}
                    onChange={(e) => update("package_type", e.target.value)}
                    placeholder="Ex: Flexivel"
                  />
                </label>
                <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                  <span>Modelo da embalagem</span>
                  <input
                    value={form.package_model}
                    onChange={(e) => update("package_model", e.target.value)}
                    placeholder="Ex: Flow Pack (Solda de 3 pontos)"
                  />
                </label>
                <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                  <span>Material da embalagem</span>
                  <input
                    value={form.package_material}
                    onChange={(e) => update("package_material", e.target.value)}
                    placeholder="Ex: Plastico Laminado (PE/PP)"
                  />
                </label>
              </div>

              <div className={"grid grid-cols-5 gap-2 max-[980px]:grid-cols-1"}>
                <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                  <span>Formato</span>
                  <input
                    value={form.package_format}
                    onChange={(e) => update("package_format", e.target.value)}
                    placeholder="Ex: Retangular / Almofada"
                  />
                </label>
                <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                  <span>Unidade dimensoes</span>
                  <input
                    value={form.package_dimensions_unit}
                    onChange={(e) => update("package_dimensions_unit", e.target.value)}
                    placeholder="cm"
                  />
                </label>
                <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                  <span>Altura</span>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={form.package_dimensions_height}
                    onChange={(e) => update("package_dimensions_height", e.target.value)}
                    placeholder="Ex: 25"
                  />
                </label>
                <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                  <span>Largura</span>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={form.package_dimensions_width}
                    onChange={(e) => update("package_dimensions_width", e.target.value)}
                    placeholder="Ex: 18"
                  />
                </label>
                <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                  <span>Profundidade</span>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={form.package_dimensions_depth}
                    onChange={(e) => update("package_dimensions_depth", e.target.value)}
                    placeholder="Ex: 4"
                  />
                </label>
              </div>

              <div className={"grid grid-cols-3 gap-2 max-[980px]:grid-cols-1"}>
                <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                  <span>Unidade peso embalagem</span>
                  <input
                    value={form.package_weight_unit}
                    onChange={(e) => update("package_weight_unit", e.target.value)}
                    placeholder="Ex: KG"
                  />
                </label>
                <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                  <span>Peso bruto embalagem</span>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={form.package_gross_weight}
                    onChange={(e) => update("package_gross_weight", e.target.value)}
                    placeholder="Ex: 835"
                  />
                </label>
                <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                  <span>Peso liquido embalagem</span>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={form.package_net_weight}
                    onChange={(e) => update("package_net_weight", e.target.value)}
                    placeholder="Ex: 800"
                  />
                </label>
              </div>
            </section>

            <div className={"grid grid-cols-5 gap-2 max-[980px]:grid-cols-1"}>
              <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>Apresentacao</span>
                <input
                  value={form.presentation}
                  onChange={(e) => update("presentation", e.target.value)}
                  placeholder="Ex: Garrafa"
                />
              </label>
              <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>Peso</span>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={form.weight}
                  onChange={(e) => update("weight", e.target.value)}
                  placeholder="0.000"
                />
              </label>
              <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>Unidade peso</span>
                <input
                  value={form.weight_unit}
                  onChange={(e) => update("weight_unit", e.target.value)}
                  placeholder="kg, g"
                />
              </label>
              <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>Volume</span>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={form.volume}
                  onChange={(e) => update("volume", e.target.value)}
                  placeholder="0.000"
                />
              </label>
              <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>Unidade volume</span>
                <input
                  value={form.volume_unit}
                  onChange={(e) => update("volume_unit", e.target.value)}
                  placeholder="L, ml"
                />
              </label>
            </div>

            <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
              <span>Descricao</span>
              <textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Descricao opcional"
              />
            </label>

            <div className={"grid grid-cols-2 gap-2 max-[980px]:grid-cols-1"}>
              <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>Imagem URL</span>
                <input
                  value={form.image_url}
                  onChange={(e) => {
                    const next = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      image_url: next,
                      image: next
                        ? {
                            provider: prev.image?.provider || null,
                            id: prev.image?.id || null,
                            image_url: next,
                            display_url: next,
                            thumb_url: prev.image?.thumb_url || null,
                            medium_url: prev.image?.medium_url || null,
                            delete_url: prev.image?.delete_url || null
                          }
                        : null
                    }));
                  }}
                  placeholder="https://..."
                />
              </label>
              <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>Upload imagem (imgbb)</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
              </label>
            </div>

            {imagePreviewUrl ? (
              <div className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>Preview da imagem</span>
                <img
                  src={imagePreviewUrl}
                  alt={`Imagem ${form.name || "produto"}`}
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
                className={SECONDARY_BUTTON_CLASS}
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    image_url: "",
                    image: null
                  }))
                }
                disabled={!form.image_url && !form.image}
              >
                Remover imagem
              </button>
              <button
                type="submit"
                className={`${PRIMARY_BUTTON_CLASS} inline-flex items-center gap-1.5`}
                disabled={saving || uploadingImage}
              >
                {saving ? (
                  <>
                    <span
                      className={"inline-block h-3 w-3 animate-spin rounded-full border border-white border-t-transparent"}
                      aria-hidden="true"
                    />
                    Salvando...
                  </>
                ) : isEdit ? "Salvar alteracoes" : isClone ? "Criar copia" : "Criar produto"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

export default function ProductFormApp({ mode = "create", productId = null }) {
  return <ProductFormRuntime mode={mode} productId={productId} />;
}
