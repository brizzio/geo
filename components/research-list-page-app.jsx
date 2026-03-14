"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useDomainState } from "../features/domain/state/domain-state";
import {
  selectClusterById,
  selectPriceResearchById,
  selectProductsByTenant,
  selectResearchTasksByService,
  selectStoreById
} from "../features/domain/state/selectors";

function buildResearchItems(research, cluster, products) {
  const productById = new Map((products || []).map((product) => [String(product.id), product]));
  const levelNameById = new Map(
    (cluster?.levels || []).map((level) => [String(level.id), String(level.name || level.id)])
  );
  const map = new Map();

  (research?.level_product_lists || []).forEach((entry) => {
    const levelId = String(entry?.level_id || "");
    const levelName = levelNameById.get(levelId) || levelId || "Sem nivel";
    (entry?.product_ids || []).forEach((productIdRaw) => {
      const productId = String(productIdRaw || "");
      if (!productId) {
        return;
      }

      const current = map.get(productId) || {
        product_id: productId,
        levels: new Set()
      };
      current.levels.add(levelName);
      map.set(productId, current);
    });
  });

  if (map.size === 0) {
    (research?.default_product_ids || []).forEach((productIdRaw) => {
      const productId = String(productIdRaw || "");
      if (!productId) {
        return;
      }
      const current = map.get(productId) || {
        product_id: productId,
        levels: new Set(["Lista padrao"])
      };
      map.set(productId, current);
    });
  }

  return [...map.values()]
    .map((item) => {
      const product = productById.get(item.product_id) || null;
      return {
        ...item,
        product
      };
    })
    .sort((a, b) =>
      String(a?.product?.name || a.product_id).localeCompare(String(b?.product?.name || b.product_id))
    );
}

function buildTaskItems(task, products = []) {
  const productById = new Map((products || []).map((product) => [String(product.id), product]));
  return (task?.research_list || [])
    .map((item) => {
      const productId = String(item?.product_id || "");
      const product = productById.get(productId) || null;
      return {
        key: String(item?.id || productId || Math.random()),
        product_id: productId || null,
        product,
        product_name: item?.product_name || null,
        product_ean: item?.product_ean || null,
        status: item?.status || "pending"
      };
    })
    .sort((a, b) =>
      String(a?.product?.name || a?.product_name || a.product_id || "").localeCompare(
        String(b?.product?.name || b?.product_name || b.product_id || "")
      )
    );
}

function itemStatusLabel(status) {
  const value = String(status || "").toLowerCase();
  if (value === "collected") {
    return "COLETADO";
  }
  if (value === "not_found") {
    return "NAO ENCONTRADO";
  }
  if (value === "in_progress") {
    return "EM ANDAMENTO";
  }
  return "PENDENTE";
}

