"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useDomainActions } from "../features/domain/hooks/use-domain-actions";
import { useDomainState } from "../features/domain/state/domain-state";
import {
  selectActiveTenant,
  selectActiveTenantId,
  selectUserGroupsByTenant
} from "../features/domain/state/selectors";
import {
  APP_ROUTE_PERMISSIONS,
  createDefaultPermissions
} from "../features/users/permissions-catalog";

function normalizeText(value) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
}

function normalizeSavedPermission(entry = {}, fallback = {}) {
  return {
    route_key: normalizeText(entry?.route_key || fallback?.route_key),
    route_name: normalizeText(entry?.route_name || fallback?.route_name),
    route_path: normalizeText(entry?.route_path || fallback?.route_path),
    can_view: Boolean(entry?.can_view),
    can_create: Boolean(entry?.can_create),
    can_edit: Boolean(entry?.can_edit),
    can_delete: Boolean(entry?.can_delete)
  };
}

function mergePermissions(savedPermissions = []) {
  const defaults = createDefaultPermissions();
  const savedByKey = new Map();

  (Array.isArray(savedPermissions) ? savedPermissions : []).forEach((entry) => {
    const routeKey = normalizeText(entry?.route_key);
    const routePath = normalizeText(entry?.route_path);
    if (routeKey) {
      savedByKey.set(`key:${routeKey}`, entry);
    }
    if (routePath) {
      savedByKey.set(`path:${routePath}`, entry);
    }
  });

  return defaults.map((entry) => {
    const byKey = savedByKey.get(`key:${entry.route_key}`) || null;
    const byPath = savedByKey.get(`path:${entry.route_path}`) || null;
    return normalizeSavedPermission(byKey || byPath || {}, entry);
  });
}

