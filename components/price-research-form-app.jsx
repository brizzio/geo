"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toggleValue } from "../features/dashboard/components/form-utils";
import { useDomainActions } from "../features/domain/hooks/use-domain-actions";
import {
  RESEARCH_SERVICE_STATUSES as RESEARCH_SERVICE_STATUSES_MODEL,
  RESEARCH_SERVICE_WEEKDAYS as RESEARCH_SERVICE_WEEKDAYS_MODEL
} from "../features/domain/models/price-research-model";
import { useDomainState } from "../features/domain/state/domain-state";
import {
  selectActiveTenantId,
  selectClusterById,
  selectClustersByTenant,
  selectPriceResearchById,
  selectProductsByTenant,
  selectTenants
} from "../features/domain/state/selectors";

const RESEARCH_SERVICE_STATUSES = RESEARCH_SERVICE_STATUSES_MODEL || {
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED"
};

const RESEARCH_SERVICE_WEEKDAYS = RESEARCH_SERVICE_WEEKDAYS_MODEL || [
  { id: "MONDAY", name: "Segunda-feira" },
  { id: "TUESDAY", name: "Terca-feira" },
  { id: "WEDNESDAY", name: "Quarta-feira" },
  { id: "THURSDAY", name: "Quinta-feira" },
  { id: "FRIDAY", name: "Sexta-feira" },
  { id: "SATURDAY", name: "Sabado" },
  { id: "SUNDAY", name: "Domingo" }
];

const INITIAL_FORM = {
  id: "",
  created_at: null,
  tenant_id: "",
  name: "",
  cluster_id: "",
  status: RESEARCH_SERVICE_STATUSES.ACTIVE,
  start_date: "",
  duration_days: "",
  is_duration_indefinite: false,
  recurrence_enabled: false,
  recurrence_weekdays: [],
  same_product_list_for_all_levels: true,
  default_product_ids: [],
  level_product_lists: []
};

function listFromClusterLevels(cluster, sourceLists = [], fallbackProductIds = []) {
  const levelIds = (cluster?.levels || []).map((level) => String(level.id));
  const sourceMap = new Map(
    (sourceLists || [])
      .map((entry) => ({
        level_id: String(entry?.level_id || ""),
        product_ids: (entry?.product_ids || []).map((productId) => String(productId))
      }))
      .filter((entry) => entry.level_id)
      .map((entry) => [entry.level_id, entry.product_ids])
  );

  return levelIds.map((levelId) => ({
    level_id: levelId,
    product_ids: sourceMap.get(levelId) || fallbackProductIds.map((item) => String(item))
  }));
}

function createForm(activeTenantId = "") {
  return {
    ...INITIAL_FORM,
    tenant_id: activeTenantId || ""
  };
}

