"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
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
const USER_STATUS = {
  INVITED: "INVITED",
  REGISTERED: "REGISTERED",
  SUSPENDED: "SUSPENDED"
};

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

function resolveDisplayName(user = {}) {
  const byName = normalizeText(user?.display_name || user?.name || user?.username);
  if (byName) {
    return byName;
  }
  const email = normalizeText(user?.email);
  if (email) {
    return email;
  }
  return normalizeText(user?.uid || user?.id || "Usuario");
}

function resolveUserStatus(user = {}) {
  const rawStatus = normalizeCode(user?.status || "");
  const hasLastLogin = Boolean(user?.last_login_at);
  const disabled =
    rawStatus === USER_STATUS.SUSPENDED ||
    user?.is_suspended === true ||
    user?.disabled === true ||
    user?.active === false;

  if (disabled) {
    return USER_STATUS.SUSPENDED;
  }
  if (hasLastLogin) {
    return USER_STATUS.REGISTERED;
  }
  return USER_STATUS.INVITED;
}

function statusLabel(status) {
  if (status === USER_STATUS.SUSPENDED) {
    return "suspenso";
  }
  if (status === USER_STATUS.REGISTERED) {
    return "registrado";
  }
  return "convidado";
}

function statusClassName(status) {
  if (status === USER_STATUS.SUSPENDED) {
    return "border-red-200 bg-red-50 text-red-700";
  }
  if (status === USER_STATUS.REGISTERED) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function normalizeUserDoc(snapshotDoc) {
  const data = snapshotDoc?.data?.() || {};
  return {
    id: String(snapshotDoc?.id || data?.id || ""),
    ...data
  };
}

function readArray(value) {
  return Array.isArray(value) ? value : [];
}

function isResearcherUser(user = {}) {
  return normalizeText(user?.type).toLowerCase() === "researcher";
}

function userBelongsToTenant(user = {}, tenantId = "") {
  const targetTenant = String(tenantId || "");
  if (!targetTenant) {
    return false;
  }

  if (isResearcherUser(user)) {
    return false;
  }

  const defaultTenantId = String(user?.default_tenant_id || "");
  if (defaultTenantId === targetTenant) {
    return true;
  }

  const directTenantId = String(user?.tenant_id || "");
  if (directTenantId === targetTenant) {
    return true;
  }

  const tenantIds = readArray(user?.tenant_ids).map((item) => String(item || ""));
  return tenantIds.includes(targetTenant);
}

function extractUserGroupRefs(user = {}) {
  const idRefs = new Set(
    [
      ...readArray(user?.team_ids),
      ...readArray(user?.group_ids),
      ...readArray(user?.user_group_ids),
      user?.team_id,
      user?.group_id,
      user?.user_group_id
    ]
      .map((value) => normalizeText(value))
      .filter(Boolean)
  );

  const nameRefs = new Set(
    [
      ...readArray(user?.team_names),
      ...readArray(user?.group_names),
      ...readArray(user?.user_group_names),
      user?.team_name,
      user?.group_name,
      user?.user_group_name
    ]
      .map((value) => normalizeCode(value))
      .filter(Boolean)
  );

  return { idRefs, nameRefs };
}

export default function UsersTeamsApp() {
  const { state, hydrationDone } = useDomainState();
  const { saveUserGroup, removeUserGroup } = useDomainActions();
  const activeTenantId = useMemo(() => selectActiveTenantId(state), [state]);
  const activeTenant = useMemo(() => selectActiveTenant(state), [state]);
  const userGroups = useMemo(
    () => (activeTenantId ? selectUserGroupsByTenant(state, activeTenantId) : []),
    [state, activeTenantId]
  );

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState("");
  const [newTeamName, setNewTeamName] = useState("");
  const [formError, setFormError] = useState("");
  const seededTenantsRef = useRef(new Set());

  useEffect(() => {
    if (!hasFirebaseConfig || !db) {
      setUsers([]);
      setUsersLoading(false);
      return () => undefined;
    }

    const unsubscribe = onSnapshot(
      collection(db, USERS_COLLECTION),
      (snapshot) => {
        setUsers((snapshot?.docs || []).map(normalizeUserDoc).filter((item) => Boolean(item.id)));
        setUsersLoading(false);
        setUsersError("");
      },
      (error) => {
        setUsers([]);
        setUsersLoading(false);
        setUsersError(error?.message || "Falha ao carregar usuarios.");
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

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

  const tenantUsers = useMemo(
    () => users.filter((user) => userBelongsToTenant(user, activeTenantId)),
    [users, activeTenantId]
  );

  const sortedGroups = useMemo(() => {
    const defaultOrder = new Map(
      DEFAULT_USER_GROUPS.map((item, index) => [normalizeCode(item.team_name), index])
    );
    return [...userGroups].sort((a, b) => {
      const codeA = normalizeCode(a?.team_name);
      const codeB = normalizeCode(b?.team_name);
      const orderA = defaultOrder.has(codeA) ? defaultOrder.get(codeA) : 999;
      const orderB = defaultOrder.has(codeB) ? defaultOrder.get(codeB) : 999;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return String(a?.team_name_display || a?.team_name || "").localeCompare(
        String(b?.team_name_display || b?.team_name || "")
      );
    });
  }, [userGroups]);

  const groupCards = useMemo(() => {
    const byId = new Map(sortedGroups.map((group) => [String(group.id), []]));
    const byCode = new Map(
      sortedGroups.map((group) => [normalizeCode(group.team_name), String(group.id)])
    );
    const unassigned = [];

    tenantUsers.forEach((user) => {
      const refs = extractUserGroupRefs(user);
      const matchedIds = new Set();

      refs.idRefs.forEach((groupId) => {
        if (byId.has(String(groupId))) {
          matchedIds.add(String(groupId));
        }
      });

      refs.nameRefs.forEach((groupCode) => {
        const groupId = byCode.get(groupCode);
        if (groupId) {
          matchedIds.add(groupId);
        }
      });

      if (matchedIds.size === 0) {
        unassigned.push(user);
        return;
      }

      matchedIds.forEach((groupId) => {
        byId.get(groupId)?.push(user);
      });
    });

    const adminGroup = sortedGroups.find(
      (group) => normalizeCode(group.team_name) === "ADMINISTRATIVO"
    );
    if (adminGroup && unassigned.length > 0) {
      const adminUsers = byId.get(String(adminGroup.id)) || [];
      byId.set(String(adminGroup.id), [...adminUsers, ...unassigned]);
    }

    return sortedGroups.map((group) => {
      const usersInGroup = (byId.get(String(group.id)) || [])
        .map((user) => ({
          id: String(user?.id || user?.uid || ""),
          name: resolveDisplayName(user),
          email: normalizeText(user?.email),
          status: resolveUserStatus(user)
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      return {
        ...group,
        users: usersInGroup
      };
    });
  }, [tenantUsers, sortedGroups]);

  function handleCreateGroup(event) {
    event.preventDefault();
    setFormError("");

    const teamNameDisplay = normalizeText(newTeamName);
    if (!teamNameDisplay) {
      setFormError("Informe o nome do time.");
      return;
    }
    if (!activeTenantId) {
      setFormError("Selecione uma conta ativa antes de criar times.");
      return;
    }

    const nextCode = normalizeCode(teamNameDisplay);
    const hasDuplicate = (userGroups || []).some(
      (group) => normalizeCode(group?.team_name) === nextCode
    );
    if (hasDuplicate) {
      setFormError("Ja existe um time com esse nome.");
      return;
    }

    saveUserGroup({
      tenant_id: activeTenantId,
      team_name_display: teamNameDisplay
    });
    setNewTeamName("");
  }

  function handleRemoveGroup(group) {
    if (!group?.id) {
      return;
    }
    if (group?.is_default) {
      return;
    }
    if (!window.confirm("Remover este time?")) {
      return;
    }
    removeUserGroup(group.id);
  }

  if (!hydrationDone) {
    return (
      <main className={"grid min-h-screen place-items-center bg-slate-100 p-6"}>
        <p className={"m-0 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"}>
          Carregando times...
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
      <div className={"mx-auto grid max-w-[1440px] gap-4"}>
        <header className={"flex items-center justify-between gap-4 rounded-[14px] bg-white/[0.85] px-5 py-[18px] shadow-[0_10px_20px_rgba(15,23,42,0.08)]"}>
          <div>
            <h1 className={"m-0 text-[30px] tracking-[0.5px]"}>TIMES</h1>
            <p className={"mb-0 mt-1 text-sm [opacity:0.85]"}>CONTA ativa: {activeTenant?.name || activeTenantId}</p>
          </div>
          <div className={"flex flex-wrap items-center gap-2"}>
            <Link href="/dashboard" className={"inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2.5 text-[13px] text-white no-underline"}>
              Dashboard
            </Link>
            <Link href="/map" className={"inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2.5 text-[13px] text-white no-underline"}>
              Mapa
            </Link>
          </div>
        </header>

        <section className={"rounded-xl border border-slate-200 bg-white p-4"}>
          <form onSubmit={handleCreateGroup} className={"grid gap-2 sm:grid-cols-[1fr_auto]"}>
            <input
              value={newTeamName}
              onChange={(event) => setNewTeamName(event.target.value)}
              placeholder="Nome do novo time"
              className={"w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"}
            />
            <button
              type="submit"
              className={"inline-flex h-[38px] items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 text-xs text-white"}
            >
              Criar time
            </button>
          </form>
          {formError ? <small className={"mt-1 block text-red-600"}>{formError}</small> : null}
          <small className={"mt-1 block text-slate-600"}>
            Times padrao: Administrativo, Marketing, Comercial, Compras e Pricing.
          </small>
        </section>

        <section className={"grid gap-3"}>
          {usersError ? (
            <article className={"rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"}>
              {usersError}
            </article>
          ) : null}

          {usersLoading ? (
            <article className={"rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700"}>
              Carregando usuarios...
            </article>
          ) : null}

          {!usersLoading && groupCards.length === 0 ? (
            <article className={"rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700"}>
              Nenhum time encontrado para esta conta.
            </article>
          ) : null}

          {groupCards.map((group) => (
            <article key={group.id} className={"rounded-xl border border-slate-200 bg-white p-4 shadow-[0_8px_18px_rgba(15,23,42,0.06)]"}>
              <div className={"mb-3 flex flex-wrap items-center justify-between gap-2"}>
                <div className={"flex items-center gap-2"}>
                  <strong>{group.team_name_display || group.team_name}</strong>
                  {group.is_default ? (
                    <span className={"inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] text-indigo-700"}>
                      padrao
                    </span>
                  ) : null}
                </div>
                <div className={"flex items-center gap-2"}>
                  <span className={"text-xs text-slate-600"}>{group.users.length} usuario(s)</span>
                  {!group.is_default ? (
                    <button
                      type="button"
                      onClick={() => handleRemoveGroup(group)}
                      className={"inline-flex h-[30px] items-center justify-center rounded-lg border border-red-200 bg-red-50 px-2.5 text-xs text-red-700"}
                    >
                      Remover
                    </button>
                  ) : null}
                </div>
              </div>

              {group.users.length === 0 ? (
                <small className={"text-slate-600"}>Nenhum usuario neste time.</small>
              ) : (
                <div className={"grid gap-2"}>
                  {group.users.map((user) => (
                    <div key={`${group.id}_${user.id}`} className={"flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2"}>
                      <div className={"grid gap-0.5"}>
                        <small className={"text-slate-900"}>{user.name}</small>
                        <small className={"text-slate-500"}>{user.email || "-"}</small>
                      </div>
                      <span className={`${"inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium"} ${statusClassName(user.status)}`}>
                        {statusLabel(user.status)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
