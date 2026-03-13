"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ClusterLevelSection from "../features/dashboard/components/cluster-level-section";
import { toggleValue } from "../features/dashboard/components/form-utils";
import { useDomainActions } from "../features/domain/hooks/use-domain-actions";
import {
  createClusterLevelModel,
  createDefaultClusterLevelsForCluster,
  STORE_KINDS
} from "../features/domain/models";
import { useDomainState } from "../features/domain/state/domain-state";
import {
  selectActiveTenantId,
  selectBannersByTenant,
  selectClusterById,
  selectNetworksByTenant,
  selectStoresByTenant,
  selectTenants
} from "../features/domain/state/selectors";

const INITIAL_FORM = {
  id: "",
  created_at: null,
  tenant_id: "",
  name: "",
  description: "",
  network_id: "",
  banner_id: "",
  own_store_ids: [],
  levels: createDefaultClusterLevelsForCluster(),
  competitor_groups: {}
};

function createForm(activeTenantId = "") {
  return {
    ...INITIAL_FORM,
    tenant_id: activeTenantId || "",
    levels: createDefaultClusterLevelsForCluster()
  };
}

function toFormFromCluster(cluster) {
  const groupsMap = {};
  (cluster.competitor_groups || []).forEach((group) => {
    groupsMap[String(group.level_id)] = (group.store_ids || []).map((id) => String(id));
  });

  return {
    ...createForm(),
    id: String(cluster.id),
    created_at: cluster.created_at || null,
    tenant_id: String(cluster.tenant_id || ""),
    name: cluster.name || "",
    description: cluster.description || "",
    network_id: String(cluster.network_id || ""),
    banner_id: String(cluster.banner_id || ""),
    own_store_ids: (cluster.own_store_ids || []).map((id) => String(id)),
    levels:
      Array.isArray(cluster.levels) && cluster.levels.length > 0
        ? cluster.levels.map((level) => ({
            ...level,
            id: String(level.id)
          }))
        : createDefaultClusterLevelsForCluster(),
    competitor_groups: groupsMap
  };
}

