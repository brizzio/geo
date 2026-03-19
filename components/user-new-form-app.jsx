"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { doc, getDocs, limit, query, setDoc, where, collection } from "firebase/firestore";
import { useFirebaseAuth } from "../features/auth/state/firebase-auth-context";
import { useDomainActions } from "../features/domain/hooks/use-domain-actions";
import { DEFAULT_USER_GROUPS } from "../features/domain/models";
import { useDomainState } from "../features/domain/state/domain-state";
import {
  selectActiveTenant,
  selectActiveTenantId,
  selectUserGroupsByTenant
} from "../features/domain/state/selectors";
import { db, hasFirebaseConfig } from "../lib/firebase-client";

const USERS_COLLECTION = "users";

function normalizeText(value) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
}

function normalizeCode(value) {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}

function normalizeEmail(value) {
  return normalizeText(value).toLowerCase();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
}

function buildId(prefix = "id") {
  const random = Math.floor(Math.random() * 1_000_000)
    .toString(36)
    .padStart(4, "0");
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}

function nowIso() {
  return new Date().toISOString();
}

export default function UserNewFormApp() {
  const { state, hydrationDone } = useDomainState();
  const { saveUserGroup } = useDomainActions();
  const { currentUser } = useFirebaseAuth();
  const activeTenantId = useMemo(() => selectActiveTenantId(state), [state]);
  const activeTenant = useMemo(() => selectActiveTenant(state), [state]);
  const userGroups = useMemo(
    () => (activeTenantId ? selectUserGroupsByTenant(state, activeTenantId) : []),
    [state, activeTenantId]
  );

  const [form, setForm] = useState({
    name: "",
    email: "",
    group_id: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const seededTenantsRef = useRef(new Set());

  useEffect(() => {
    if (!hydrationDone || !activeTenantId) {
      return;
    }
    if (seededTenantsRef.current.has(String(activeTenantId))) {
      return;
    }
    seededTenantsRef.current.add(String(activeTenantId));

    const existingCodes = new Set((userGroups || []).map((item) => normalizeCode(item?.team_name)));
    DEFAULT_USER_GROUPS.forEach((group) => {
      const code = normalizeCode(group.team_name);
      if (existingCodes.has(code)) {
        return;
      }
      saveUserGroup({
        tenant_id: activeTenantId,
        team_name: group.team_name,
        team_name_display: group.team_name_display,
        is_default: true
      });
    });
  }, [activeTenantId, hydrationDone, saveUserGroup, userGroups]);

  useEffect(() => {
    if (!form.group_id && userGroups.length > 0) {
      setForm((prev) => ({
        ...prev,
        group_id: String(userGroups[0].id)
      }));
    }
  }, [form.group_id, userGroups]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const name = normalizeText(form.name);
    const email = normalizeEmail(form.email);
    const groupId = normalizeText(form.group_id);
    const selectedGroup =
      userGroups.find((group) => String(group.id) === String(groupId)) || null;

    if (!activeTenantId) {
      setError("Selecione uma conta ativa antes de cadastrar usuario.");
      return;
    }
    if (!name) {
      setError("Informe o nome do usuario.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Informe um email valido.");
      return;
    }
    if (!selectedGroup) {
      setError("Selecione um grupo.");
      return;
    }
    if (!hasFirebaseConfig || !db) {
      setError("Firebase nao configurado.");
      return;
    }

    setSubmitting(true);
    try {
      const existingByEmailQuery = query(
        collection(db, USERS_COLLECTION),
        where("email", "==", email),
        limit(40)
      );
      const existingByEmailSnapshot = await getDocs(existingByEmailQuery);
      const alreadyInvited = existingByEmailSnapshot.docs.some((item) => {
        const payload = item.data() || {};
        const tenantIds = Array.isArray(payload?.tenant_ids) ? payload.tenant_ids : [];
        const sameTenant =
          String(payload?.default_tenant_id || "") === String(activeTenantId) ||
          tenantIds.some((tenantId) => String(tenantId) === String(activeTenantId));
        const rawStatus = normalizeCode(payload?.status || "");
        return sameTenant && (rawStatus === "GUEST" || rawStatus === "INVITED");
      });

      if (alreadyInvited) {
        setError("Ja existe convite pendente para esse email nesta conta.");
        setSubmitting(false);
        return;
      }

      const id = buildId("user_invite");
      const timestamp = nowIso();
      const payload = {
        id,
        uid: null,
        user_id: null,
        email,
        display_name: name,
        type: "user",
        status: "guest",
        tenant_ids: [String(activeTenantId)],
        default_tenant_id: String(activeTenantId),
        team_id: String(selectedGroup.id),
        team_ids: [String(selectedGroup.id)],
        group_id: String(selectedGroup.id),
        group_ids: [String(selectedGroup.id)],
        team_name: selectedGroup.team_name || null,
        team_name_display: selectedGroup.team_name_display || selectedGroup.team_name || null,
        invited_by_uid: currentUser?.uid || null,
        invited_by_email: currentUser?.email || null,
        invited_at: timestamp,
        first_login_at: null,
        last_login_at: null,
        created_at: timestamp,
        updated_at: timestamp
      };

      await setDoc(doc(db, USERS_COLLECTION, id), payload);

      setSuccess("Usuario convidado com sucesso. Registro criado com status guest.");
      setForm({
        name: "",
        email: "",
        group_id: String(selectedGroup.id)
      });
    } catch (submitError) {
      setError(submitError?.message || "Falha ao cadastrar usuario.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!hydrationDone) {
    return (
      <main className={"grid min-h-screen place-items-center bg-slate-100 p-6"}>
        <p className={"m-0 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"}>
          Carregando formulario...
        </p>
      </main>
    );
  }

  if (!activeTenantId) {
    return (
      <main className={"grid min-h-screen place-items-center bg-slate-100 p-6"}>
        <div className={"grid gap-2 rounded-lg border border-slate-200 bg-white p-4"}>
          <strong>Nenhuma conta ativa selecionada.</strong>
          <Link href="/accounts" className={"inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-xs text-white no-underline"}>
            Selecionar conta
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className={"min-h-screen p-6 text-slate-900 bg-[radial-gradient(circle_at_12%_10%,rgba(255,208,82,0.18),transparent_32%),radial-gradient(circle_at_85%_90%,rgba(37,99,235,0.16),transparent_40%),linear-gradient(180deg,#f7f7f8_0%,#f0f2f5_100%)]"}>
      <div className={"mx-auto grid max-w-[980px] gap-4"}>
        <header className={"flex items-center justify-between gap-4 rounded-[14px] bg-white/[0.85] px-5 py-[18px] shadow-[0_10px_20px_rgba(15,23,42,0.08)]"}>
          <div>
            <h1 className={"m-0 text-[30px] tracking-[0.5px]"}>NOVO USUARIO</h1>
            <p className={"mb-0 mt-1 text-sm [opacity:0.85]"}>CONTA ativa: {activeTenant?.name || activeTenantId}</p>
          </div>
          <div className={"flex flex-wrap items-center gap-2"}>
            <Link href="/users" className={"inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[13px] text-slate-900 no-underline"}>
              Times
            </Link>
            <Link href="/dashboard" className={"inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2.5 text-[13px] text-white no-underline"}>
              Dashboard
            </Link>
          </div>
        </header>

        <section className={"rounded-xl border border-slate-200 bg-white p-5 shadow-[0_8px_18px_rgba(15,23,42,0.06)]"}>
          <form onSubmit={handleSubmit} className={"grid gap-3"}>
            <label className={"grid gap-1 text-sm text-slate-700"}>
              <span>Nome</span>
              <input
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Nome do usuario"
                className={"rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-slate-500"}
              />
            </label>

            <label className={"grid gap-1 text-sm text-slate-700"}>
              <span>Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="email@empresa.com"
                className={"rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-slate-500"}
              />
            </label>

            <label className={"grid gap-1 text-sm text-slate-700"}>
              <span>Grupo</span>
              <select
                value={form.group_id}
                onChange={(event) => setForm((prev) => ({ ...prev, group_id: event.target.value }))}
                className={"rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-slate-500"}
              >
                {userGroups.map((group) => (
                  <option key={String(group.id)} value={String(group.id)}>
                    {group.team_name_display || group.team_name}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              disabled={submitting || userGroups.length === 0}
              className={"inline-flex h-[38px] items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 text-xs text-white disabled:cursor-not-allowed disabled:opacity-60"}
            >
              {submitting ? "Cadastrando..." : "Cadastrar"}
            </button>
          </form>

          {error ? <small className={"mt-2 block text-red-600"}>{error}</small> : null}
          {success ? <small className={"mt-2 block text-emerald-700"}>{success}</small> : null}
        </section>
      </div>
    </main>
  );
}
