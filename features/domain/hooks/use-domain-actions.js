"use client";

import { useCallback } from "react";
import {
  createClusterModel,
  createNetworkModel,
  createProductModel,
  createPriceResearchModel,
  createRetailBannerModel,
  createStoreModel,
  createTenantModel,
  STORE_KINDS
} from "../models";
import {
  DOMAIN_DELETE_BANNER,
  DOMAIN_DELETE_CLUSTER,
  DOMAIN_DELETE_NETWORK,
  DOMAIN_DELETE_PRODUCT,
  DOMAIN_DELETE_PRICE_RESEARCH,
  DOMAIN_DELETE_STORE,
  DOMAIN_DELETE_TENANT,
  DOMAIN_SET_ACTIVE_TENANT,
  DOMAIN_UPSERT_BANNER,
  DOMAIN_UPSERT_CLUSTER,
  DOMAIN_UPSERT_NETWORK,
  DOMAIN_UPSERT_PRODUCT,
  DOMAIN_UPSERT_PRICE_RESEARCH,
  DOMAIN_UPSERT_EVENT,
  DOMAIN_UPSERT_RESEARCH_SCHEDULE,
  DOMAIN_UPSERT_RESEARCH_TASK,
  DOMAIN_UPSERT_STORE,
  DOMAIN_UPSERT_TENANT
} from "../state/action-types";
import { syncResearchServiceSchedulesForCurrentMonth } from "../services/research-scheduler";
import { useDomainState } from "../state/domain-state";
import {
  selectClusterById,
  selectClustersByTenant,
  selectNetworksByTenant,
  selectPriceResearchById,
  selectEventsByService,
  selectEventsByTenant,
  selectProductsByTenant,
  selectPriceResearchesByTenant,
  selectResearchSchedulesByService,
  selectResearchSchedulesByTenant,
  selectResearchTasksByService,
  selectResearchTasksByTenant,
  selectStoresByTenant,
  selectBannersByTenant,
  selectStoreById
} from "../state/selectors";

const SNAPSHOT_VERSION = 1;

function buildId(prefix = "id") {
  const random = Math.floor(Math.random() * 1_000_000)
    .toString(36)
    .padStart(4, "0");
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeSchedulerActor(actorInput = null) {
  if (typeof actorInput === "string" && actorInput.trim()) {
    return actorInput.trim();
  }

  const actor = actorInput && typeof actorInput === "object" ? actorInput : {};
  const fromEmail = String(actor.email || "").trim();
  if (fromEmail) {
    return fromEmail;
  }
  const fromUsername = String(actor.username || "").trim();
  if (fromUsername) {
    return fromUsername;
  }
  const fromUid = String(actor.uid || actor.id || "").trim();
  if (fromUid) {
    return fromUid;
  }
  return "system";
}

function isDateInYearMonth(dateYmd, year, month) {
  const match = String(dateYmd || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return false;
  }
  return Number(match[1]) === Number(year) && Number(match[2]) === Number(month);
}

function makeEventKey(payload = {}) {
  return [
    String(payload.research_service_id || ""),
    String(payload.date || ""),
    String(payload.place_id || ""),
    String(payload.level_id || "")
  ].join("|");
}

function toBatchItems(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && Array.isArray(payload.items)) {
    return payload.items;
  }
  throw new Error("Arquivo JSON invalido. Use um array ou objeto com campo items[].");
}

function runBatch(items, callback) {
  const list = Array.isArray(items) ? items : [];
  let successCount = 0;
  const errors = [];

  list.forEach((item, index) => {
    try {
      callback(item, index);
      successCount += 1;
    } catch (error) {
      errors.push({
        index,
        message: error?.message || "Erro desconhecido"
      });
    }
  });

  return {
    total: list.length,
    success: successCount,
    failed: errors.length,
    errors
  };
}

function ensureTenantExists(state, tenantId) {
  const found = (state.tenants || []).some((item) => String(item.id) === String(tenantId));
  if (!found) {
    throw new Error("Tenant informado nao existe.");
  }
}

