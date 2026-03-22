"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFirebaseAuth } from "../features/auth/state/firebase-auth-context";
import MobileResearchHistoryCard from "../features/mobile/components/mobile-research-history-card";
import { useMobileResearchHistory } from "../features/research-tasks/hooks/use-mobile-research-history";
import MobileStandaloneGuard from "./mobile-standalone-guard";

export default function MobileResearchHistoryApp() {
  const router = useRouter();
  const { currentUser, loading: authLoading, profile } = useFirebaseAuth();
  const isResearcher = String(profile?.type || "").toLowerCase() === "researcher";
  const { items, loading, error } = useMobileResearchHistory(currentUser?.uid || "");

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

  return (
    <MobileStandaloneGuard
      title={"Abra o historico pelo app instalado"}
      subtitle={"O historico mobile do pesquisador segue protegido no modo standalone."}
      description={"Instale o NKET Mobile e abra pela tela inicial para consultar tarefas ja concluidas."}
    >
      {authLoading ? (
        <main className={"grid min-h-screen place-items-center bg-[linear-gradient(160deg,#f8fafc_0%,#dbeafe_52%,#e2e8f0_100%)] p-6"}>
          <p className={"m-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-[0_12px_24px_rgba(15,23,42,0.08)]"}>
            Carregando historico...
          </p>
        </main>
      ) : !currentUser || !isResearcher ? null : (
        <main className={"min-h-screen bg-[radial-gradient(circle_at_10%_12%,rgba(34,197,94,0.18),transparent_35%),radial-gradient(circle_at_88%_90%,rgba(59,130,246,0.2),transparent_40%),linear-gradient(145deg,#f8fafc_0%,#e2e8f0_46%,#f1f5f9_100%)] p-4 text-slate-900"}>
          <div className={"mx-auto grid max-w-[740px] gap-3"}>
            <header className={"grid gap-2 rounded-xl border border-slate-200 bg-white/[0.92] p-4 shadow-[0_10px_24px_rgba(15,23,42,0.08)]"}>
              <div className={"flex items-start justify-between gap-3"}>
                <div className={"grid gap-1"}>
                  <h1 className={"m-0 text-[28px]"}>MINHAS PESQUISAS</h1>
                  <p className={"m-0 text-xs text-slate-600"}>
                    Historico das tarefas concluidas pelo pesquisador.
                  </p>
                </div>
                <Link
                  href="/dash-mobile"
                  className={"inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 no-underline"}
                >
                  Voltar ao dash
                </Link>
              </div>
            </header>

            {loading ? (
              <p className={"m-0 rounded-lg border border-blue-200 bg-blue-50 p-2 text-xs text-blue-800"}>
                Atualizando historico...
              </p>
            ) : null}
            {error ? (
              <p className={"m-0 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-800"}>
                {error}
              </p>
            ) : null}

            <section className={"grid gap-2 rounded-xl border border-slate-200 bg-white/[0.9] p-3"}>
              <h2 className={"m-0 text-lg"}>Pesquisas concluidas</h2>
              {items.length === 0 ? (
                <div className={"rounded-lg border border-dashed border-slate-300 p-2.5 text-xs text-slate-600"}>
                  Voce ainda nao concluiu nenhuma tarefa de pesquisa.
                </div>
              ) : (
                <div className={"grid gap-2"}>
                  {items.map((item) => (
                    <MobileResearchHistoryCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
      )}
    </MobileStandaloneGuard>
  );
}