function ClusterFormRuntime({ mode = "create", clusterId = null }) {
  const isEdit = mode === "edit";
  const currentClusterId = clusterId ? String(clusterId) : null;
  const router = useRouter();
  const { state, hydrationDone } = useDomainState();
  const { saveCluster } = useDomainActions();

  const tenants = useMemo(() => selectTenants(state), [state]);
  const activeTenantId = useMemo(() => selectActiveTenantId(state), [state]);
  const clusterToEdit = useMemo(() => {
    if (!isEdit || !currentClusterId) {
      return null;
    }
    return selectClusterById(state, currentClusterId);
  }, [state, isEdit, currentClusterId]);

  const [form, setForm] = useState(() => createForm(activeTenantId));
  const [bootstrapped, setBootstrapped] = useState(!isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const tenantNetworks = useMemo(() => {
    if (!form.tenant_id) {
      return [];
    }
    return selectNetworksByTenant(state, form.tenant_id);
  }, [state, form.tenant_id]);

  const tenantBanners = useMemo(() => {
    if (!form.tenant_id) {
      return [];
    }
    return selectBannersByTenant(state, form.tenant_id);
  }, [state, form.tenant_id]);

  const tenantStores = useMemo(() => {
    if (!form.tenant_id) {
      return [];
    }
    return selectStoresByTenant(state, form.tenant_id);
  }, [state, form.tenant_id]);

  const tenantLevels = useMemo(
    () =>
      [...(form.levels || [])].sort(
        (a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0) || a.name.localeCompare(b.name)
      ),
    [form.levels]
  );

  const bannerOptions = useMemo(
    () => tenantBanners.filter((banner) => String(banner.network_id) === String(form.network_id)),
    [tenantBanners, form.network_id]
  );

  const ownStoreOptions = useMemo(
    () =>
      tenantStores.filter(
        (store) =>
          store.kind === STORE_KINDS.OWN &&
          (!form.network_id || String(store.network_id) === String(form.network_id)) &&
          (!form.banner_id || String(store.banner_id) === String(form.banner_id))
      ),
    [tenantStores, form.network_id, form.banner_id]
  );

  const competitorOptions = useMemo(
    () => tenantStores.filter((store) => store.kind === STORE_KINDS.COMPETITOR),
    [tenantStores]
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
    if (!isEdit || !clusterToEdit) {
      return;
    }
    setForm(toFormFromCluster(clusterToEdit));
    setBootstrapped(true);
  }, [isEdit, clusterToEdit]);

  function update(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value
    }));
  }

  function updateTenant(tenantId) {
    const isSameTenant = tenantId === form.tenant_id;
    setForm((prev) => ({
      ...prev,
      tenant_id: tenantId,
      network_id: isSameTenant ? prev.network_id : "",
      banner_id: isSameTenant ? prev.banner_id : "",
      own_store_ids: isSameTenant ? prev.own_store_ids : [],
      levels: isSameTenant ? prev.levels : createDefaultClusterLevelsForCluster(),
      competitor_groups: isSameTenant ? prev.competitor_groups : {}
    }));
  }

  function updateNetwork(networkId) {
    setForm((prev) => ({
      ...prev,
      network_id: networkId,
      banner_id: networkId === prev.network_id ? prev.banner_id : "",
      own_store_ids: networkId === prev.network_id ? prev.own_store_ids : []
    }));
  }

  function updateBanner(bannerId) {
    setForm((prev) => ({
      ...prev,
      banner_id: bannerId,
      own_store_ids: bannerId === prev.banner_id ? prev.own_store_ids : []
    }));
  }

  function toggleOwnStore(storeId) {
    setForm((prev) => ({
      ...prev,
      own_store_ids: toggleValue(prev.own_store_ids, storeId)
    }));
  }

  function toggleCompetitor(levelId, storeId) {
    setForm((prev) => {
      const current = prev.competitor_groups[String(levelId)] || [];
      return {
        ...prev,
        competitor_groups: {
          ...prev.competitor_groups,
          [String(levelId)]: toggleValue(current, storeId)
        }
      };
    });
  }

  function saveLevel(values) {
    const level = createClusterLevelModel(values);
    const alreadyUsed = (form.levels || []).some(
      (item) =>
        String(item.code).toUpperCase() === String(level.code).toUpperCase() &&
        String(item.id) !== String(level.id)
    );
    if (alreadyUsed) {
      throw new Error("Ja existe um nivel com esse codigo no cluster.");
    }

    setForm((prev) => {
      const nextLevels = [...(prev.levels || [])];
      const existingIndex = nextLevels.findIndex((item) => String(item.id) === String(level.id));
      if (existingIndex >= 0) {
        nextLevels[existingIndex] = {
          ...nextLevels[existingIndex],
          ...level
        };
      } else {
        nextLevels.push(level);
      }

      nextLevels.sort(
        (a, b) =>
          Number(a.sort_order || 0) - Number(b.sort_order || 0) || a.name.localeCompare(b.name)
      );

      return {
        ...prev,
        levels: nextLevels
      };
    });
  }

  function deleteLevel(levelId) {
    const level = (form.levels || []).find((item) => String(item.id) === String(levelId));
    if (level?.is_system) {
      throw new Error("Niveis padrao nao podem ser removidos.");
    }

    setForm((prev) => {
      const nextCompetitorGroups = { ...prev.competitor_groups };
      delete nextCompetitorGroups[String(levelId)];

      return {
        ...prev,
        levels: (prev.levels || []).filter((item) => String(item.id) !== String(levelId)),
        competitor_groups: nextCompetitorGroups
      };
    });
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (isEdit && !clusterToEdit) {
        throw new Error("Cluster nao encontrado para edicao.");
      }

      const competitorGroups = Object.entries(form.competitor_groups)
        .map(([levelId, storeIds]) => ({
          level_id: levelId,
          store_ids: (storeIds || []).map((id) => String(id))
        }))
        .filter((group) => group.store_ids.length > 0);

      saveCluster({
        ...form,
        tenant_id: form.tenant_id,
        network_id: form.network_id,
        banner_id: form.banner_id,
        own_store_ids: form.own_store_ids,
        levels: form.levels,
        competitor_groups: competitorGroups
      });
      router.replace("/dashboard");
    } catch (err) {
      setError(err?.message || "Falha ao salvar cluster.");
    } finally {
      setSaving(false);
    }
  }

  if (isEdit && !hydrationDone) {
    return (
      <main className={"min-h-screen p-6 text-slate-900 bg-[radial-gradient(circle_at_12%_10%,rgba(255,208,82,0.18),transparent_32%),radial-gradient(circle_at_85%_90%,rgba(37,99,235,0.16),transparent_40%),linear-gradient(180deg,#f7f7f8_0%,#f0f2f5_100%)]"}>
        <div className={"mx-auto grid max-w-[1440px] gap-4"}>
          <section className={"grid gap-2.5 rounded-xl border border-slate-900/10 bg-white/90 p-[14px]"}>
            <h2 className={"m-0 text-lg"}>Carregando cluster...</h2>
          </section>
        </div>
      </main>
    );
  }

  if (isEdit && hydrationDone && !clusterToEdit) {
    return (
      <main className={"min-h-screen p-6 text-slate-900 bg-[radial-gradient(circle_at_12%_10%,rgba(255,208,82,0.18),transparent_32%),radial-gradient(circle_at_85%_90%,rgba(37,99,235,0.16),transparent_40%),linear-gradient(180deg,#f7f7f8_0%,#f0f2f5_100%)]"}>
        <div className={"mx-auto grid max-w-[1440px] gap-4"}>
          <section className={"grid gap-2.5 rounded-xl border border-slate-900/10 bg-white/90 p-[14px]"}>
            <h2 className={"m-0 text-lg"}>Cluster nao encontrado</h2>
            <p className={"m-0 text-xs opacity-70"}>O cluster foi removido ou o ID informado e invalido.</p>
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
            <h1 className={"m-0 text-[30px] tracking-[0.5px]"}>{isEdit ? "Editar Cluster" : "Criar Cluster"}</h1>
            <p className={"mb-0 mt-1 text-sm [opacity:0.85]"}>
              Cluster agrupa lojas proprias de uma bandeira e concorrentes por nivel.
            </p>
            <p className={"mb-0 mt-1 text-sm [opacity:0.85]"}>
              Os niveis de concorrencia da conta podem ser ajustados nesta mesma pagina.
            </p>
          </div>
          <div className={"flex flex-wrap items-center gap-2"}>
            <Link href="/dashboard" className={"inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2.5 text-[13px] text-white no-underline"}>
              Voltar ao dashboard
            </Link>
          </div>
        </header>

        <section className={"grid gap-2.5 rounded-xl border border-slate-900/10 bg-white/90 p-[14px]"}>
          <h2 className={"m-0 text-lg"}>Formulario de Cluster</h2>
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
                <span>Nome do cluster</span>
                <input
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Ex: Cluster ABC"
                  required
                />
              </label>
              <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>Rede</span>
                <select
                  value={form.network_id}
                  onChange={(e) => updateNetwork(e.target.value)}
                  disabled={!form.tenant_id || tenantNetworks.length === 0}
                  required
                >
                  <option value="">Selecione...</option>
                  {tenantNetworks.map((network) => (
                    <option key={network.id} value={network.id}>
                      {network.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className={"grid grid-cols-2 gap-2 max-[980px]:grid-cols-1"}>
              <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>Bandeira</span>
                <select
                  value={form.banner_id}
                  onChange={(e) => updateBanner(e.target.value)}
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
              {isEdit ? (
                <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                  <span>ID do cluster</span>
                  <input value={form.id} readOnly />
                </label>
              ) : null}
            </div>

            <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
              <span>Descricao</span>
              <textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Opcional"
              />
            </label>

            <div className={"grid grid-cols-2 gap-2 max-[980px]:grid-cols-1"}>
              <div className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>Lojas proprias da bandeira</span>
                <div className={"grid max-h-[150px] gap-1.5 overflow-auto rounded-lg border border-slate-200 bg-white p-2"}>
                  {ownStoreOptions.length === 0 ? (
                    <div className={"rounded-lg border border-dashed border-slate-300 p-2.5 text-xs opacity-75"}>Sem lojas proprias para essa rede/bandeira.</div>
                  ) : (
                    ownStoreOptions.map((store) => (
                      <label key={store.id} className={"flex items-center gap-2 text-xs"}>
                        <input
                          type="checkbox"
                          checked={form.own_store_ids.includes(String(store.id))}
                          onChange={() => toggleOwnStore(store.id)}
                        />
                        <span>{store.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
              <div className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
                <span>Concorrentes por nivel</span>
                <div className={"grid gap-2"}>
                  {tenantLevels.map((level) => (
                    <div key={level.id} className={"grid max-h-[150px] gap-1.5 overflow-auto rounded-lg border border-slate-200 bg-white p-2"}>
                      <strong style={{ fontSize: 12 }}>{level.name}</strong>
                      {competitorOptions.length === 0 ? (
                        <div className={"rounded-lg border border-dashed border-slate-300 p-2.5 text-xs opacity-75"}>Sem lojas concorrentes.</div>
                      ) : (
                        competitorOptions.map((store) => (
                          <label key={`${level.id}_${store.id}`} className={"flex items-center gap-2 text-xs"}>
                            <input
                              type="checkbox"
                              checked={(form.competitor_groups[String(level.id)] || []).includes(
                                String(store.id)
                              )}
                              onChange={() => toggleCompetitor(level.id, store.id)}
                            />
                            <span>{store.name}</span>
                          </label>
                        ))
                      )}
                    </div>
                  ))}
                </div>
              </div>
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
                ) : isEdit ? "Salvar alteracoes" : "Criar cluster"}
              </button>
            </div>
          </form>
        </section>

        <ClusterLevelSection
          enabled={Boolean(form.tenant_id)}
          levels={tenantLevels}
          onSave={saveLevel}
          onDelete={deleteLevel}
        />
      </div>
    </main>
  );
}

export default function ClusterFormApp({ mode = "create", clusterId = null }) {
  return <ClusterFormRuntime mode={mode} clusterId={clusterId} />;
}