function ensureNetworkExists(state, networkId, tenantId) {
  const network = (state.networks || []).find((item) => String(item.id) === String(networkId));
  if (!network) {
    throw new Error("Rede informada nao existe.");
  }
  if (String(network.tenant_id) !== String(tenantId)) {
    throw new Error("Rede informada nao pertence ao tenant.");
  }
  return network;
}

function ensureBannerExists(state, bannerId, tenantId) {
  const banner = (state.retailBanners || []).find((item) => String(item.id) === String(bannerId));
  if (!banner) {
    throw new Error("Bandeira informada nao existe.");
  }
  if (String(banner.tenant_id) !== String(tenantId)) {
    throw new Error("Bandeira informada nao pertence ao tenant.");
  }
  return banner;
}

function getClusterLevelIds(cluster) {
  return new Set((cluster?.levels || []).map((level) => String(level.id)));
}

function normalizeResearchLevelProductLists(research) {
  return (research?.level_product_lists || []).map((entry) => ({
    level_id: String(entry?.level_id || ""),
    product_ids: (entry?.product_ids || []).map((productId) => String(productId))
  }));
}

function getAllProductIdsFromResearch(research) {
  return [
    ...(research?.default_product_ids || []),
    ...(research?.level_product_lists || []).flatMap((entry) => entry.product_ids || [])
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);
}

function normalizeComparableName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function validateImportTenantSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object") {
    throw new Error("Arquivo de backup invalido.");
  }
  if (!snapshot.tenant || typeof snapshot.tenant !== "object") {
    throw new Error("Backup sem tenant principal.");
  }
  if (!Array.isArray(snapshot.networks)) {
    throw new Error("Backup sem lista de redes valida.");
  }
  if (!Array.isArray(snapshot.retailBanners)) {
    throw new Error("Backup sem lista de bandeiras valida.");
  }
  if (!Array.isArray(snapshot.stores)) {
    throw new Error("Backup sem lista de lojas valida.");
  }
  if (!Array.isArray(snapshot.clusters)) {
    throw new Error("Backup sem lista de clusters valida.");
  }
  if (!Array.isArray(snapshot.priceResearches)) {
    throw new Error("Backup sem lista de pesquisas valida.");
  }
  if (snapshot.products !== undefined && !Array.isArray(snapshot.products)) {
    throw new Error("Backup sem lista de produtos valida.");
  }
  if (snapshot.researchSchedules !== undefined && !Array.isArray(snapshot.researchSchedules)) {
    throw new Error("Backup sem lista de agendas de pesquisa valida.");
  }
  if (snapshot.researchTasks !== undefined && !Array.isArray(snapshot.researchTasks)) {
    throw new Error("Backup sem lista de tarefas de pesquisa valida.");
  }
  if (snapshot.events !== undefined && !Array.isArray(snapshot.events)) {
    throw new Error("Backup sem lista de eventos valida.");
  }
}

