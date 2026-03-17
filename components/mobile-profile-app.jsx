"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useFirebaseAuth } from "../features/auth/state/firebase-auth-context";
import { useMobileResearchState } from "../features/mobile/state/mobile-research-state";

const EMPTY_FORM = {
  name: "",
  rg: "",
  cpf: "",
  home_address: "",
  work_address: "",
  preferred_tenants: [],
  home_geo_lat: "",
  home_geo_lon: "",
  home_geo_display_name: "",
  work_geo_lat: "",
  work_geo_lon: "",
  work_geo_display_name: ""
};

function toCoordinateInput(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }
  return String(value);
}

function toggleTenant(selectedIds = [], tenantId) {
  const normalized = String(tenantId || "").trim();
  if (!normalized) {
    return selectedIds;
  }

  const current = new Set((selectedIds || []).map((item) => String(item || "").trim()).filter(Boolean));
  if (current.has(normalized)) {
    current.delete(normalized);
  } else {
    current.add(normalized);
  }
  return [...current];
}

export default function MobileProfileApp() {
  const router = useRouter();
  const { currentUser, loading: authLoading, signOut } = useFirebaseAuth();
  const {
    hydrationDone,
    isResearcher,
    researcherProfile,
    tenantOptions,
    saveResearcherProfile,
    error
  } = useMobileResearchState();
  const [form, setForm] = useState(EMPTY_FORM);
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [geocodingHome, setGeocodingHome] = useState(false);
  const [geocodingWork, setGeocodingWork] = useState(false);
  const [tenantSearch, setTenantSearch] = useState("");

  const filteredTenantOptions = useMemo(() => {
    const needle = String(tenantSearch || "").trim().toLowerCase();
    if (!needle) {
      return tenantOptions || [];
    }
    return (tenantOptions || []).filter((tenant) =>
      String(tenant?.name || "").toLowerCase().includes(needle)
    );
  }, [tenantOptions, tenantSearch]);

  useEffect(() => {
    setForm({
      name: String(researcherProfile?.name || ""),
      rg: String(researcherProfile?.rg || ""),
      cpf: String(researcherProfile?.cpf || ""),
      home_address: String(researcherProfile?.home_address || ""),
      work_address: String(researcherProfile?.work_address || ""),
      preferred_tenants: Array.isArray(researcherProfile?.preferred_tenants)
        ? researcherProfile.preferred_tenants.map((item) => String(item || "").trim()).filter(Boolean)
        : [],
      home_geo_lat: toCoordinateInput(researcherProfile?.home_geo_lat),
      home_geo_lon: toCoordinateInput(researcherProfile?.home_geo_lon),
      home_geo_display_name: String(researcherProfile?.home_geo_display_name || ""),
      work_geo_lat: toCoordinateInput(researcherProfile?.work_geo_lat),
      work_geo_lon: toCoordinateInput(researcherProfile?.work_geo_lon),
      work_geo_display_name: String(researcherProfile?.work_geo_display_name || "")
    });
  }, [researcherProfile]);

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

  async function handleGeocode(kind) {
    const isHome = kind === "home";
    const addressValue = String(isHome ? form.home_address : form.work_address).trim();

    if (!addressValue) {
      setFeedback(isHome ? "Informe o endereco residencial para geolocalizar." : "Informe o endereco de trabalho para geolocalizar.");
      return;
    }

    if (isHome) {
      setGeocodingHome(true);
    } else {
      setGeocodingWork(true);
    }
    setFeedback("");

    try {
      const url = `/api/nominatim/search?q=${encodeURIComponent(addressValue)}&countrycodes=br`;
      const response = await fetch(url, { cache: "no-store" });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error || "Falha ao consultar geocodificacao.");
      }

      const first = Array.isArray(payload) ? payload[0] : null;
      if (!first) {
        throw new Error("Nenhum resultado encontrado para o endereco informado.");
      }

      const lat = Number(first?.lat);
      const lon = Number(first?.lon);
      const displayName = String(first?.display_name || "");

      setForm((previous) => ({
        ...previous,
        ...(isHome
          ? {
              home_geo_lat: Number.isFinite(lat) ? String(lat) : "",
              home_geo_lon: Number.isFinite(lon) ? String(lon) : "",
              home_geo_display_name: displayName
            }
          : {
              work_geo_lat: Number.isFinite(lat) ? String(lat) : "",
              work_geo_lon: Number.isFinite(lon) ? String(lon) : "",
              work_geo_display_name: displayName
            })
      }));

      setFeedback(isHome ? "Endereco residencial geolocalizado." : "Endereco de trabalho geolocalizado.");
    } catch (geocodeError) {
      setFeedback(geocodeError?.message || "Falha ao geolocalizar endereco.");
    } finally {
      if (isHome) {
        setGeocodingHome(false);
      } else {
        setGeocodingWork(false);
      }
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setFeedback("");

    try {
      await saveResearcherProfile({
        ...form,
        preferred_tenants: form.preferred_tenants
      });
      setFeedback("Perfil atualizado com sucesso.");
    } catch (saveError) {
      setFeedback(saveError?.message || "Falha ao salvar perfil.");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || !hydrationDone) {
    return (
      <main className={"grid min-h-screen place-items-center bg-[linear-gradient(160deg,#f8fafc_0%,#dbeafe_52%,#e2e8f0_100%)] p-6"}>
        <p className={"m-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-[0_12px_24px_rgba(15,23,42,0.08)]"}>
          Carregando perfil...
        </p>
      </main>
    );
  }

  if (!currentUser || !isResearcher) {
    return null;
  }

  return (
    <main className={"min-h-screen bg-[radial-gradient(circle_at_10%_12%,rgba(34,197,94,0.18),transparent_35%),radial-gradient(circle_at_88%_90%,rgba(59,130,246,0.2),transparent_40%),linear-gradient(145deg,#f8fafc_0%,#e2e8f0_46%,#f1f5f9_100%)] p-4 text-slate-900"}>
      <div className={"mx-auto grid max-w-[740px] gap-3"}>
        <header className={"grid gap-2 rounded-xl border border-slate-200 bg-white/[0.92] p-4 shadow-[0_10px_24px_rgba(15,23,42,0.08)]"}>
          <h1 className={"m-0 text-[28px]"}>PROFILE MOBILE</h1>
          <p className={"m-0 text-xs text-slate-600"}>Atualize os dados cadastrais e geolocalizacao do pesquisador.</p>
          <div className={"flex flex-wrap gap-2"}>
            <Link href="/dash-mobile" className={"inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 no-underline"}>
              Voltar para dashboard mobile
            </Link>
            <button
              type="button"
              onClick={async () => {
                await signOut();
                router.replace("/mobile");
              }}
              className={"cursor-pointer rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-xs text-white"}
            >
              Sair
            </button>
          </div>
        </header>

        {error ? (
          <p className={"m-0 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-800"}>{error}</p>
        ) : null}
        {feedback ? (
          <p className={"m-0 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-800"}>
            {feedback}
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className={"grid gap-2 rounded-xl border border-slate-200 bg-white/[0.9] p-3"}>
          <label className={"grid gap-1 text-xs"}>
            <span>Nome</span>
            <input
              type="text"
              required
              value={form.name}
              onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
              className={"rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-500"}
              placeholder="Nome completo"
            />
          </label>

          <label className={"grid gap-1 text-xs"}>
            <span>RG</span>
            <input
              type="text"
              required
              value={form.rg}
              onChange={(event) => setForm((previous) => ({ ...previous, rg: event.target.value }))}
              className={"rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-500"}
              placeholder="Documento RG"
            />
          </label>

          <label className={"grid gap-1 text-xs"}>
            <span>CPF</span>
            <input
              type="text"
              required
              value={form.cpf}
              onChange={(event) => setForm((previous) => ({ ...previous, cpf: event.target.value }))}
              className={"rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-500"}
              placeholder="000.000.000-00"
            />
          </label>

          <section className={"grid gap-2 rounded-lg border border-slate-200 p-2.5"}>
            <strong className={"text-xs"}>Endereco residencial</strong>
            <label className={"grid gap-1 text-xs"}>
              <span>Endereco</span>
              <textarea
                required
                value={form.home_address}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, home_address: event.target.value }))
                }
                className={"min-h-[84px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-500"}
                placeholder="Rua, numero, bairro, cidade, estado"
              />
            </label>
            <button
              type="button"
              onClick={() => handleGeocode("home")}
              disabled={geocodingHome}
              className={"w-fit cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"}
            >
              {geocodingHome ? "Geolocalizando..." : "Geolocalizar endereco residencial"}
            </button>
            <div className={"grid grid-cols-2 gap-2 max-[680px]:grid-cols-1"}>
              <label className={"grid gap-1 text-xs"}>
                <span>Latitude residencial</span>
                <input
                  value={form.home_geo_lat}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, home_geo_lat: event.target.value }))
                  }
                  className={"rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"}
                  placeholder="-23.550520"
                />
              </label>
              <label className={"grid gap-1 text-xs"}>
                <span>Longitude residencial</span>
                <input
                  value={form.home_geo_lon}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, home_geo_lon: event.target.value }))
                  }
                  className={"rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"}
                  placeholder="-46.633308"
                />
              </label>
            </div>
            <label className={"grid gap-1 text-xs"}>
              <span>Endereco geocodificado (residencial)</span>
              <input
                value={form.home_geo_display_name}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, home_geo_display_name: event.target.value }))
                }
                className={"rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"}
                placeholder="Preenchido pela consulta"
              />
            </label>
          </section>

          <section className={"grid gap-2 rounded-lg border border-slate-200 p-2.5"}>
            <strong className={"text-xs"}>Endereco de trabalho</strong>
            <label className={"grid gap-1 text-xs"}>
              <span>Endereco</span>
              <textarea
                required
                value={form.work_address}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, work_address: event.target.value }))
                }
                className={"min-h-[84px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-500"}
                placeholder="Rua, numero, bairro, cidade, estado"
              />
            </label>
            <button
              type="button"
              onClick={() => handleGeocode("work")}
              disabled={geocodingWork}
              className={"w-fit cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"}
            >
              {geocodingWork ? "Geolocalizando..." : "Geolocalizar endereco de trabalho"}
            </button>
            <div className={"grid grid-cols-2 gap-2 max-[680px]:grid-cols-1"}>
              <label className={"grid gap-1 text-xs"}>
                <span>Latitude trabalho</span>
                <input
                  value={form.work_geo_lat}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, work_geo_lat: event.target.value }))
                  }
                  className={"rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"}
                  placeholder="-23.550520"
                />
              </label>
              <label className={"grid gap-1 text-xs"}>
                <span>Longitude trabalho</span>
                <input
                  value={form.work_geo_lon}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, work_geo_lon: event.target.value }))
                  }
                  className={"rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"}
                  placeholder="-46.633308"
                />
              </label>
            </div>
            <label className={"grid gap-1 text-xs"}>
              <span>Endereco geocodificado (trabalho)</span>
              <input
                value={form.work_geo_display_name}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, work_geo_display_name: event.target.value }))
                }
                className={"rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"}
                placeholder="Preenchido pela consulta"
              />
            </label>
          </section>

          <section className={"grid gap-2 rounded-lg border border-slate-200 p-2.5"}>
            <strong className={"text-xs"}>Tenants de interesse (opcional)</strong>
            <label className={"grid gap-1 text-xs"}>
              <span>Buscar tenant por nome</span>
              <input
                value={tenantSearch}
                onChange={(event) => setTenantSearch(event.target.value)}
                className={"rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"}
                placeholder="Digite parte do nome do tenant"
              />
            </label>
            <div className={"max-h-[220px] overflow-auto rounded-lg border border-slate-200 p-2"}>
              {filteredTenantOptions.length === 0 ? (
                <small className={"text-xs text-slate-600"}>Nenhum tenant encontrado.</small>
              ) : (
                <div className={"grid gap-1"}>
                  {filteredTenantOptions.map((tenant) => {
                    const tenantId = String(tenant?.id || "");
                    const checked = (form.preferred_tenants || []).includes(tenantId);
                    return (
                      <label key={tenantId} className={"flex items-center gap-2 text-xs"}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setForm((previous) => ({
                              ...previous,
                              preferred_tenants: toggleTenant(previous.preferred_tenants, tenantId)
                            }))
                          }
                        />
                        <span>{tenant?.name || tenantId}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <button
            type="submit"
            disabled={saving}
            className={"cursor-pointer rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"}
          >
            {saving ? "Salvando..." : "Salvar perfil"}
          </button>
        </form>
      </div>
    </main>
  );
}
