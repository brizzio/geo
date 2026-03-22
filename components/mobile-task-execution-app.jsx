"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { uploadImageToImgbb } from "../features/domain/services/imgbb-upload";
import {
  selectPriceResearchById,
  selectStoreById
} from "../features/domain/state/selectors";
import { useDomainState } from "../features/domain/state/domain-state";
import { useFirebaseAuth } from "../features/auth/state/firebase-auth-context";
import MobileTaskCountdownCard from "../features/mobile/components/mobile-task-countdown-card";
import MobileTaskProductCard from "../features/mobile/components/mobile-task-product-card";
import { useMobileResearchState } from "../features/mobile/state/mobile-research-state";
import MobileStandaloneGuard from "./mobile-standalone-guard";

const STEP_KEYS = {
  ARRIVAL: "ARRIVAL",
  COLLECTION: "COLLECTION",
  REVIEW: "REVIEW"
};

const STORAGE_KEY_PREFIX = "nket-mobile-task-draft";

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeMoneyInput(value) {
  return String(value || "").trim();
}

function buildStorageKey(eventId) {
  return `${STORAGE_KEY_PREFIX}:${String(eventId || "")}`;
}

function buildAddressDisplay(store, eventItem) {
  const address = store?.address || {};
  const number = normalizeText(address?.street_number);
  const street = normalizeText(address?.street);
  const neighbourhood = normalizeText(address?.neighbourhood);
  const city = normalizeText(address?.city);
  const state = normalizeText(address?.state);
  const postcode = normalizeText(address?.postcode);
  const inlineStreet = [street, number].filter(Boolean).join(", ");
  const parts = [inlineStreet, neighbourhood, city, state, postcode].filter(Boolean);

  return (
    normalizeText(address?.display_name) ||
    parts.join(" - ") ||
    normalizeText(eventItem?.competitor_name) ||
    normalizeText(eventItem?.place_id) ||
    "-"
  );
}

function resolveEventProductIds(research, levelId) {
  const normalizedLevelId = normalizeText(levelId);
  const levelEntries = Array.isArray(research?.level_product_lists) ? research.level_product_lists : [];
  const exactLevelEntry = levelEntries.find(
    (entry) => normalizeText(entry?.level_id) === normalizedLevelId
  );

  if (exactLevelEntry && Array.isArray(exactLevelEntry.product_ids) && exactLevelEntry.product_ids.length > 0) {
    return exactLevelEntry.product_ids.map((item) => String(item || "").trim()).filter(Boolean);
  }

  const defaultProductIds = Array.isArray(research?.default_product_ids)
    ? research.default_product_ids.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
  if (defaultProductIds.length > 0) {
    return defaultProductIds;
  }

  return [
    ...new Set(
      levelEntries.flatMap((entry) =>
        (entry?.product_ids || []).map((item) => String(item || "").trim()).filter(Boolean)
      )
    )
  ];
}

function buildFallbackTask(eventItem, research, productById) {
  if (!eventItem || !research) {
    return null;
  }

  const productIds = resolveEventProductIds(research, eventItem?.level_id);
  if (productIds.length === 0) {
    return null;
  }

  return {
    id: String(eventItem?.research_task_id || `mobile_task_${eventItem?.id || "fallback"}`),
    research_schedule_id: String(eventItem?.research_schedule_id || ""),
    place_id: String(eventItem?.place_id || ""),
    research_list: productIds.map((productId) => {
      const product = productById.get(String(productId)) || null;
      return {
        id: `fallback_item_${String(eventItem?.id || "")}_${String(productId)}`,
        product_id: String(productId),
        product_name: product?.name || null,
        product_ean: product?.ean || null
      };
    })
  };
}

function buildDraftItems(taskItems = [], savedItems = {}) {
  const next = {};

  taskItems.forEach((item) => {
    const key = String(item?.id || item?.product_id || "");
    if (!key) {
      return;
    }

    const saved = savedItems?.[key] || {};
    next[key] = {
      first_price: normalizeMoneyInput(saved?.first_price),
      second_price: normalizeMoneyInput(saved?.second_price),
      second_price_quantity: normalizeText(saved?.second_price_quantity),
      loyalty_price: normalizeMoneyInput(saved?.loyalty_price),
      is_promotion: Boolean(saved?.is_promotion),
      department_name: normalizeText(saved?.department_name),
      shelf_tag_photo: saved?.shelf_tag_photo || null,
      confirmed: Boolean(saved?.confirmed),
      confirmed_at: normalizeText(saved?.confirmed_at)
    };
  });

  return next;
}

function parseNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function formatCurrency(value) {
  const numeric = parseNumber(value);
  if (numeric === null) {
    return "-";
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(numeric);
}

function stepLabel(step) {
  if (step === STEP_KEYS.COLLECTION) {
    return "Etapa 2 de 3: Coleta de dados";
  }
  if (step === STEP_KEYS.REVIEW) {
    return "Etapa 3 de 3: Revisao";
  }
  return "Etapa 1 de 3: Chegada ao local";
}

export default function MobileTaskExecutionApp({ eventId }) {
  const router = useRouter();
  const photoInputRef = useRef(null);
  const { state: domainState, hydrationDone: domainHydrationDone } = useDomainState();
  const { currentUser, loading: authLoading } = useFirebaseAuth();
  const {
    hydrationDone,
    isResearcher,
    events,
    subscriptionsByEvent,
    completeResearchTask
  } = useMobileResearchState();
  const [currentStep, setCurrentStep] = useState(STEP_KEYS.ARRIVAL);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFacade, setUploadingFacade] = useState(false);
  const [uploadingItemPhotoKey, setUploadingItemPhotoKey] = useState("");
  const [draft, setDraft] = useState({
    started_at: "",
    facade_photo: null,
    items: {}
  });

  const mobileEvent = useMemo(
    () => (events || []).find((item) => String(item?.id || "") === String(eventId || "")) || null,
    [events, eventId]
  );
  const subscription = useMemo(
    () => subscriptionsByEvent?.[String(eventId || "")] || null,
    [subscriptionsByEvent, eventId]
  );
  const research = useMemo(
    () =>
      mobileEvent?.research_service_id
        ? selectPriceResearchById(domainState, mobileEvent.research_service_id)
        : null,
    [domainState, mobileEvent?.research_service_id]
  );
  const task = useMemo(() => {
    const taskId = String(mobileEvent?.research_task_id || "");
    if (!taskId) {
      return null;
    }
    return (domainState?.researchTasks || []).find((item) => String(item?.id || "") === taskId) || null;
  }, [domainState, mobileEvent?.research_task_id]);
  const store = useMemo(
    () => (mobileEvent?.place_id ? selectStoreById(domainState, mobileEvent.place_id) : null),
    [domainState, mobileEvent?.place_id]
  );
  const productById = useMemo(
    () => new Map((domainState?.products || []).map((product) => [String(product?.id || ""), product])),
    [domainState]
  );
  const fallbackTask = useMemo(
    () => buildFallbackTask(mobileEvent, research, productById),
    [mobileEvent, research, productById]
  );
  const effectiveTask = task || fallbackTask;
  const taskItems = useMemo(() => {
    return (effectiveTask?.research_list || []).map((item) => ({
      ...item,
      product: productById.get(String(item?.product_id || "")) || null
    }));
  }, [effectiveTask, productById]);
  const addressDisplay = useMemo(() => buildAddressDisplay(store, mobileEvent), [store, mobileEvent]);
  const allItemsConfirmed =
    taskItems.length > 0 &&
    taskItems.every((item) => {
      const draftItem = draft?.items?.[String(item?.id || item?.product_id || "")];
      return Boolean(draftItem?.confirmed);
    });

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!currentUser) {
      router.replace("/mobile");
      return;
    }

    if (!isResearcher) {
      router.replace("/dashboard");
    }
  }, [authLoading, currentUser, isResearcher, router]);

  useEffect(() => {
    if (!taskItems.length) {
      return;
    }

    const storageKey = buildStorageKey(eventId);
    let savedDraft = null;

    try {
      const raw = window.sessionStorage.getItem(storageKey);
      savedDraft = raw ? JSON.parse(raw) : null;
    } catch (_error) {
      savedDraft = null;
    }

    setDraft({
      started_at: normalizeText(savedDraft?.started_at),
      facade_photo: savedDraft?.facade_photo || null,
      items: buildDraftItems(taskItems, savedDraft?.items || {})
    });
  }, [eventId, taskItems]);

  useEffect(() => {
    if (!taskItems.length) {
      return;
    }

    try {
      window.sessionStorage.setItem(buildStorageKey(eventId), JSON.stringify(draft));
    } catch (_error) {
      // Ignore sessionStorage write failures.
    }
  }, [draft, eventId, taskItems.length]);

  function updateItemDraft(itemKey, field, value) {
    setDraft((previous) => ({
      ...previous,
      items: {
        ...previous.items,
        [itemKey]: {
          ...(previous.items?.[itemKey] || {}),
          [field]: value,
          confirmed: false,
          confirmed_at: ""
        }
      }
    }));
  }

  function handleConfirmItem(itemKey) {
    const current = draft?.items?.[itemKey] || {};
    if (!normalizeText(current?.first_price)) {
      setFeedback("Informe ao menos o primeiro preco antes de confirmar o item.");
      return;
    }

    setDraft((previous) => ({
      ...previous,
      items: {
        ...previous.items,
        [itemKey]: {
          ...(previous.items?.[itemKey] || {}),
          confirmed: true,
          confirmed_at: new Date().toISOString()
        }
      }
    }));
    setFeedback("");
  }

  async function handleFacadeSelected(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setUploadingFacade(true);
    setFeedback("");

    try {
      const uploaded = await uploadImageToImgbb(file, {
        name: `facade-${String(eventId || "")}-${Date.now()}`
      });

      setDraft((previous) => ({
        ...previous,
        facade_photo: {
          id: uploaded?.id || null,
          image_url: uploaded?.imageUrl || uploaded?.url || null,
          display_url: uploaded?.displayUrl || uploaded?.imageUrl || uploaded?.url || null,
          thumb_url: uploaded?.thumbUrl || null,
          medium_url: uploaded?.mediumUrl || null,
          delete_url: uploaded?.deleteUrl || null,
          viewer_url: uploaded?.viewerUrl || null,
          provider: "imgbb"
        }
      }));
    } catch (uploadError) {
      setFeedback(uploadError?.message || "Falha ao enviar a foto da fachada.");
    } finally {
      setUploadingFacade(false);
    }
  }

  function handleStartCollection() {
    setDraft((previous) => ({
      ...previous,
      started_at: previous.started_at || new Date().toISOString()
    }));
    setCurrentStep(STEP_KEYS.COLLECTION);
    setFeedback("");
  }

  async function handleItemPhotoSelected(itemKey, event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setUploadingItemPhotoKey(itemKey);
    setFeedback("");

    try {
      const uploaded = await uploadImageToImgbb(file, {
        name: `shelf-tag-${String(eventId || "")}-${String(itemKey || "")}-${Date.now()}`
      });

      setDraft((previous) => ({
        ...previous,
        items: {
          ...previous.items,
          [itemKey]: {
            ...(previous.items?.[itemKey] || {}),
            shelf_tag_photo: {
              id: uploaded?.id || null,
              image_url: uploaded?.imageUrl || uploaded?.url || null,
              display_url: uploaded?.displayUrl || uploaded?.imageUrl || uploaded?.url || null,
              thumb_url: uploaded?.thumbUrl || null,
              medium_url: uploaded?.mediumUrl || null,
              delete_url: uploaded?.deleteUrl || null,
              viewer_url: uploaded?.viewerUrl || null,
              provider: "imgbb"
            },
            confirmed: false,
            confirmed_at: ""
          }
        }
      }));
    } catch (uploadError) {
      setFeedback(uploadError?.message || "Falha ao enviar a foto da etiqueta.");
    } finally {
      setUploadingItemPhotoKey("");
    }
  }

  async function handleFinishTask() {
    if (!mobileEvent || !effectiveTask) {
      setFeedback("Tarefa indisponivel para conclusao.");
      return;
    }

    if (!allItemsConfirmed) {
      setFeedback("Confirme todos os produtos antes de finalizar a tarefa.");
      return;
    }

    setSubmitting(true);
    setFeedback("");

    try {
      const items = taskItems.map((item) => {
        const itemKey = String(item?.id || item?.product_id || "");
        const currentDraft = draft?.items?.[itemKey] || {};

        return {
          item_id: itemKey,
          product_id: String(item?.product_id || ""),
          product_name: item?.product?.name || item?.product_name || "",
          product_ean: item?.product?.ean || item?.product_ean || "",
          first_price: parseNumber(currentDraft?.first_price),
          second_price: parseNumber(currentDraft?.second_price),
          second_price_quantity: parseNumber(currentDraft?.second_price_quantity),
          loyalty_price: parseNumber(currentDraft?.loyalty_price),
          is_promotion: Boolean(currentDraft?.is_promotion),
          department_name: normalizeText(currentDraft?.department_name),
          shelf_tag_photo: currentDraft?.shelf_tag_photo || null,
          confirmed_at: normalizeText(currentDraft?.confirmed_at)
        };
      });

      await completeResearchTask(eventId, {
        tenant_id: normalizeText(mobileEvent?.tenant_id || research?.tenant_id || ""),
        research_service_id: normalizeText(mobileEvent?.research_service_id || research?.id || ""),
        research_schedule_id: normalizeText(mobileEvent?.research_schedule_id || effectiveTask?.research_schedule_id || ""),
        research_task_id: normalizeText(mobileEvent?.research_task_id || effectiveTask?.id || ""),
        place_id: normalizeText(mobileEvent?.place_id || effectiveTask?.place_id || ""),
        event_name: normalizeText(mobileEvent?.name || research?.name || ""),
        competitor_name: normalizeText(mobileEvent?.competitor_name || store?.name || ""),
        competition_level: normalizeText(mobileEvent?.competition_level || ""),
        address_display_name: addressDisplay,
        accepted_at: subscription?.accepted_at || null,
        deadline_at: subscription?.deadline_at || null,
        started_at: draft?.started_at || null,
        facade_photo: draft?.facade_photo || null,
        expected_items: taskItems.map((item) => ({
          item_id: String(item?.id || item?.product_id || ""),
          product_id: String(item?.product_id || ""),
          product_name: item?.product?.name || item?.product_name || "",
          product_ean: item?.product?.ean || item?.product_ean || ""
        })),
        items
      });

      try {
        window.sessionStorage.removeItem(buildStorageKey(eventId));
      } catch (_error) {
        // Ignore cleanup failures.
      }

      router.replace("/dash-mobile");
    } catch (submitError) {
      setFeedback(submitError?.message || "Falha ao concluir a tarefa.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <MobileStandaloneGuard
      title={"Abra a tarefa pelo app instalado"}
      subtitle={"A execucao mobile da pesquisa exige modo standalone."}
      description={"Instale o NKET Mobile e abra pela tela inicial para executar tarefas com camera, timer e coleta guiada."}
    >
      {authLoading || !hydrationDone || !domainHydrationDone ? (
        <main className={"grid min-h-screen place-items-center bg-[linear-gradient(160deg,#f8fafc_0%,#dbeafe_52%,#e2e8f0_100%)] p-6"}>
          <p className={"m-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-[0_12px_24px_rgba(15,23,42,0.08)]"}>
            Carregando tarefa mobile...
          </p>
        </main>
      ) : !currentUser || !isResearcher ? null : !mobileEvent ? (
        <main className={"grid min-h-screen place-items-center bg-[linear-gradient(160deg,#f8fafc_0%,#dbeafe_52%,#e2e8f0_100%)] p-6"}>
          <section className={"grid max-w-[520px] gap-3 rounded-2xl border border-slate-200 bg-white/[0.95] p-5 shadow-[0_18px_36px_rgba(15,23,42,0.1)]"}>
            <h1 className={"m-0 text-xl text-slate-900"}>Tarefa nao encontrada</h1>
            <p className={"m-0 text-sm text-slate-600"}>A tarefa informada nao esta mais disponivel para execucao.</p>
            <Link href="/dash-mobile" className={"inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm text-white no-underline"}>
              Voltar ao dash mobile
            </Link>
          </section>
        </main>
      ) : !subscription ? (
        <main className={"grid min-h-screen place-items-center bg-[linear-gradient(160deg,#f8fafc_0%,#dbeafe_52%,#e2e8f0_100%)] p-6"}>
          <section className={"grid max-w-[520px] gap-3 rounded-2xl border border-slate-200 bg-white/[0.95] p-5 shadow-[0_18px_36px_rgba(15,23,42,0.1)]"}>
            <h1 className={"m-0 text-xl text-slate-900"}>Aceite a tarefa primeiro</h1>
            <p className={"m-0 text-sm text-slate-600"}>Voce precisa se inscrever na pesquisa antes de executar esta tarefa.</p>
            <Link href="/dash-mobile" className={"inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm text-white no-underline"}>
              Voltar ao dash mobile
            </Link>
          </section>
        </main>
      ) : subscription?.status === "DONE" ? (
        <main className={"grid min-h-screen place-items-center bg-[linear-gradient(160deg,#f8fafc_0%,#dbeafe_52%,#e2e8f0_100%)] p-6"}>
          <section className={"grid max-w-[520px] gap-3 rounded-2xl border border-slate-200 bg-white/[0.95] p-5 shadow-[0_18px_36px_rgba(15,23,42,0.1)]"}>
            <h1 className={"m-0 text-xl text-slate-900"}>Tarefa ja concluida</h1>
            <p className={"m-0 text-sm text-slate-600"}>Esta coleta ja foi finalizada por voce e registrada no banco.</p>
            <Link href="/dash-mobile" className={"inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm text-white no-underline"}>
              Voltar ao dash mobile
            </Link>
          </section>
        </main>
      ) : !effectiveTask ? (
        <main className={"grid min-h-screen place-items-center bg-[linear-gradient(160deg,#f8fafc_0%,#dbeafe_52%,#e2e8f0_100%)] p-6"}>
          <section className={"grid max-w-[520px] gap-3 rounded-2xl border border-slate-200 bg-white/[0.95] p-5 shadow-[0_18px_36px_rgba(15,23,42,0.1)]"}>
            <h1 className={"m-0 text-xl text-slate-900"}>Lista da tarefa indisponivel</h1>
            <p className={"m-0 text-sm text-slate-600"}>A tarefa foi aceita, mas a lista de coleta ainda nao esta sincronizada no app.</p>
            <Link href="/dash-mobile" className={"inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm text-white no-underline"}>
              Voltar ao dash mobile
            </Link>
          </section>
        </main>
      ) : (
        <main className={"min-h-screen bg-[radial-gradient(circle_at_10%_12%,rgba(34,197,94,0.18),transparent_35%),radial-gradient(circle_at_88%_90%,rgba(59,130,246,0.2),transparent_40%),linear-gradient(145deg,#f8fafc_0%,#e2e8f0_46%,#f1f5f9_100%)] p-4 text-slate-900"}>
          <div className={"mx-auto grid max-w-[820px] gap-3"}>
            <header className={"grid gap-2 rounded-xl border border-slate-200 bg-white/[0.92] p-4 shadow-[0_10px_24px_rgba(15,23,42,0.08)]"}>
              <div className={"flex items-start justify-between gap-3"}>
                <div className={"grid gap-1"}>
                  <h1 className={"m-0 text-[28px]"}>TAREFA EM EXECUCAO</h1>
                  <p className={"m-0 text-xs text-slate-600"}>
                    Pesquisa: <strong>{mobileEvent?.name || research?.name || "-"}</strong>
                  </p>
                  <p className={"m-0 text-xs text-slate-600"}>
                    Concorrente: <strong>{mobileEvent?.competitor_name || store?.name || "-"}</strong>
                  </p>
                </div>
                <Link href="/dash-mobile" className={"inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 no-underline"}>
                  Sair da tarefa
                </Link>
              </div>

              <div className={"flex flex-wrap gap-2 text-[11px] text-slate-600"}>
                <span className={"rounded-full border border-slate-300 bg-white px-2 py-0.5"}>Data: {mobileEvent?.date || "-"}</span>
                <span className={"rounded-full border border-slate-300 bg-white px-2 py-0.5"}>Nivel: {mobileEvent?.competition_level || "-"}</span>
                <span className={"rounded-full border border-slate-300 bg-white px-2 py-0.5"}>Itens: {taskItems.length}</span>
                {!task && fallbackTask ? (
                  <span className={"rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-700"}>
                    Lista montada pelo servico
                  </span>
                ) : null}
              </div>
            </header>

            <MobileTaskCountdownCard
              acceptedAt={subscription?.accepted_at}
              deadlineAt={subscription?.deadline_at}
              currentStepLabel={stepLabel(currentStep)}
            />

            <section className={"flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white/[0.92] p-3 shadow-[0_10px_24px_rgba(15,23,42,0.08)]"}>
              {[
                { key: STEP_KEYS.ARRIVAL, label: "1. Chegada" },
                { key: STEP_KEYS.COLLECTION, label: "2. Coleta" },
                { key: STEP_KEYS.REVIEW, label: "3. Revisao" }
              ].map((stepItem) => (
                <button
                  key={stepItem.key}
                  type="button"
                  onClick={() => setCurrentStep(stepItem.key)}
                  disabled={
                    (stepItem.key === STEP_KEYS.COLLECTION && !draft?.started_at) ||
                    (stepItem.key === STEP_KEYS.REVIEW && !allItemsConfirmed)
                  }
                  className={
                    currentStep === stepItem.key
                      ? "cursor-pointer rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-xs text-white disabled:cursor-not-allowed disabled:opacity-60"
                      : "cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                  }
                >
                  {stepItem.label}
                </button>
              ))}
            </section>

            {feedback ? (
              <p className={"m-0 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800"}>
                {feedback}
              </p>
            ) : null}

            {currentStep === STEP_KEYS.ARRIVAL ? (
              <section className={"grid gap-3 rounded-xl border border-slate-200 bg-white/[0.92] p-4 shadow-[0_10px_24px_rgba(15,23,42,0.08)]"}>
                <div className={"grid gap-1"}>
                  <h2 className={"m-0 text-lg"}>1. Dirija-se ate o local da pesquisa</h2>
                  <p className={"m-0 text-xs text-slate-600"}>Confirme o endereco e, se quiser, registre uma foto da fachada antes de iniciar a coleta.</p>
                </div>

                <article className={"grid gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-3"}>
                  <strong className={"text-sm text-slate-900"}>{mobileEvent?.competitor_name || store?.name || "-"}</strong>
                  <small className={"text-slate-600"}>Endereco: {addressDisplay}</small>
                  <small className={"text-slate-600"}>Data da coleta: {mobileEvent?.date || "-"}</small>
                  <small className={"text-slate-600"}>Nivel de concorrencia: {mobileEvent?.competition_level || "-"}</small>
                </article>

                <div className={"grid gap-2 rounded-xl border border-dashed border-slate-300 bg-white p-3"}>
                  <strong className={"text-sm text-slate-900"}>Foto da fachada (opcional)</strong>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFacadeSelected}
                    className={"hidden"}
                  />
                  <div className={"flex flex-wrap gap-2"}>
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      disabled={uploadingFacade}
                      className={"cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"}
                    >
                      {uploadingFacade ? "Enviando foto..." : "Tirar foto da fachada"}
                    </button>

                    <button
                      type="button"
                      onClick={handleStartCollection}
                      className={"cursor-pointer rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-xs text-white"}
                    >
                      Iniciar coleta
                    </button>
                  </div>

                  {draft?.facade_photo?.display_url || draft?.facade_photo?.image_url ? (
                    <div className={"grid gap-2"}>
                      <img
                        src={draft?.facade_photo?.display_url || draft?.facade_photo?.image_url}
                        alt="Fachada do local da pesquisa"
                        className={"max-h-[260px] w-full rounded-lg border border-slate-200 object-cover"}
                      />
                      <small className={"text-slate-600"}>Foto pronta para envio junto da tarefa.</small>
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}

            {currentStep === STEP_KEYS.COLLECTION ? (
              <section className={"grid gap-3 rounded-xl border border-slate-200 bg-white/[0.92] p-4 shadow-[0_10px_24px_rgba(15,23,42,0.08)]"}>
                <div className={"grid gap-1"}>
                  <h2 className={"m-0 text-lg"}>2. Coleta de dados</h2>
                  <p className={"m-0 text-xs text-slate-600"}>Preencha os campos de cada produto e confirme com o botao OK.</p>
                </div>

                <div className={"grid gap-2"}>
                  {taskItems.map((item) => {
                    const itemKey = String(item?.id || item?.product_id || "");
                    return (
                      <MobileTaskProductCard
                        key={itemKey}
                        item={item}
                        draft={draft?.items?.[itemKey] || {}}
                        uploadingPhoto={String(uploadingItemPhotoKey) === itemKey}
                        onChange={(field, value) => updateItemDraft(itemKey, field, value)}
                        onConfirm={() => handleConfirmItem(itemKey)}
                        onPhotoSelected={(event) => handleItemPhotoSelected(itemKey, event)}
                      />
                    );
                  })}
                </div>

                <div className={"flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3"}>
                  <small className={"text-slate-600"}>
                    Confirmados:{" "}
                    <strong>
                      {
                        taskItems.filter((item) => {
                          const itemKey = String(item?.id || item?.product_id || "");
                          return Boolean(draft?.items?.[itemKey]?.confirmed);
                        }).length
                      }{" "}
                      / {taskItems.length}
                    </strong>
                  </small>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(STEP_KEYS.REVIEW)}
                    disabled={!allItemsConfirmed}
                    className={"cursor-pointer rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-xs text-white disabled:cursor-not-allowed disabled:opacity-60"}
                  >
                    Ir para revisao
                  </button>
                </div>
              </section>
            ) : null}

            {currentStep === STEP_KEYS.REVIEW ? (
              <section className={"grid gap-3 rounded-xl border border-slate-200 bg-white/[0.92] p-4 shadow-[0_10px_24px_rgba(15,23,42,0.08)]"}>
                <div className={"grid gap-1"}>
                  <h2 className={"m-0 text-lg"}>3. Revisao</h2>
                  <p className={"m-0 text-xs text-slate-600"}>Confira os dados coletados antes de finalizar a tarefa de pesquisa.</p>
                </div>

                <div className={"overflow-auto rounded-xl border border-slate-200"}>
                  <table className={"w-full border-collapse text-left text-[12px]"}>
                    <thead className={"bg-slate-50 text-slate-600"}>
                      <tr>
                        <th className={"px-2.5 py-2 font-medium"}>Produto</th>
                        <th className={"px-2.5 py-2 font-medium"}>1o preco</th>
                        <th className={"px-2.5 py-2 font-medium"}>2o preco</th>
                        <th className={"px-2.5 py-2 font-medium"}>Qtd</th>
                        <th className={"px-2.5 py-2 font-medium"}>Fidelidade</th>
                        <th className={"px-2.5 py-2 font-medium"}>Promocao</th>
                        <th className={"px-2.5 py-2 font-medium"}>Departamento</th>
                        <th className={"px-2.5 py-2 font-medium"}>Foto etiqueta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {taskItems.map((item) => {
                        const itemKey = String(item?.id || item?.product_id || "");
                        const currentDraft = draft?.items?.[itemKey] || {};

                        return (
                          <tr key={itemKey} className={"border-t border-slate-100 align-top"}>
                            <td className={"px-2.5 py-2 text-slate-900"}>
                              {item?.product?.name || item?.product_name || item?.product_id || "-"}
                            </td>
                            <td className={"px-2.5 py-2 text-slate-700"}>{formatCurrency(currentDraft?.first_price)}</td>
                            <td className={"px-2.5 py-2 text-slate-700"}>{formatCurrency(currentDraft?.second_price)}</td>
                            <td className={"px-2.5 py-2 text-slate-700"}>{normalizeText(currentDraft?.second_price_quantity) || "-"}</td>
                            <td className={"px-2.5 py-2 text-slate-700"}>{formatCurrency(currentDraft?.loyalty_price)}</td>
                            <td className={"px-2.5 py-2 text-slate-700"}>{currentDraft?.is_promotion ? "Sim" : "Nao"}</td>
                            <td className={"px-2.5 py-2 text-slate-700"}>{normalizeText(currentDraft?.department_name) || "-"}</td>
                            <td className={"px-2.5 py-2 text-slate-700"}>
                              {currentDraft?.shelf_tag_photo?.display_url || currentDraft?.shelf_tag_photo?.image_url
                                ? "Sim"
                                : "Nao"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className={"flex flex-wrap gap-2"}>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(STEP_KEYS.COLLECTION)}
                    className={"cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"}
                  >
                    Voltar para coleta
                  </button>
                  <button
                    type="button"
                    onClick={handleFinishTask}
                    disabled={submitting || !allItemsConfirmed}
                    className={"cursor-pointer rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-xs text-white disabled:cursor-not-allowed disabled:opacity-60"}
                  >
                    {submitting ? "Finalizando..." : "Finalizar tarefa de pesquisa"}
                  </button>
                </div>
              </section>
            ) : null}
          </div>
        </main>
      )}
    </MobileStandaloneGuard>
  );
}
