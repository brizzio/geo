"use client";

import { useEffect, useState } from "react";

const FIELD_CLASS =
  "grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px]";

const SECONDARY_BUTTON_CLASS =
  "cursor-pointer rounded-md border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60";

function extractLatlonParts(value = "") {
  const matches = String(value || "").match(/[-+]?\d+(?:[.,]\d+)?/g) || [];
  return {
    lat: matches[0] || "",
    lon: matches[1] || ""
  };
}

export default function AddressFieldset({
  address = {},
  onAddressChange,
  searchValue,
  onSearchValueChange,
  onSearch,
  searching = false,
  searchLabel = "Endereco (busca)",
  searchPlaceholder = "Ex: Setor B Norte CNB 12, Taguatinga, Brasilia, DF",
  searchButtonLabel = "Consultar endereco",
  options = [],
  selectedOption = "0",
  onSelectedOptionChange,
  latlonValue = "",
  onLatlonCommit = () => {},
  latlonTitle = "Latitude / Longitude"
}) {
  const initialParts = extractLatlonParts(latlonValue);
  const [latlonDraft, setLatlonDraft] = useState(latlonValue || "");
  const [latDraft, setLatDraft] = useState(initialParts.lat);
  const [lonDraft, setLonDraft] = useState(initialParts.lon);

  useEffect(() => {
    const parts = extractLatlonParts(latlonValue);
    setLatlonDraft(latlonValue || "");
    setLatDraft(parts.lat);
    setLonDraft(parts.lon);
  }, [latlonValue]);

  function commitSplitLatlon() {
    const lat = String(latDraft || "").trim();
    const lon = String(lonDraft || "").trim();

    if (!lat && !lon) {
      onLatlonCommit("");
      return;
    }

    if (!lat || !lon) {
      return;
    }

    onLatlonCommit(`${lat}, ${lon}`);
  }

  return (
    <section className={"grid gap-2 rounded-lg border border-slate-200 p-3"}>
      <h3 className={"m-0 text-sm font-semibold text-slate-800"}>Endereço:</h3>

      <div className={"grid grid-cols-2 gap-2 max-[980px]:grid-cols-1"}>
        <label className={`${FIELD_CLASS} max-[980px]:col-span-1 col-span-2`}>
          <span>{searchLabel}</span>
          <input
            value={searchValue || ""}
            onChange={(event) => onSearchValueChange(event.target.value)}
            placeholder={searchPlaceholder}
          />
        </label>
        <div className={"flex items-end"}>
          <button
            type="button"
            className={SECONDARY_BUTTON_CLASS}
            onClick={onSearch}
            disabled={searching}
          >
            {searching ? "Consultando..." : searchButtonLabel}
          </button>
        </div>
      </div>

      <div className={"grid grid-cols-2 gap-2 max-[980px]:grid-cols-1"}>
        <label className={FIELD_CLASS}>
          <span>Cidade</span>
          <input
            value={address.city || ""}
            onChange={(event) => onAddressChange("city", event.target.value)}
            placeholder="Cidade"
          />
        </label>
        <label className={FIELD_CLASS}>
          <span>Estado</span>
          <input
            value={address.state || ""}
            onChange={(event) => onAddressChange("state", event.target.value)}
            placeholder="Estado / UF"
          />
        </label>
      </div>

      <div className={"grid grid-cols-2 gap-2 max-[980px]:grid-cols-1"}>
        <label className={FIELD_CLASS}>
          <span>Endereco</span>
          <input
            value={address.street || ""}
            onChange={(event) => onAddressChange("street", event.target.value)}
            placeholder="Rua / Avenida"
          />
        </label>
        <label className={FIELD_CLASS}>
          <span>Numero</span>
          <input
            value={address.street_number || ""}
            onChange={(event) => onAddressChange("street_number", event.target.value)}
            placeholder="Numero"
          />
        </label>
      </div>

      <div className={"grid grid-cols-3 gap-2 max-[980px]:grid-cols-1"}>
        <label className={FIELD_CLASS}>
          <span>Bairro</span>
          <input
            value={address.neighbourhood || ""}
            onChange={(event) => onAddressChange("neighbourhood", event.target.value)}
            placeholder="Bairro"
          />
        </label>
        <label className={FIELD_CLASS}>
          <span>CEP</span>
          <input
            value={address.postcode || ""}
            onChange={(event) => onAddressChange("postcode", event.target.value)}
            placeholder="CEP"
          />
        </label>
        <label className={FIELD_CLASS}>
          <span>Pais</span>
          <input
            value={address.country || ""}
            onChange={(event) => onAddressChange("country", event.target.value)}
            placeholder="Pais"
          />
        </label>
      </div>

      <label className={FIELD_CLASS}>
        <span>Endereco completo (Nominatim)</span>
        <input
          value={address.display_name || ""}
          onChange={(event) => onAddressChange("display_name", event.target.value)}
          placeholder="Preenchido automaticamente ao consultar"
        />
      </label>

      {options.length > 0 ? (
        <label className={FIELD_CLASS}>
          <span>
            Resultados do Nominatim {options.length === 1 ? "(1 resultado)" : `(${options.length})`}
          </span>
          <select
            value={selectedOption}
            onChange={(event) => onSelectedOptionChange(event.target.value)}
          >
            {options.map((option, index) => {
              const label = option?.address?.display_name || "Endereco";
              return (
                <option key={`${option?.raw?.place_id || label}-${index}`} value={String(index)}>
                  {label}
                </option>
              );
            })}
          </select>
        </label>
      ) : null}

      <label className={FIELD_CLASS}>
        <span>{latlonTitle}</span>
        <input
          value={latlonDraft}
          onChange={(event) => setLatlonDraft(event.target.value)}
          onBlur={() => onLatlonCommit(latlonDraft)}
          placeholder="-15.793889, -47.882778"
        />
      </label>

      <div className={"grid grid-cols-2 gap-2 max-[980px]:grid-cols-1"}>
        <label className={FIELD_CLASS}>
          <span>Latitude</span>
          <input
            value={latDraft}
            onChange={(event) => setLatDraft(event.target.value)}
            onBlur={commitSplitLatlon}
            placeholder="-15.793889"
          />
        </label>
        <label className={FIELD_CLASS}>
          <span>Longitude</span>
          <input
            value={lonDraft}
            onChange={(event) => setLonDraft(event.target.value)}
            onBlur={commitSplitLatlon}
            placeholder="-47.882778"
          />
        </label>
      </div>
    </section>
  );
}
