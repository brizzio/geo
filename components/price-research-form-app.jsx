"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { buildProductRow, toggleValue } from "../features/dashboard/components/form-utils";
import { useDomainActions } from "../features/domain/hooks/use-domain-actions";
import { useDomainState } from "../features/domain/state/domain-state";
import {
  selectActiveTenantId,
  selectClusterById,
  selectClustersByTenant,
  selectCompetitorStoreIdsFromCluster,
  selectPriceResearchById,
  selectStoresByTenant,
  selectTenants
} from "../features/domain/state/selectors";

const INITIAL_FORM = {
  id: "",
  created_at: null,
  tenant_id: "",
  name: "",
  cluster_id: "",
  start_date: "",
  end_date: "",
  start_time: "",
  end_time: "",
  competitor_store_ids: [],
  products: [buildProductRow()]
};

function createForm(activeTenantId = "") {
  return {
    ...INITIAL_FORM,
    tenant_id: activeTenantId || "",
    products: [buildProductRow()]
  };
}

function toFormFromResearch(research) {
  return {
    ...createForm(),
    id: String(research.id),
    created_at: research.created_at || null,
    tenant_id: String(research.tenant_id || ""),
    name: research.name || "",
    cluster_id: String(research.cluster_id || ""),
    start_date: research.start_date || "",
    end_date: research.end_date || "",
    start_time: research.start_time || "",
    end_time: research.end_time || "",
    competitor_store_ids: (research.competitor_store_ids || []).map((id) => String(id)),
    products:
      (research.products || []).map((product) => ({
        id: product.id || buildProductRow().id,
        gtin: product.gtin || "",
        name: product.name || "",
        category: product.category || ""
      })) || [buildProductRow()]
  };
}

