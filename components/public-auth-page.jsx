"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useFirebaseAuth } from "../features/auth/state/firebase-auth-context";
import { useDomainActions } from "../features/domain/hooks/use-domain-actions";
import { TENANT_TYPES } from "../features/domain/models";

const MODES = {
  LOGIN: "login",
  REGISTER: "register"
};

function mapAuthError(error) {
  const code = error?.code || "";
  switch (code) {
    case "auth/email-already-in-use":
      return "Este e-mail ja esta em uso.";
    case "auth/invalid-email":
      return "E-mail invalido.";
    case "auth/weak-password":
      return "Senha fraca. Use ao menos 6 caracteres.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "E-mail ou senha invalidos.";
    default:
      return error?.message || "Falha na autenticacao.";
  }
}

export default function PublicAuthPage() {
  const router = useRouter();
  const { currentUser, loading, signIn, signUp, isConfigured } = useFirebaseAuth();
  const { saveTenant, setActiveTenant } = useDomainActions();
  const [mode, setMode] = useState(MODES.LOGIN);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    password: ""
  });

  const pageTitle = useMemo(
    () => (mode === MODES.LOGIN ? "Entrar na Plataforma" : "Criar uma Conta"),
    [mode]
  );

  useEffect(() => {
    if (!loading && currentUser) {
      router.replace("/dashboard");
    }
  }, [loading, currentUser, router]);

  function updateField(field, value) {
    setFormData((previous) => ({ ...previous, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!isConfigured) {
      setFeedback({ type: "error", text: "Firebase nao configurado neste ambiente." });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      if (mode === MODES.LOGIN) {
        const result = await signIn({
          email: formData.email.trim(),
          password: formData.password
        });
        if (result?.createdTenant && result?.tenant) {
          saveTenant(result.tenant);
        }
        const tenantId = result?.tenantId || result?.profile?.default_tenant_id || null;
        if (tenantId) {
          setActiveTenant(tenantId);
        }
      } else {
        const email = formData.email.trim();
        const displayName = formData.displayName.trim();
        const result = await signUp({
          email,
          password: formData.password,
          displayName: displayName || null,
          tenantData: {
            name: displayName || email.split("@")[0] || "Minha conta",
            person_type: TENANT_TYPES.INDIVIDUAL
          }
        });
        if (result?.tenant) {
          saveTenant(result.tenant);
        }
        if (result?.tenantId) {
          setActiveTenant(result.tenantId);
        }
      }
      router.replace("/dashboard");
    } catch (error) {
      setFeedback({
        type: "error",
        text: mapAuthError(error)
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className={"grid min-h-screen place-items-center bg-[linear-gradient(140deg,#f8fafc_0%,#e2e8f0_42%,#dbeafe_100%)] p-6"}>
        <p className={"m-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-[0_12px_24px_rgba(15,23,42,0.08)]"}>
          Carregando sessao...
        </p>
      </main>
    );
  }

  return (
    <main className={"grid min-h-screen place-items-center bg-[radial-gradient(circle_at_8%_18%,rgba(34,197,94,0.18),transparent_35%),radial-gradient(circle_at_88%_84%,rgba(59,130,246,0.2),transparent_38%),linear-gradient(145deg,#f8fafc_0%,#e2e8f0_45%,#f1f5f9_100%)] p-6"}>
      <section className={"w-full max-w-[460px] rounded-2xl border border-slate-200 bg-white/[0.94] p-6 shadow-[0_20px_40px_rgba(15,23,42,0.12)]"}>
        <header className={"mb-5"}>
          <p className={"m-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500"}>
            Geo Platform
          </p>
          <h1 className={"mt-2 text-2xl text-slate-900"}>{pageTitle}</h1>
          <p className={"m-0 text-sm text-slate-600"}>
            Pagina publica: faca login ou registre-se para acessar o dashboard.
          </p>
        </header>

        <div className={"mb-4 flex gap-2"}>
          <button
            type="button"
            onClick={() => setMode(MODES.LOGIN)}
            className={`${"flex-1 cursor-pointer rounded-lg border px-3 py-2 text-sm"} ${mode === MODES.LOGIN ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-800"}`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode(MODES.REGISTER)}
            className={`${"flex-1 cursor-pointer rounded-lg border px-3 py-2 text-sm"} ${mode === MODES.REGISTER ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-800"}`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className={"grid gap-3"}>
          {mode === MODES.REGISTER ? (
            <label className={"grid gap-1"}>
              <span className={"text-xs font-semibold uppercase tracking-[0.08em] text-slate-600"}>
                Nome
              </span>
              <input
                type="text"
                value={formData.displayName}
                onChange={(event) => updateField("displayName", event.target.value)}
                className={"rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-500"}
                placeholder="Seu nome"
              />
            </label>
          ) : null}

          <label className={"grid gap-1"}>
            <span className={"text-xs font-semibold uppercase tracking-[0.08em] text-slate-600"}>E-mail</span>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(event) => updateField("email", event.target.value)}
              className={"rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-500"}
              placeholder="voce@empresa.com"
            />
          </label>

          <label className={"grid gap-1"}>
            <span className={"text-xs font-semibold uppercase tracking-[0.08em] text-slate-600"}>Senha</span>
            <input
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={(event) => updateField("password", event.target.value)}
              className={"rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-500"}
              placeholder="Minimo 6 caracteres"
            />
          </label>

          {feedback?.type === "error" ? (
            <p className={"m-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"}>
              {feedback.text}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className={"mt-1 cursor-pointer rounded-lg border border-slate-900 bg-slate-900 px-3 py-2.5 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"}
          >
            {isSubmitting ? "Processando..." : mode === MODES.LOGIN ? "Entrar" : "Criar conta"}
          </button>
        </form>
      </section>
    </main>
  );
}