export default function ResearchListPageApp({ researchId, taskId = null }) {
  const { state, hydrationDone } = useDomainState();

  const research = useMemo(() => selectPriceResearchById(state, researchId), [state, researchId]);
  const cluster = useMemo(
    () => (research ? selectClusterById(state, research.cluster_id) : null),
    [state, research]
  );
  const products = useMemo(
    () => (research ? selectProductsByTenant(state, research.tenant_id) : []),
    [state, research]
  );
  const tasks = useMemo(
    () => (research ? selectResearchTasksByService(state, research.id) : []),
    [state, research]
  );
  const selectedTask = useMemo(() => {
    if (!taskId) {
      return null;
    }
    return tasks.find((task) => String(task.id) === String(taskId)) || null;
  }, [tasks, taskId]);
  const selectedStore = useMemo(
    () => (selectedTask ? selectStoreById(state, selectedTask.place_id) : null),
    [state, selectedTask]
  );
  const selectedLevelName = useMemo(() => {
    if (!selectedTask) {
      return null;
    }
    const levelId = String(selectedTask?.level_id || "");
    if (!levelId) {
      return "-";
    }
    const level = (cluster?.levels || []).find((item) => String(item?.id || "") === levelId);
    return level?.name || levelId;
  }, [selectedTask, cluster]);
  const items = useMemo(
    () =>
      selectedTask
        ? buildTaskItems(selectedTask, products)
        : buildResearchItems(research, cluster, products),
    [research, cluster, products, selectedTask]
  );

  if (!hydrationDone) {
    return (
      <main className={"min-h-screen p-6 text-slate-900 bg-[radial-gradient(circle_at_12%_10%,rgba(255,208,82,0.18),transparent_32%),radial-gradient(circle_at_85%_90%,rgba(37,99,235,0.16),transparent_40%),linear-gradient(180deg,#f7f7f8_0%,#f0f2f5_100%)]"}>
        <div className={"mx-auto grid max-w-[1440px] gap-4"}>
          <section className={"grid gap-2.5 rounded-xl border border-slate-900/10 bg-white/90 p-[14px]"}>
            <h2 className={"m-0 text-lg"}>Carregando lista da pesquisa...</h2>
          </section>
        </div>
      </main>
    );
  }

  if (!research) {
    return (
      <main className={"min-h-screen p-6 text-slate-900 bg-[radial-gradient(circle_at_12%_10%,rgba(255,208,82,0.18),transparent_32%),radial-gradient(circle_at_85%_90%,rgba(37,99,235,0.16),transparent_40%),linear-gradient(180deg,#f7f7f8_0%,#f0f2f5_100%)]"}>
        <div className={"mx-auto grid max-w-[1440px] gap-4"}>
          <section className={"grid gap-2.5 rounded-xl border border-slate-900/10 bg-white/90 p-[14px]"}>
            <h2 className={"m-0 text-lg"}>Servico nao encontrado</h2>
            <div className={"flex flex-wrap gap-2"}>
              <Link href="/researches" className={"inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2.5 text-[13px] text-white no-underline"}>
                Voltar para pesquisas
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (taskId && !selectedTask) {
    return (
      <main className={"min-h-screen p-6 text-slate-900 bg-[radial-gradient(circle_at_12%_10%,rgba(255,208,82,0.18),transparent_32%),radial-gradient(circle_at_85%_90%,rgba(37,99,235,0.16),transparent_40%),linear-gradient(180deg,#f7f7f8_0%,#f0f2f5_100%)]"}>
        <div className={"mx-auto grid max-w-[1440px] gap-4"}>
          <section className={"grid gap-2.5 rounded-xl border border-slate-900/10 bg-white/90 p-[14px]"}>
            <h2 className={"m-0 text-lg"}>Evento de tarefa nao encontrado</h2>
            <p className={"m-0 text-xs opacity-70"}>O evento informado nao existe para este servico.</p>
            <div className={"flex flex-wrap gap-2"}>
              <Link href={`/researches/${research.id}/tasks`} className={"inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2.5 text-[13px] text-white no-underline"}>
                Voltar para tarefas
              </Link>
            </div>
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
            <h1 className={"m-0 text-[30px] tracking-[0.5px]"}>LISTA DA PESQUISA</h1>
            <p className={"mb-0 mt-1 text-sm [opacity:0.85]"}>
              Servico: <strong>{research.name || "-"}</strong>
            </p>
            <p className={"mb-0 mt-1 text-sm [opacity:0.85]"}>
              Cluster: <strong>{cluster?.name || "-"}</strong>
            </p>
            {selectedTask ? (
              <p className={"mb-0 mt-1 text-sm [opacity:0.85]"}>
                Concorrente:{" "}
                <strong className={"rounded-md bg-amber-100 px-2 py-0.5 text-amber-900"}>
                  {selectedStore?.name || selectedTask.place_id || "-"}
                </strong>
              </p>
            ) : null}
            {selectedTask ? (
              <p className={"mb-0 mt-1 text-sm [opacity:0.85]"}>
                Nivel de concorrencia: <strong>{selectedLevelName || "-"}</strong>
              </p>
            ) : null}
          </div>
          <div className={"flex flex-wrap items-center gap-2"}>
            <Link href={`/researches/${research.id}/edit`} className={"inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[13px] text-slate-900 no-underline"}>
              Editar servico
            </Link>
            {selectedTask ? (
              <Link href={`/researches/${research.id}/tasks`} className={"inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[13px] text-slate-900 no-underline"}>
                Voltar para tarefas
              </Link>
            ) : null}
            <Link href="/researches" className={"inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2.5 text-[13px] text-white no-underline"}>
              Pesquisas
            </Link>
          </div>
        </header>

        <section className={"grid gap-2.5 rounded-xl border border-slate-900/10 bg-white/90 p-[14px]"}>
          <h2 className={"m-0 text-lg"}>Itens ({items.length})</h2>

          {items.length === 0 ? (
            <div className={"rounded-lg border border-dashed border-slate-300 p-2.5 text-xs opacity-75"}>
              Esta pesquisa ainda nao possui itens associados.
            </div>
          ) : (
            <div className={"flex w-full flex-col gap-2"}>
              {items.map((item) => (
                <article key={item.key || item.product_id} className={"w-full grid gap-1.5 rounded-lg border border-slate-200 bg-white p-2.5"}>
                  <div className={"flex items-center justify-between gap-2"}>
                    <strong>{item.product?.name || item.product_name || `Produto ${item.product_id}`}</strong>
                    <span className={"rounded-full border border-slate-300 px-2 py-0.5 text-[15px]"}>
                      EAN: {item.product?.ean || item.product_ean || "-"}
                    </span>
                  </div>
                  <small>Marca: {item.product?.brand || "-"}</small>
                  <small>Categoria: {item.product?.category || "-"}</small>
                  {selectedTask ? (
                    <small>Status na tarefa: {itemStatusLabel(item.status)}</small>
                  ) : (
                    <small>Niveis: {[...item.levels].join(", ")}</small>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