function PriceResearchFormRuntime({ mode = "create", researchId = null }) {
  const isEdit = mode === "edit";
  const currentResearchId = researchId ? String(researchId) : null;
  const router = useRouter();
  const { state, hydrationDone } = useDomainState();
  const { savePriceResearch } = useDomainActions();

  const tenants = useMemo(() => selectTenants(state), [state]);
  const activeTenantId = useMemo(() => selectActiveTenantId(state), [state]);
  const researchToEdit = useMemo(() => {
    if (!isEdit || !currentResearchId) {
      return null;
    }
    return selectPriceResearchById(state, currentResearchId);
  }, [state, isEdit, currentResearchId]);

  const [form, setForm] = useState(() => createForm(activeTenantId));
  const [bootstrapped, setBootstrapped] = useState(!isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const clusterOptions = useMemo(() => {
    if (!form.tenant_id) {
      return [];
    }
    return selectClustersByTenant(state, form.tenant_id);
  }, [state, form.tenant_id]);

  const storeOptions = useMemo(() => {
    if (!form.tenant_id) {
      return [];
    }
    return selectStoresByTenant(state, form.tenant_id);
  }, [state, form.tenant_id]);

  const selectedCluster = useMemo(
    () => selectClusterById(state, form.cluster_id),
    [state, form.cluster_id]
  );
  const availableCompetitorIds = useMemo(
    () => selectCompetitorStoreIdsFromCluster(selectedCluster),
    [selectedCluster]
  );
  const levelNameById = useMemo(
    () => Object.fromEntries((selectedCluster?.levels || []).map((level) => [String(level.id), level.name])),
    [selectedCluster]
  );
  const storeNameById = useMemo(
    () => Object.fromEntries(storeOptions.map((store) => [String(store.id), store.name])),
    [storeOptions]
  );

  const levelByStore = useMemo(() => {
    const map = {};
    (selectedCluster?.competitor_groups || []).forEach((group) => {
      (group.store_ids || []).forEach((storeId) => {
        const key = String(storeId);
        map[key] = map[key] || [];
        map[key].push(levelNameById[String(group.level_id)] || "Nivel");
      });
    });
    return map;
  }, [selectedCluster, levelNameById]);

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
    if (!isEdit || !researchToEdit) {
      return;
    }
    setForm(toFormFromResearch(researchToEdit));
    setBootstrapped(true);
  }, [isEdit, researchToEdit]);

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
      cluster_id: tenantId === prev.tenant_id ? prev.cluster_id : "",
      competitor_store_ids: tenantId === prev.tenant_id ? prev.competitor_store_ids : []
    }));
  }

  function updateCluster(clusterId) {
    setForm((prev) => ({
      ...prev,
      cluster_id: clusterId,
      competitor_store_ids: clusterId === prev.cluster_id ? prev.competitor_store_ids : []
    }));
  }

  function toggleCompetitor(storeId) {
    setForm((prev) => ({
      ...prev,
      competitor_store_ids: toggleValue(prev.competitor_store_ids, String(storeId))
    }));
  }

  function addProduct() {
    setForm((prev) => ({
      ...prev,
      products: [...prev.products, buildProductRow()]
    }));
  }

  function removeProduct(productId) {
    setForm((prev) => ({
      ...prev,
      products: prev.products.filter((product) => String(product.id) !== String(productId))
    }));
  }

  function updateProduct(productId, field, value) {
    setForm((prev) => ({
      ...prev,
      products: prev.products.map((product) =>
        String(product.id) === String(productId) ? { ...product, [field]: value } : product
      )
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (isEdit && !researchToEdit) {
        throw new Error("Pesquisa nao encontrada para edicao.");
      }

      savePriceResearch({
        ...form,
        products: form.products.filter((item) => item.name?.trim())
      });
      router.push("/");
    } catch (err) {
      setError(err?.message || "Falha ao salvar pesquisa.");
    } finally {
      setSaving(false);
    }
  }

  if (isEdit && !hydrationDone) {
    return (
      <main className={"min-h-screen p-6 text-slate-900 bg-[radial-gradient(circle_at_12%_10%,rgba(255,208,82,0.18),transparent_32%),radial-gradient(circle_at_85%_90%,rgba(37,99,235,0.16),transparent_40%),linear-gradient(180deg,#f7f7f8_0%,#f0f2f5_100%)]"}>
        <div className={"mx-auto grid max-w-[1440px] gap-4"}>
          <section className={"grid gap-2.5 rounded-xl border border-slate-900/10 bg-white/90 p-[14px]"}>
            <h2 className={"m-0 text-lg"}>Carregando pesquisa...</h2>
          </section>
        </div>
      </main>
    );
  }

  if (isEdit && hydrationDone && !researchToEdit) {
    return (
      <main className={"min-h-screen p-6 text-slate-900 bg-[radial-gradient(circle_at_12%_10%,rgba(255,208,82,0.18),transparent_32%),radial-gradient(circle_at_85%_90%,rgba(37,99,235,0.16),transparent_40%),linear-gradient(180deg,#f7f7f8_0%,#f0f2f5_100%)]"}>
        <div className={"mx-auto grid max-w-[1440px] gap-4"}>
          <section className={"grid gap-2.5 rounded-xl border border-slate-900/10 bg-white/90 p-[14px]"}>
            <h2 className={"m-0 text-lg"}>Pesquisa nao encontrada</h2>
            <p className={"m-0 text-xs opacity-70"}>A pesquisa foi removida ou o ID informado e invalido.</p>
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
              {isEdit ? "Editar Pesquisa de Preco" : "Criar Pesquisa de Preco"}
            </h1>
            <p className={"mb-0 mt-1 text-sm [opacity:0.85]"}>
              Evento com periodo, cluster alvo, concorrentes e lista de produtos.
            </p>
          </div>
          <div className={"flex flex-wrap items-center gap-2"}>
            <Link href="/dashboard" className={"inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2.5 text-[13px] text-white no-underline"}>
              Voltar ao dashboard
            </Link>
          </div>
        </header>

        <section className={"grid gap-2.5 rounded-xl border border-slate-900/10 bg-white/90 p-[14px]"}>
          <h2 className={"m-0 text-lg"}>Formulario de Pesquisa</h2>
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
                <span>Nome da pesquisa</span>
                <input
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Ex: Semana 1 Junho"
                  required
                />
              </label>
              <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>Cluster</span>
                <select
                  value={form.cluster_id}
                  onChange={(e) => updateCluster(e.target.value)}
                  disabled={!form.tenant_id || clusterOptions.length === 0}
                  required
                >
                  <option value="">Selecione...</option>
                  {clusterOptions.map((cluster) => (
                    <option key={cluster.id} value={cluster.id}>
                      {cluster.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {isEdit ? (
              <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>ID da pesquisa</span>
                <input value={form.id} readOnly />
              </label>
            ) : null}

            <div className={"grid grid-cols-2 gap-2 max-[980px]:grid-cols-1"}>
              <div className={"grid grid-cols-2 gap-2 max-[980px]:grid-cols-1"}>
                <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                  <span>Data inicio</span>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => update("start_date", e.target.value)}
                    required
                  />
                </label>
                <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                  <span>Hora inicio</span>
                  <input
                    type="time"
                    value={form.start_time}
                    onChange={(e) => update("start_time", e.target.value)}
                    required
                  />
                </label>
              </div>
              <div className={"grid grid-cols-2 gap-2 max-[980px]:grid-cols-1"}>
                <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                  <span>Data fim</span>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => update("end_date", e.target.value)}
                    required
                  />
                </label>
                <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                  <span>Hora fim</span>
                  <input
                    type="time"
                    value={form.end_time}
                    onChange={(e) => update("end_time", e.target.value)}
                    required
                  />
                </label>
              </div>
            </div>

            <div className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
              <span>Concorrentes do cluster</span>
              <div className={"grid max-h-[150px] gap-1.5 overflow-auto rounded-lg border border-slate-200 bg-white p-2"}>
                {availableCompetitorIds.length === 0 ? (
                  <div className={"rounded-lg border border-dashed border-slate-300 p-2.5 text-xs opacity-75"}>Selecione um cluster com concorrentes.</div>
                ) : (
                  availableCompetitorIds.map((storeId) => (
                    <label key={`research_store_${storeId}`} className={"flex items-center gap-2 text-xs"}>
                      <input
                        type="checkbox"
                        checked={form.competitor_store_ids.includes(String(storeId))}
                        onChange={() => toggleCompetitor(storeId)}
                      />
                      <span>
                        {storeNameById[String(storeId)] || "Loja"} -{" "}
                        {(levelByStore[String(storeId)] || []).join(", ") || "Sem nivel"}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
              <span>Produtos</span>
              <div className={"grid gap-2"}>
                {form.products.map((product) => (
                  <div key={product.id} className={"grid grid-cols-3 gap-2 max-[980px]:grid-cols-1"}>
                    <input
                      value={product.gtin}
                      onChange={(e) => updateProduct(product.id, "gtin", e.target.value)}
                      placeholder="GTIN"
                    />
                    <input
                      value={product.name}
                      onChange={(e) => updateProduct(product.id, "name", e.target.value)}
                      placeholder="Nome produto"
                    />
                    <div className={"grid grid-cols-2 gap-2 max-[980px]:grid-cols-1"}>
                      <input
                        value={product.category}
                        onChange={(e) => updateProduct(product.id, "category", e.target.value)}
                        placeholder="Categoria"
                      />
                      <button
                        type="button"
                        className={`${"cursor-pointer rounded-md border-0 bg-slate-800 px-2.5 py-2 text-xs text-white"} ${"bg-red-700"}`}
                        onClick={() => removeProduct(product.id)}
                        disabled={form.products.length === 1}
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className={"flex flex-wrap gap-2"}>
                <button
                  type="button"
                  className={`${"cursor-pointer rounded-md border-0 bg-slate-800 px-2.5 py-2 text-xs text-white"} ${"border border-slate-300 bg-white text-slate-900"}`}
                  onClick={addProduct}
                >
                  Adicionar produto
                </button>
              </div>
            </div>

            {error ? <p className={"m-0 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-800"}>{error}</p> : null}
            <div className={"flex flex-wrap gap-2"}>
              <button type="submit" className={"cursor-pointer rounded-md border-0 bg-slate-800 px-2.5 py-2 text-xs text-white"} disabled={saving}>
                {saving ? "Salvando..." : isEdit ? "Salvar alteracoes" : "Criar pesquisa"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

export default function PriceResearchFormApp({ mode = "create", researchId = null }) {
  return <PriceResearchFormRuntime mode={mode} researchId={researchId} />;
}


