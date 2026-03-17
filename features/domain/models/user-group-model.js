import { buildId, normalizeText, nowIso, requireField } from "./model-utils";

export const DEFAULT_USER_GROUPS = [
  { team_name: "ADMINISTRATIVO", team_name_display: "Administrativo", is_default: true },
  { team_name: "MARKETING", team_name_display: "Marketing", is_default: true },
  { team_name: "COMERCIAL", team_name_display: "Comercial", is_default: true },
  { team_name: "COMPRAS", team_name_display: "Compras", is_default: true },
  { team_name: "PRICING", team_name_display: "Pricing", is_default: true }
];

function normalizeTeamName(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return null;
  }

  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}

export function createUserGroupModel(values = {}) {
  const tenantId = String(values?.tenant_id || "").trim();
  const teamNameDisplay = normalizeText(values?.team_name_display || values?.team_name || "");
  const teamName = normalizeTeamName(values?.team_name || teamNameDisplay);

  requireField(tenantId, "Tenant e obrigatorio para criar time.");
  requireField(teamNameDisplay, "Nome do time e obrigatorio.");
  requireField(teamName, "Codigo do time e obrigatorio.");

  return {
    id: values?.id || buildId("group"),
    tenant_id: tenantId,
    team_name: teamName,
    team_name_display: teamNameDisplay,
    permissions: Array.isArray(values?.permissions) ? values.permissions : [],
    is_default: Boolean(values?.is_default),
    created_at: values?.created_at || nowIso(),
    updated_at: nowIso()
  };
}