export default function UserGroupPermissionsApp({ groupId }) {
  const { state, hydrationDone } = useDomainState();
  const { saveUserGroup } = useDomainActions();
  const activeTenantId = useMemo(() => selectActiveTenantId(state), [state]);
  const activeTenant = useMemo(() => selectActiveTenant(state), [state]);
  const userGroups = useMemo(
    () => (activeTenantId ? selectUserGroupsByTenant(state, activeTenantId) : []),
    [state, activeTenantId]
  );
  const group = useMemo(
    () => userGroups.find((item) => String(item.id) === String(groupId)) || null,
    [userGroups, groupId]
  );

  const [permissions, setPermissions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!group) {
      setPermissions([]);
      return;
    }
    setPermissions(mergePermissions(group.permissions || []));
  }, [group]);

  function updatePermission(index, field, value) {
    setPermissions((previous) =>
      previous.map((item, currentIndex) =>
        currentIndex === index ? { ...item, [field]: Boolean(value) } : item
      )
    );
  }

  async function handleSave(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!group) {
      setError("Grupo nao encontrado.");
      return;
    }

    setSaving(true);
    try {
      saveUserGroup({
        ...group,
        permissions: permissions.map((item) => ({
          route_key: item.route_key,
          route_name: item.route_name,
          route_path: item.route_path,
          can_view: Boolean(item.can_view),
          can_create: Boolean(item.can_create),
          can_edit: Boolean(item.can_edit),
          can_delete: Boolean(item.can_delete)
        }))
      });
      setSuccess("Permissoes salvas com sucesso.");
    } catch (saveError) {
      setError(saveError?.message || "Falha ao salvar permissoes.");
    } finally {
      setSaving(false);
    }
  }

  if (!hydrationDone) {
    return (
      <main className={"grid min-h-screen place-items-center bg-slate-100 p-6"}>
        <p className={"m-0 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"}>
          Carregando configuracoes...
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

  if (!group) {
    return (
      <main className={"grid min-h-screen place-items-center bg-slate-100 p-6"}>
        <div className={"grid gap-2 rounded-lg border border-slate-200 bg-white p-4"}>
          <strong>Grupo nao encontrado para a conta ativa.</strong>
          <Link href="/users" className={"inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-xs text-white no-underline"}>
            Voltar para Times
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className={"min-h-screen p-6 text-slate-900 bg-[radial-gradient(circle_at_12%_10%,rgba(255,208,82,0.18),transparent_32%),radial-gradient(circle_at_85%_90%,rgba(37,99,235,0.16),transparent_40%),linear-gradient(180deg,#f7f7f8_0%,#f0f2f5_100%)]"}>
      <div className={"mx-auto grid max-w-[1280px] gap-4"}>
        <header className={"flex items-center justify-between gap-4 rounded-[14px] bg-white/[0.85] px-5 py-[18px] shadow-[0_10px_20px_rgba(15,23,42,0.08)]"}>
          <div>
            <h1 className={"m-0 text-[30px] tracking-[0.5px]"}>
              Configuracoes para o Time {group.team_name_display || group.team_name}
            </h1>
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

        <section className={"rounded-xl border border-slate-200 bg-white p-4 shadow-[0_8px_18px_rgba(15,23,42,0.06)]"}>
          <form onSubmit={handleSave} className={"grid gap-3"}>
            <div className={"overflow-x-auto rounded-lg border border-slate-200"}>
              <table className={"w-full border-collapse text-sm"}>
                <thead className={"bg-slate-50"}>
                  <tr>
                    <th className={"px-3 py-2 text-left font-semibold text-slate-700"}>Rota</th>
                    <th className={"px-3 py-2 text-left font-semibold text-slate-700"}>Ver</th>
                    <th className={"px-3 py-2 text-left font-semibold text-slate-700"}>Criar</th>
                    <th className={"px-3 py-2 text-left font-semibold text-slate-700"}>Editar</th>
                    <th className={"px-3 py-2 text-left font-semibold text-slate-700"}>Apagar</th>
                  </tr>
                </thead>
                <tbody>
                  {permissions.map((item, index) => (
                    <tr key={item.route_key || item.route_path} className={"border-t border-slate-200"}>
                      <td className={"px-3 py-2"}>
                        <div className={"grid"}>
                          <strong className={"text-slate-900"}>{item.route_name}</strong>
                          <small className={"text-slate-500"}>{item.route_path}</small>
                        </div>
                      </td>
                      <td className={"px-3 py-2"}>
                        <input
                          type="checkbox"
                          checked={Boolean(item.can_view)}
                          onChange={(event) => updatePermission(index, "can_view", event.target.checked)}
                        />
                      </td>
                      <td className={"px-3 py-2"}>
                        <input
                          type="checkbox"
                          checked={Boolean(item.can_create)}
                          onChange={(event) => updatePermission(index, "can_create", event.target.checked)}
                        />
                      </td>
                      <td className={"px-3 py-2"}>
                        <input
                          type="checkbox"
                          checked={Boolean(item.can_edit)}
                          onChange={(event) => updatePermission(index, "can_edit", event.target.checked)}
                        />
                      </td>
                      <td className={"px-3 py-2"}>
                        <input
                          type="checkbox"
                          checked={Boolean(item.can_delete)}
                          onChange={(event) => updatePermission(index, "can_delete", event.target.checked)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="submit"
              disabled={saving}
              className={"inline-flex h-[38px] items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 text-xs text-white disabled:cursor-not-allowed disabled:opacity-60"}
            >
              {saving ? "Salvando..." : "Salvar permissoes"}
            </button>
          </form>

          {error ? <small className={"mt-2 block text-red-600"}>{error}</small> : null}
          {success ? <small className={"mt-2 block text-emerald-700"}>{success}</small> : null}
          <small className={"mt-1 block text-slate-500"}>
            Rotas catalogadas: {APP_ROUTE_PERMISSIONS.length}
          </small>
        </section>
      </div>
    </main>
  );
}