function toFormFromResearch(research, cluster) {
  const defaultProductIds = (research.default_product_ids || []).map((item) => String(item));
  const levelProductLists = listFromClusterLevels(
    cluster,
    research.level_product_lists || [],
    defaultProductIds
  );

  return {
    ...createForm(),
    id: String(research.id),
    created_at: research.created_at || null,
    tenant_id: String(research.tenant_id || ""),
    name: research.name || "",
    cluster_id: String(research.cluster_id || ""),
    status:
      String(research.status || "").toUpperCase() === RESEARCH_SERVICE_STATUSES.SUSPENDED
        ? RESEARCH_SERVICE_STATUSES.SUSPENDED
        : RESEARCH_SERVICE_STATUSES.ACTIVE,
    start_date: research.start_date || "",
    duration_days:
      research.duration_days === null || research.duration_days === undefined
        ? ""
        : String(research.duration_days),
    is_duration_indefinite: Boolean(research.is_duration_indefinite),
    recurrence_enabled: Boolean(research.recurrence_enabled),
    recurrence_weekdays: (research.recurrence_weekdays || []).map((item) => String(item)),
    same_product_list_for_all_levels:
      research.same_product_list_for_all_levels === undefined
        ? true
        : Boolean(research.same_product_list_for_all_levels),
    default_product_ids: defaultProductIds,
    level_product_lists: levelProductLists
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

  const productOptions = useMemo(() => {
    if (!form.tenant_id) {
      return [];
    }
    return selectProductsByTenant(state, form.tenant_id);
  }, [state, form.tenant_id]);

  const selectedCluster = useMemo(
    () => selectClusterById(state, form.cluster_id),
    [state, form.cluster_id]
  );

  const levelById = useMemo(
    () => Object.fromEntries((selectedCluster?.levels || []).map((level) => [String(level.id), level])),
    [selectedCluster]
  );

  const productById = useMemo(
    () => Object.fromEntries(productOptions.map((product) => [String(product.id), product])),
    [productOptions]
  );

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
    const cluster = selectClusterById(state, researchToEdit.cluster_id);
    setForm(toFormFromResearch(researchToEdit, cluster));
    setBootstrapped(true);
  }, [isEdit, researchToEdit, state]);

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
      default_product_ids: tenantId === prev.tenant_id ? prev.default_product_ids : [],
      level_product_lists: tenantId === prev.tenant_id ? prev.level_product_lists : []
    }));
  }

  function updateCluster(clusterId) {
    const nextCluster = selectClusterById(state, clusterId);
    setForm((prev) => ({
      ...prev,
      cluster_id: clusterId,
      level_product_lists:
        clusterId === prev.cluster_id
          ? prev.level_product_lists
          : listFromClusterLevels(nextCluster, [], prev.default_product_ids)
    }));
  }

  function toggleWeekday(weekdayId) {
    setForm((prev) => ({
      ...prev,
      recurrence_weekdays: toggleValue(prev.recurrence_weekdays, weekdayId)
    }));
  }

  function toggleRecurrenceEnabled(enabled) {
    setForm((prev) => ({
      ...prev,
      recurrence_enabled: Boolean(enabled),
      recurrence_weekdays: enabled ? prev.recurrence_weekdays : []
    }));
  }

  function toggleSameListForAllLevels(nextValue) {
    setForm((prev) => {
      const checked = Boolean(nextValue);
      if (checked) {
        return {
          ...prev,
          same_product_list_for_all_levels: true,
          level_product_lists: listFromClusterLevels(
            selectedCluster,
            [],
            prev.default_product_ids
          )
        };
      }

      return {
        ...prev,
        same_product_list_for_all_levels: false,
        level_product_lists: listFromClusterLevels(
          selectedCluster,
          prev.level_product_lists,
          prev.default_product_ids
        )
      };
    });
  }

  function toggleDefaultProduct(productId) {
    const normalizedId = String(productId);
    setForm((prev) => {
      const nextDefaultProductIds = toggleValue(prev.default_product_ids, normalizedId);
      const shouldReplicate = prev.same_product_list_for_all_levels;
      return {
        ...prev,
        default_product_ids: nextDefaultProductIds,
        level_product_lists: shouldReplicate
          ? listFromClusterLevels(selectedCluster, [], nextDefaultProductIds)
          : prev.level_product_lists
      };
    });
  }

  function toggleLevelProduct(levelId, productId) {
    const normalizedLevelId = String(levelId);
    const normalizedProductId = String(productId);
    setForm((prev) => ({
      ...prev,
      level_product_lists: prev.level_product_lists.map((entry) =>
        String(entry.level_id) === normalizedLevelId
          ? {
              ...entry,
              product_ids: toggleValue(entry.product_ids || [], normalizedProductId)
            }
          : entry
      )
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (isEdit && !researchToEdit) {
        throw new Error("Servico nao encontrado para edicao.");
      }

      savePriceResearch({
        ...form,
        duration_days: form.is_duration_indefinite ? null : form.duration_days
      });
      router.replace("/dashboard");
    } catch (err) {
      setError(err?.message || "Falha ao salvar servico.");
    } finally {
      setSaving(false);
    }
  }

  if (isEdit && !hydrationDone) {
    return (
      <main className={"min-h-screen p-6 text-slate-900 bg-[radial-gradient(circle_at_12%_10%,rgba(255,208,82,0.18),transparent_32%),radial-gradient(circle_at_85%_90%,rgba(37,99,235,0.16),transparent_40%),linear-gradient(180deg,#f7f7f8_0%,#f0f2f5_100%)]"}>
        <div className={"mx-auto grid max-w-[1440px] gap-4"}>
          <section className={"grid gap-2.5 rounded-xl border border-slate-900/10 bg-white/90 p-[14px]"}>
            <h2 className={"m-0 text-lg"}>Carregando servico...</h2>
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
            <h2 className={"m-0 text-lg"}>Servico nao encontrado</h2>
            <p className={"m-0 text-xs opacity-70"}>O servico foi removido ou o ID informado e invalido.</p>
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
              {isEdit ? "Editar Servico de Pesquisa" : "Criar Servico de Pesquisa"}
            </h1>
            <p className={"mb-0 mt-1 text-sm [opacity:0.85]"}>
              Servico com inicio, prazo, recorrencia, status e lista de produtos por nivel de concorrencia.
            </p>
          </div>
          <div className={"flex flex-wrap items-center gap-2"}>
            <Link href="/dashboard" className={"inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2.5 text-[13px] text-white no-underline"}>
              Voltar ao dashboard
            </Link>
          </div>
        </header>

        <section className={"grid gap-2.5 rounded-xl border border-slate-900/10 bg-white/90 p-[14px]"}>
          <h2 className={"m-0 text-lg"}>Formulario do Servico</h2>
          <form onSubmit={submit} className={"grid gap-2"}>
            <div className={"grid grid-cols-3 gap-2 max-[980px]:grid-cols-1"}>
              <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>Conta</span>
                <select
                  value={form.tenant_id}
                  onChange={(event) => updateTenant(event.target.value)}
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
                <span>Nome do servico</span>
                <input
                  value={form.name}
                  onChange={(event) => update("name", event.target.value)}
                  placeholder="Ex: Service Semanal Cluster A"
                  required
                />
              </label>
              <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>Cluster</span>
                <select
                  value={form.cluster_id}
                  onChange={(event) => updateCluster(event.target.value)}
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
                <span>ID do servico</span>
                <input value={form.id} readOnly />
              </label>
            ) : null}

            <div className={"grid grid-cols-4 gap-2 max-[980px]:grid-cols-1"}>
              <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>Status</span>
                <select
                  value={form.status}
                  onChange={(event) => update("status", event.target.value)}
                  required
                >
                  <option value={RESEARCH_SERVICE_STATUSES.ACTIVE}>Ativo</option>
                  <option value={RESEARCH_SERVICE_STATUSES.SUSPENDED}>Suspenso</option>
                </select>
              </label>

              <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>Data inicio</span>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(event) => update("start_date", event.target.value)}
                  required
                />
              </label>

              <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>Prazo (dias)</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.duration_days}
                  onChange={(event) => update("duration_days", event.target.value)}
                  disabled={form.is_duration_indefinite}
                  required={!form.is_duration_indefinite}
                  placeholder={form.is_duration_indefinite ? "Indeterminado" : "Ex: 30"}
                />
              </label>

              <label className={"inline-flex items-center gap-2 self-end rounded-md border border-slate-200 bg-white px-3 py-2 text-xs"}>
                <input
                  type="checkbox"
                  checked={form.is_duration_indefinite}
                  onChange={(event) => update("is_duration_indefinite", event.target.checked)}
                />
                <span>Prazo indeterminado</span>
              </label>
            </div>

            <div className={"grid gap-1.5 rounded-lg border border-slate-200 bg-white p-2"}>
              <label className={"inline-flex items-center gap-2 text-xs"}>
                <input
                  type="checkbox"
                  checked={form.recurrence_enabled}
                  onChange={(event) => toggleRecurrenceEnabled(event.target.checked)}
                />
                <span>Servico recorrente</span>
              </label>
              {form.recurrence_enabled ? (
                <div className={"grid grid-cols-4 gap-1.5 max-[980px]:grid-cols-2"}>
                  {RESEARCH_SERVICE_WEEKDAYS.map((weekday) => (
                    <label key={weekday.id} className={"inline-flex items-center gap-2 text-xs"}>
                      <input
                        type="checkbox"
                        checked={form.recurrence_weekdays.includes(weekday.id)}
                        onChange={() => toggleWeekday(weekday.id)}
                      />
                      <span>{weekday.name}</span>
                    </label>
                  ))}
                </div>
              ) : null}
            </div>

            <div className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
              <span>Produtos por nivel de concorrencia</span>
              {!selectedCluster ? (
                <div className={"rounded-lg border border-dashed border-slate-300 p-2.5 text-xs opacity-75"}>
                  Selecione um cluster para configurar os itens por nivel.
                </div>
              ) : null}
              {selectedCluster && productOptions.length === 0 ? (
                <div className={"rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900"}>
                  Nenhum produto cadastrado para esta conta. Cadastre primeiro em{" "}
                  <Link href="/products/new">/products/new</Link>.
                </div>
              ) : null}
              {selectedCluster && productOptions.length > 0 ? (
                <div className={"grid gap-2 rounded-lg border border-slate-200 bg-white p-2"}>
                  <label className={"inline-flex items-center gap-2 text-xs"}>
                    <input
                      type="checkbox"
                      checked={form.same_product_list_for_all_levels}
                      onChange={(event) => toggleSameListForAllLevels(event.target.checked)}
                    />
                    <span>Usar a mesma lista para todos os niveis</span>
                  </label>

                  {form.same_product_list_for_all_levels ? (
                    <div className={"grid gap-1 rounded-md border border-slate-200 p-2"}>
                      {productOptions.map((product) => (
                        <label key={`service_default_product_${product.id}`} className={"inline-flex items-center gap-2 text-xs"}>
                          <input
                            type="checkbox"
                            checked={form.default_product_ids.includes(String(product.id))}
                            onChange={() => toggleDefaultProduct(product.id)}
                          />
                          <span>
                            {product.name} ({product.ean || "sem EAN"}) - {product.category || "sem categoria"}
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className={"grid gap-2"}>
                      {form.level_product_lists.map((entry) => (
                        <div key={`service_level_${entry.level_id}`} className={"grid gap-1 rounded-md border border-slate-200 p-2"}>
                          <strong>{levelById[String(entry.level_id)]?.name || entry.level_id}</strong>
                          {productOptions.map((product) => (
                            <label key={`service_level_${entry.level_id}_product_${product.id}`} className={"inline-flex items-center gap-2 text-xs"}>
                              <input
                                type="checkbox"
                                checked={(entry.product_ids || []).includes(String(product.id))}
                                onChange={() => toggleLevelProduct(entry.level_id, product.id)}
                              />
                              <span>
                                {product.name} ({product.ean || "sem EAN"}) - {product.category || "sem categoria"}
                              </span>
                            </label>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {error ? <p className={"m-0 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-800"}>{error}</p> : null}
            <div className={"flex flex-wrap gap-2"}>
              <button type="submit" className={"inline-flex cursor-pointer items-center gap-1.5 rounded-md border-0 bg-slate-800 px-2.5 py-2 text-xs text-white"} disabled={saving}>
                {saving ? (
                  <>
                    <span
                      className={"inline-block h-3 w-3 animate-spin rounded-full border border-white border-t-transparent"}
                      aria-hidden="true"
                    />
                    Salvando...
                  </>
                ) : isEdit ? "Salvar alteracoes" : "Criar servico"}
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