export function useDomainActions() {
  const { state, dispatch } = useDomainState();

  const setActiveTenant = useCallback(
    (tenantId) => {
      dispatch({ type: DOMAIN_SET_ACTIVE_TENANT, payload: tenantId || null });
    },
    [dispatch]
  );

  const saveTenant = useCallback(
    (values) => {
      const tenant = createTenantModel(values);
      dispatch({ type: DOMAIN_UPSERT_TENANT, payload: tenant });
      return tenant;
    },
    [dispatch]
  );

  const removeTenant = useCallback(
    (tenantId) => {
      dispatch({ type: DOMAIN_DELETE_TENANT, payload: tenantId });
    },
    [dispatch]
  );

  const saveNetwork = useCallback(
    (values) => {
      const network = createNetworkModel(values);
      ensureTenantExists(state, network.tenant_id);
      dispatch({ type: DOMAIN_UPSERT_NETWORK, payload: network });
      return network;
    },
    [dispatch, state]
  );

  const removeNetwork = useCallback(
    (networkId) => {
      dispatch({ type: DOMAIN_DELETE_NETWORK, payload: networkId });
    },
    [dispatch]
  );

  const saveRetailBanner = useCallback(
    (values) => {
      const banner = createRetailBannerModel(values);
      ensureTenantExists(state, banner.tenant_id);
      ensureNetworkExists(state, banner.network_id, banner.tenant_id);
      dispatch({ type: DOMAIN_UPSERT_BANNER, payload: banner });
      return banner;
    },
    [dispatch, state]
  );

  const removeRetailBanner = useCallback(
    (bannerId) => {
      dispatch({ type: DOMAIN_DELETE_BANNER, payload: bannerId });
    },
    [dispatch]
  );

  const saveStore = useCallback(
    (values) => {
      const store = createStoreModel(values);
      ensureTenantExists(state, store.tenant_id);
      const network = ensureNetworkExists(state, store.network_id, store.tenant_id);

      if (store.kind === STORE_KINDS.OWN) {
        const banner = ensureBannerExists(state, store.banner_id, store.tenant_id);
        if (String(banner.network_id) !== String(network.id)) {
          throw new Error("A bandeira deve pertencer a rede da loja.");
        }
      }

      if (store.kind === STORE_KINDS.COMPETITOR) {
        const competitorBannerName = normalizeComparableName(store.competitor_banner_name);
        const networkBannerNames = (state.retailBanners || [])
          .filter(
            (item) =>
              String(item.tenant_id) === String(store.tenant_id) &&
              String(item.network_id) === String(store.network_id)
          )
          .map((item) => normalizeComparableName(item.name));

        if (networkBannerNames.includes(competitorBannerName)) {
          throw new Error(
            "Loja concorrente deve usar bandeira diferente das bandeiras cadastradas na rede."
          );
        }
      }

      dispatch({ type: DOMAIN_UPSERT_STORE, payload: store });
      return store;
    },
    [dispatch, state]
  );

  const removeStore = useCallback(
    (storeId) => {
      dispatch({ type: DOMAIN_DELETE_STORE, payload: storeId });
    },
    [dispatch]
  );

  const saveCluster = useCallback(
    (values) => {
      const cluster = createClusterModel(values);
      ensureTenantExists(state, cluster.tenant_id);
      const network = ensureNetworkExists(state, cluster.network_id, cluster.tenant_id);
      const banner = ensureBannerExists(state, cluster.banner_id, cluster.tenant_id);
      if (String(banner.network_id) !== String(network.id)) {
        throw new Error("A bandeira do cluster deve pertencer a rede selecionada.");
      }

      const ownStores = cluster.own_store_ids.map((id) => selectStoreById(state, id));
      const hasInvalidOwnStore = ownStores.some(
        (store) =>
          !store ||
          store.kind !== STORE_KINDS.OWN ||
          String(store.tenant_id) !== String(cluster.tenant_id) ||
          String(store.network_id) !== String(cluster.network_id) ||
          String(store.banner_id) !== String(cluster.banner_id)
      );
      if (hasInvalidOwnStore) {
        throw new Error("Lojas proprias do cluster precisam ser da rede/bandeira selecionadas.");
      }
      if (cluster.own_store_ids.length === 0) {
        throw new Error("Cluster deve possuir ao menos 1 loja propria.");
      }

      const levelIds = new Set((cluster.levels || []).map((level) => String(level.id)));
      if (levelIds.size === 0) {
        throw new Error("Cluster deve possuir niveis de concorrencia.");
      }
      const hasInvalidLevel = (cluster.competitor_groups || []).some(
        (group) => !levelIds.has(String(group.level_id))
      );
      if (hasInvalidLevel) {
        throw new Error("Cluster possui nivel concorrente invalido.");
      }

      const competitorStoreIds = (cluster.competitor_groups || []).flatMap((group) => group.store_ids || []);
      const hasInvalidCompetitor = competitorStoreIds.some((storeId) => {
        const store = selectStoreById(state, storeId);
        return (
          !store ||
          store.kind !== STORE_KINDS.COMPETITOR ||
          String(store.tenant_id) !== String(cluster.tenant_id)
        );
      });
      if (hasInvalidCompetitor) {
        throw new Error("Cluster possui loja concorrente invalida.");
      }

      dispatch({ type: DOMAIN_UPSERT_CLUSTER, payload: cluster });
      return cluster;
    },
    [dispatch, state]
  );

  const removeCluster = useCallback(
    (clusterId) => {
      dispatch({ type: DOMAIN_DELETE_CLUSTER, payload: clusterId });
    },
    [dispatch]
  );

  const savePriceResearch = useCallback(
    (values) => {
      ensureTenantExists(state, values?.tenant_id);
      const cluster = selectClusterById(state, values?.cluster_id);
      if (!cluster) {
        throw new Error("Cluster do servico nao existe.");
      }
      if (String(cluster.tenant_id) !== String(values?.tenant_id)) {
        throw new Error("Cluster do servico nao pertence ao tenant.");
      }

      const clusterLevelIds = [...getClusterLevelIds(cluster)];
      if (clusterLevelIds.length === 0) {
        throw new Error("Cluster do servico nao possui niveis de concorrencia.");
      }

      const research = createPriceResearchModel({
        ...values,
        level_ids: clusterLevelIds
      });

      const validLevelIds = getClusterLevelIds(cluster);
      const normalizedLevelLists = normalizeResearchLevelProductLists(research);
      const hasInvalidLevel = normalizedLevelLists.some(
        (entry) => !entry.level_id || !validLevelIds.has(entry.level_id)
      );
      if (hasInvalidLevel) {
        throw new Error("Servico possui nivel de concorrencia invalido para o cluster.");
      }

      const tenantProductIds = new Set(
        selectProductsByTenant(state, research.tenant_id).map((product) => String(product.id))
      );
      if (tenantProductIds.size === 0) {
        throw new Error("Cadastre produtos antes de criar o servico de pesquisa.");
      }

      const productIds = getAllProductIdsFromResearch(research);
      const hasInvalidProduct = productIds.some((productId) => !tenantProductIds.has(String(productId)));
      if (hasInvalidProduct) {
        throw new Error("Servico possui produto inexistente no tenant.");
      }

      dispatch({ type: DOMAIN_UPSERT_PRICE_RESEARCH, payload: research });
      return research;
    },
    [dispatch, state]
  );

  const removePriceResearch = useCallback(
    (researchId) => {
      dispatch({ type: DOMAIN_DELETE_PRICE_RESEARCH, payload: researchId });
    },
    [dispatch]
  );

  const runResearchSchedulerForServiceMonth = useCallback(
    (researchId, referenceDateInput = null, actorInput = null) => {
      const serviceId = String(researchId || "");
      if (!serviceId) {
        throw new Error("Informe o ID do servico de pesquisa.");
      }

      const research = selectPriceResearchById(state, serviceId);
      if (!research) {
        throw new Error("Servico de pesquisa nao encontrado.");
      }

      ensureTenantExists(state, research.tenant_id);
      const cluster = selectClusterById(state, research.cluster_id);
      if (!cluster) {
        throw new Error("Cluster do servico nao encontrado.");
      }

      const referenceDate =
        referenceDateInput instanceof Date
          ? referenceDateInput
          : referenceDateInput
            ? new Date(referenceDateInput)
            : new Date();
      const effectiveReferenceDate = Number.isNaN(referenceDate.getTime()) ? new Date() : referenceDate;
      const year = effectiveReferenceDate.getFullYear();
      const month = effectiveReferenceDate.getMonth() + 1;

      const result = syncResearchServiceSchedulesForCurrentMonth({
        research,
        cluster,
        stores: selectStoresByTenant(state, research.tenant_id),
        products: selectProductsByTenant(state, research.tenant_id),
        existingSchedules: selectResearchSchedulesByService(state, serviceId),
        existingTasks: selectResearchTasksByService(state, serviceId),
        referenceDate: effectiveReferenceDate
      });
      const actor = normalizeSchedulerActor(actorInput);
      const timestamp = nowIso();
      const existingEventsByKey = new Map(
        selectEventsByService(state, serviceId)
          .filter((event) => isDateInYearMonth(event.date, year, month))
          .map((event) => [makeEventKey(event), event])
      );

      result.schedulesToUpsert.forEach((schedule) => {
        dispatch({ type: DOMAIN_UPSERT_RESEARCH_SCHEDULE, payload: schedule });
      });
      result.tasksToUpsert.forEach((task) => {
        dispatch({ type: DOMAIN_UPSERT_RESEARCH_TASK, payload: task });
      });

      result.records.forEach((entry) => {
        const schedule = entry?.schedule || null;
        if (!schedule) {
          return;
        }

        const task = entry?.task || null;
        const key = makeEventKey({
          research_service_id: serviceId,
          date: schedule.date,
          place_id: schedule.place_id,
          level_id: schedule.level_id
        });
        const existingEvent = existingEventsByKey.get(key) || null;
        const payload = {
          id: existingEvent?.id || buildId("event"),
          tenant_id: research.tenant_id,
          research_service_id: serviceId,
          research_schedule_id: schedule.id || null,
          research_task_id: task?.id || schedule?.research_task_id || existingEvent?.research_task_id || null,
          cluster_id: research.cluster_id,
          level_id: schedule.level_id || task?.level_id || null,
          place_id: schedule.place_id || task?.place_id || null,
          date: schedule.date || null,
          due_date: schedule.due_date || schedule.date || null,
          status: schedule.status || task?.status || existingEvent?.status || "PENDING",
          list_id: schedule.list_id || existingEvent?.list_id || null,
          list_items_count: schedule.list_items_count || existingEvent?.list_items_count || 0,
          value:
            schedule.value !== null && schedule.value !== undefined
              ? schedule.value
              : existingEvent?.value !== null && existingEvent?.value !== undefined
                ? existingEvent.value
                : 200,
          created_by: existingEvent?.created_by || actor,
          created_at: existingEvent?.created_at || timestamp,
          updated_by: actor,
          updated_at: timestamp
        };

        dispatch({ type: DOMAIN_UPSERT_EVENT, payload });
      });

      return {
        records: result.records,
        total: result.records.length,
        created: result.createdCount,
        existing: result.existingCount,
        month,
        year
      };
    },
    [dispatch, state]
  );

  const saveProduct = useCallback(
    (values) => {
      const product = createProductModel(values);
      ensureTenantExists(state, product.tenant_id);
      dispatch({ type: DOMAIN_UPSERT_PRODUCT, payload: product });
      return product;
    },
    [dispatch, state]
  );

  const removeProduct = useCallback(
    (productId) => {
      dispatch({ type: DOMAIN_DELETE_PRODUCT, payload: productId });
    },
    [dispatch]
  );

  const exportTenantSnapshot = useCallback(
    (tenantIdInput) => {
      const tenantId = tenantIdInput || state.meta?.activeTenantId;
      ensureTenantExists(state, tenantId);
      const tenant = (state.tenants || []).find((item) => String(item.id) === String(tenantId));
      const clusters = selectClustersByTenant(state, tenantId);

      const payload = {
        schema_version: SNAPSHOT_VERSION,
        exported_at: new Date().toISOString(),
        tenant,
        networks: selectNetworksByTenant(state, tenantId),
        retailBanners: selectBannersByTenant(state, tenantId),
        stores: selectStoresByTenant(state, tenantId),
        clusterLevels: [],
        clusters,
        priceResearches: selectPriceResearchesByTenant(state, tenantId),
        products: selectProductsByTenant(state, tenantId),
        researchSchedules: selectResearchSchedulesByTenant(state, tenantId),
        researchTasks: selectResearchTasksByTenant(state, tenantId),
        events: selectEventsByTenant(state, tenantId)
      };

      return payload;
    },
    [state]
  );

  const exportTenantsDataset = useCallback(() => {
    return {
      schema_version: SNAPSHOT_VERSION,
      dataset: "tenants",
      exported_at: new Date().toISOString(),
      items: state.tenants || []
    };
  }, [state.tenants]);

  const exportNetworksDataset = useCallback(
    (tenantIdInput) => {
      const tenantId = tenantIdInput || state.meta?.activeTenantId;
      ensureTenantExists(state, tenantId);
      return {
        schema_version: SNAPSHOT_VERSION,
        dataset: "networks",
        tenant_id: tenantId,
        exported_at: new Date().toISOString(),
        items: selectNetworksByTenant(state, tenantId)
      };
    },
    [state]
  );

  const exportRetailBannersDataset = useCallback(
    (tenantIdInput) => {
      const tenantId = tenantIdInput || state.meta?.activeTenantId;
      ensureTenantExists(state, tenantId);
      return {
        schema_version: SNAPSHOT_VERSION,
        dataset: "retail_banners",
        tenant_id: tenantId,
        exported_at: new Date().toISOString(),
        items: selectBannersByTenant(state, tenantId)
      };
    },
    [state]
  );

  const exportStoresDataset = useCallback(
    (tenantIdInput, kind = null) => {
      const tenantId = tenantIdInput || state.meta?.activeTenantId;
      ensureTenantExists(state, tenantId);
      const items = selectStoresByTenant(state, tenantId).filter((store) =>
        kind ? store.kind === kind : true
      );

      return {
        schema_version: SNAPSHOT_VERSION,
        dataset: kind === STORE_KINDS.COMPETITOR ? "competitor_stores" : kind === STORE_KINDS.OWN ? "own_stores" : "stores",
        tenant_id: tenantId,
        exported_at: new Date().toISOString(),
        items
      };
    },
    [state]
  );

  const exportPriceResearchesDataset = useCallback(
    (tenantIdInput) => {
      const tenantId = tenantIdInput || state.meta?.activeTenantId;
      ensureTenantExists(state, tenantId);
      return {
        schema_version: SNAPSHOT_VERSION,
        dataset: "price_researches",
        tenant_id: tenantId,
        exported_at: new Date().toISOString(),
        items: selectPriceResearchesByTenant(state, tenantId)
      };
    },
    [state]
  );

  const exportProductsDataset = useCallback(
    (tenantIdInput) => {
      const tenantId = tenantIdInput || state.meta?.activeTenantId;
      ensureTenantExists(state, tenantId);
      return {
        schema_version: SNAPSHOT_VERSION,
        dataset: "products",
        tenant_id: tenantId,
        exported_at: new Date().toISOString(),
        items: selectProductsByTenant(state, tenantId)
      };
    },
    [state]
  );

  const saveTenantsBatch = useCallback(
    (payload) => {
      const items = toBatchItems(payload);
      return runBatch(items, (item) => {
        saveTenant(item);
      });
    },
    [saveTenant]
  );

  const saveNetworksBatch = useCallback(
    (tenantIdInput, payload) => {
      const tenantId = tenantIdInput || state.meta?.activeTenantId;
      ensureTenantExists(state, tenantId);
      const items = toBatchItems(payload);
      return runBatch(items, (item) => {
        saveNetwork({ ...item, tenant_id: tenantId });
      });
    },
    [saveNetwork, state]
  );

  const saveRetailBannersBatch = useCallback(
    (tenantIdInput, payload) => {
      const tenantId = tenantIdInput || state.meta?.activeTenantId;
      ensureTenantExists(state, tenantId);
      const items = toBatchItems(payload);
      return runBatch(items, (item) => {
        saveRetailBanner({ ...item, tenant_id: tenantId });
      });
    },
    [saveRetailBanner, state]
  );

  const saveStoresBatch = useCallback(
    (tenantIdInput, payload, kindOverride = null) => {
      const tenantId = tenantIdInput || state.meta?.activeTenantId;
      ensureTenantExists(state, tenantId);
      const items = toBatchItems(payload);
      return runBatch(items, (item) => {
        saveStore({
          ...item,
          tenant_id: tenantId,
          kind: kindOverride || item.kind || STORE_KINDS.OWN
        });
      });
    },
    [saveStore, state]
  );

  const savePriceResearchesBatch = useCallback(
    (tenantIdInput, payload) => {
      const tenantId = tenantIdInput || state.meta?.activeTenantId;
      ensureTenantExists(state, tenantId);
      const items = toBatchItems(payload);
      return runBatch(items, (item) => {
        savePriceResearch({ ...item, tenant_id: tenantId });
      });
    },
    [savePriceResearch, state]
  );

  const saveProductsBatch = useCallback(
    (tenantIdInput, payload) => {
      const tenantId = tenantIdInput || state.meta?.activeTenantId;
      ensureTenantExists(state, tenantId);
      const items = toBatchItems(payload);
      return runBatch(items, (item) => {
        saveProduct({ ...item, tenant_id: tenantId });
      });
    },
    [saveProduct, state]
  );

  const importTenantSnapshot = useCallback(
    (snapshotInput) => {
      validateImportTenantSnapshot(snapshotInput);

      const importedTenant = createTenantModel(snapshotInput.tenant);
      const tenantId = importedTenant.id;

      const networks = snapshotInput.networks.map((item) =>
        createNetworkModel({ ...item, tenant_id: tenantId })
      );
      const networkIds = new Set(networks.map((item) => String(item.id)));

      const banners = snapshotInput.retailBanners.map((item) =>
        createRetailBannerModel({ ...item, tenant_id: tenantId })
      );
      const hasBannerOutOfNetwork = banners.some((item) => !networkIds.has(String(item.network_id)));
      if (hasBannerOutOfNetwork) {
        throw new Error("Backup possui bandeira vinculada a rede inexistente.");
      }
      const bannerIds = new Set(banners.map((item) => String(item.id)));

      const stores = snapshotInput.stores.map((item) =>
        createStoreModel({ ...item, tenant_id: tenantId })
      );
      const hasStoreOutOfNetwork = stores.some((item) => !networkIds.has(String(item.network_id)));
      if (hasStoreOutOfNetwork) {
        throw new Error("Backup possui loja vinculada a rede inexistente.");
      }
      const hasStoreOutOfBanner = stores.some(
        (item) => item.kind === STORE_KINDS.OWN && !bannerIds.has(String(item.banner_id))
      );
      if (hasStoreOutOfBanner) {
        throw new Error("Backup possui loja vinculada a bandeira inexistente.");
      }
      const bannerNamesByNetwork = new Map();
      banners.forEach((banner) => {
        const key = String(banner.network_id);
        const current = bannerNamesByNetwork.get(key) || new Set();
        current.add(normalizeComparableName(banner.name));
        bannerNamesByNetwork.set(key, current);
      });
      const hasCompetitorUsingOwnBanner = stores.some((item) => {
        if (item.kind !== STORE_KINDS.COMPETITOR) {
          return false;
        }
        const networkBannerNames = bannerNamesByNetwork.get(String(item.network_id)) || new Set();
        return networkBannerNames.has(normalizeComparableName(item.competitor_banner_name));
      });
      if (hasCompetitorUsingOwnBanner) {
        throw new Error(
          "Backup possui loja concorrente com bandeira igual a uma bandeira cadastrada na rede."
        );
      }
      const storeMap = new Map(stores.map((item) => [String(item.id), item]));

      const legacyClusterLevels = Array.isArray(snapshotInput.clusterLevels)
        ? snapshotInput.clusterLevels
        : [];

      const clusters = snapshotInput.clusters.map((item) => {
        const hasOwnLevels = Array.isArray(item?.levels) && item.levels.length > 0;
        return createClusterModel({
          ...item,
          tenant_id: tenantId,
          levels: hasOwnLevels ? item.levels : legacyClusterLevels
        });
      });

      clusters.forEach((cluster) => {
        if (!networkIds.has(String(cluster.network_id))) {
          throw new Error("Backup possui cluster vinculado a rede inexistente.");
        }
        if (!bannerIds.has(String(cluster.banner_id))) {
          throw new Error("Backup possui cluster vinculado a bandeira inexistente.");
        }

        if (!cluster.own_store_ids?.length) {
          throw new Error("Backup possui cluster sem lojas proprias.");
        }

        cluster.own_store_ids.forEach((storeId) => {
          const store = storeMap.get(String(storeId));
          if (!store || store.kind !== STORE_KINDS.OWN) {
            throw new Error("Backup possui cluster com loja propria invalida.");
          }
          if (String(store.network_id) !== String(cluster.network_id)) {
            throw new Error("Backup possui loja propria fora da rede do cluster.");
          }
          if (String(store.banner_id) !== String(cluster.banner_id)) {
            throw new Error("Backup possui loja propria fora da bandeira do cluster.");
          }
        });

        const levelIds = new Set((cluster.levels || []).map((level) => String(level.id)));
        (cluster.competitor_groups || []).forEach((group) => {
          if (!levelIds.has(String(group.level_id))) {
            throw new Error("Backup possui cluster com nivel inexistente.");
          }
          (group.store_ids || []).forEach((storeId) => {
            const store = storeMap.get(String(storeId));
            if (!store || store.kind !== STORE_KINDS.COMPETITOR) {
              throw new Error("Backup possui cluster com concorrente invalido.");
            }
          });
        });
      });

      const clusterMap = new Map(clusters.map((item) => [String(item.id), item]));
      const products = (snapshotInput.products || []).map((item) =>
        createProductModel({ ...item, tenant_id: tenantId })
      );
      const productIdSet = new Set(products.map((item) => String(item.id)));
      const researches = snapshotInput.priceResearches.map((item) => {
        const cluster = clusterMap.get(String(item.cluster_id));
        if (!cluster) {
          throw new Error("Backup possui pesquisa vinculada a cluster inexistente.");
        }
        const clusterLevelIds = [...getClusterLevelIds(cluster)];
        return createPriceResearchModel({
          ...item,
          tenant_id: tenantId,
          level_ids: clusterLevelIds
        });
      });

      researches.forEach((research) => {
        const cluster = clusterMap.get(String(research.cluster_id));
        if (!cluster) {
          throw new Error("Backup possui pesquisa vinculada a cluster inexistente.");
        }
        const clusterLevelIds = getClusterLevelIds(cluster);
        const hasInvalidLevel = normalizeResearchLevelProductLists(research).some(
          (entry) => !entry.level_id || !clusterLevelIds.has(String(entry.level_id))
        );
        if (hasInvalidLevel) {
          throw new Error("Backup possui servico com nivel fora do cluster.");
        }

        const hasInvalidProduct = getAllProductIdsFromResearch(research).some(
          (productId) => !productIdSet.has(String(productId))
        );
        if (hasInvalidProduct) {
          throw new Error("Backup possui servico com produto inexistente na colecao products.");
        }
      });

      const tenantAlreadyExists = (state.tenants || []).some(
        (item) => String(item.id) === String(tenantId)
      );
      if (tenantAlreadyExists) {
        dispatch({ type: DOMAIN_DELETE_TENANT, payload: tenantId });
      }

      dispatch({ type: DOMAIN_UPSERT_TENANT, payload: importedTenant });
      networks.forEach((item) => {
        dispatch({ type: DOMAIN_UPSERT_NETWORK, payload: item });
      });
      banners.forEach((item) => {
        dispatch({ type: DOMAIN_UPSERT_BANNER, payload: item });
      });
      stores.forEach((item) => {
        dispatch({ type: DOMAIN_UPSERT_STORE, payload: item });
      });
      clusters.forEach((item) => {
        dispatch({ type: DOMAIN_UPSERT_CLUSTER, payload: item });
      });
      researches.forEach((item) => {
        dispatch({ type: DOMAIN_UPSERT_PRICE_RESEARCH, payload: item });
      });
      products.forEach((item) => {
        dispatch({ type: DOMAIN_UPSERT_PRODUCT, payload: item });
      });
      dispatch({ type: DOMAIN_SET_ACTIVE_TENANT, payload: tenantId });

      return {
        tenant_id: tenantId,
        counts: {
          networks: networks.length,
          retailBanners: banners.length,
          stores: stores.length,
          clusterLevels: clusters.reduce((total, cluster) => total + (cluster.levels?.length || 0), 0),
          clusters: clusters.length,
          priceResearches: researches.length,
          products: products.length
        }
      };
    },
    [dispatch, state]
  );

  return {
    setActiveTenant,
    saveTenant,
    removeTenant,
    saveNetwork,
    removeNetwork,
    saveRetailBanner,
    removeRetailBanner,
    saveStore,
    removeStore,
    saveCluster,
    removeCluster,
    savePriceResearch,
    removePriceResearch,
    runResearchSchedulerForServiceMonth,
    saveProduct,
    removeProduct,
    exportTenantSnapshot,
    importTenantSnapshot,
    exportTenantsDataset,
    exportNetworksDataset,
    exportRetailBannersDataset,
    exportStoresDataset,
    exportPriceResearchesDataset,
    exportProductsDataset,
    saveTenantsBatch,
    saveNetworksBatch,
    saveRetailBannersBatch,
    saveStoresBatch,
    savePriceResearchesBatch,
    saveProductsBatch
  };
}
