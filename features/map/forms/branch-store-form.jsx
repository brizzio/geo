"use client";

import { useEffect, useState } from "react";
import { useMapLookups } from "../hooks/use-map-lookups";

const INITIAL_STATE = {
  parent_id: "",
  banner_id: "",
  internal_code: "",
  name: "",
  legal_type: "",
  store_type: "",
  fiscal_code: "",
  description: "",
  color: "",
  address: {
    street: "",
    street_number: "",
    neighbourhood: "",
    city: "",
    state: "",
    postcode: "",
    country: "Brasil"
  }
};

export default function BranchStoreForm({
  onCancel,
  onSave,
  saving = false,
  tenantId = "tenant1"
}) {
  const { loadBannerOptions, loadStoreTypeOptions, loadHeadquarterStoreOptions } = useMapLookups();
  const [values, setValues] = useState(INITIAL_STATE);
  const [error, setError] = useState("");
  const [bannerOptions, setBannerOptions] = useState([]);
  const [storeTypeOptions, setStoreTypeOptions] = useState([]);
  const [hqStoreOptions, setHqStoreOptions] = useState([]);

  useEffect(() => {
    setBannerOptions(loadBannerOptions(tenantId));
    setStoreTypeOptions(loadStoreTypeOptions("pt-BR"));
    setHqStoreOptions(loadHeadquarterStoreOptions(tenantId));
  }, [loadBannerOptions, loadStoreTypeOptions, loadHeadquarterStoreOptions, tenantId]);

  function update(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function updateAddress(field, value) {
    setValues((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!values.name.trim()) {
      setError("Nome da loja de rede é obrigatório.");
      return;
    }
    if (!values.parent_id) {
      setError("Selecione a loja matriz.");
      return;
    }
    if (!values.banner_id) {
      setError("Selecione a bandeira.");
      return;
    }
    if (!values.store_type) {
      setError("Selecione o tipo de loja.");
      return;
    }
    if (!values.address.street.trim() || !values.address.city.trim() || !values.address.state.trim()) {
      setError("Preencha rua, cidade e estado para geolocalizar.");
      return;
    }

    try {
      await onSave(values);
      setValues(INITIAL_STATE);
    } catch (err) {
      setError(err?.message || "Falha ao salvar loja de rede.");
    }
  }

  const blockingMessage =
    hqStoreOptions.length === 0
      ? "Nenhuma loja matriz cadastrada. Cadastre uma loja matriz antes de criar loja de rede."
      : bannerOptions.length === 0
        ? "Nenhuma bandeira cadastrada. Cadastre uma bandeira antes de criar loja de rede."
        : "";

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10 }}>
      {blockingMessage ? (
        <p style={{ margin: 0, fontSize: 12, color: "#a12222" }}>{blockingMessage}</p>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <label style={{ display: "grid", gap: 4 }}>
          <span style={{ fontSize: 12 }}>Loja Matriz</span>
          <select value={values.parent_id} onChange={(e) => update("parent_id", e.target.value)}>
            <option value="">Selecione...</option>
            {hqStoreOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "grid", gap: 4 }}>
          <span style={{ fontSize: 12 }}>Bandeira</span>
          <select value={values.banner_id} onChange={(e) => update("banner_id", e.target.value)}>
            <option value="">Selecione...</option>
            {bannerOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 8 }}>
        <label style={{ display: "grid", gap: 4 }}>
          <span style={{ fontSize: 12 }}>Código</span>
          <input
            value={values.internal_code}
            onChange={(e) => update("internal_code", e.target.value)}
            placeholder="Código interno"
          />
        </label>
        <label style={{ display: "grid", gap: 4 }}>
          <span style={{ fontSize: 12 }}>Nome</span>
          <input
            value={values.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Nome da loja de rede"
            required
          />
        </label>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        <label style={{ display: "grid", gap: 4 }}>
          <span style={{ fontSize: 12 }}>Tipo de Loja</span>
          <select value={values.store_type} onChange={(e) => update("store_type", e.target.value)}>
            <option value="">Selecione...</option>
            {storeTypeOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "grid", gap: 4 }}>
          <span style={{ fontSize: 12 }}>Tipo Jurídico</span>
          <input
            value={values.legal_type}
            onChange={(e) => update("legal_type", e.target.value)}
            placeholder="Ex: LTDA"
          />
        </label>
        <label style={{ display: "grid", gap: 4 }}>
          <span style={{ fontSize: 12 }}>CNPJ</span>
          <input
            value={values.fiscal_code}
            onChange={(e) => update("fiscal_code", e.target.value)}
            placeholder="00.000.000/0000-00"
          />
        </label>
      </div>

      <label style={{ display: "grid", gap: 4 }}>
        <span style={{ fontSize: 12 }}>Descrição</span>
        <input
          value={values.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="Descrição"
        />
      </label>

      <div style={{ borderTop: "1px solid #ddd", paddingTop: 8, display: "grid", gap: 8 }}>
        <strong style={{ fontSize: 12 }}>Endereço</strong>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8 }}>
          <label style={{ display: "grid", gap: 4 }}>
            <span style={{ fontSize: 12 }}>Rua</span>
            <input
              value={values.address.street}
              onChange={(e) => updateAddress("street", e.target.value)}
              placeholder="Rua / Avenida"
            />
          </label>
          <label style={{ display: "grid", gap: 4 }}>
            <span style={{ fontSize: 12 }}>Número</span>
            <input
              value={values.address.street_number}
              onChange={(e) => updateAddress("street_number", e.target.value)}
              placeholder="Número"
            />
          </label>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <label style={{ display: "grid", gap: 4 }}>
            <span style={{ fontSize: 12 }}>Bairro</span>
            <input
              value={values.address.neighbourhood}
              onChange={(e) => updateAddress("neighbourhood", e.target.value)}
              placeholder="Bairro"
            />
          </label>
          <label style={{ display: "grid", gap: 4 }}>
            <span style={{ fontSize: 12 }}>Cidade</span>
            <input
              value={values.address.city}
              onChange={(e) => updateAddress("city", e.target.value)}
              placeholder="Cidade"
            />
          </label>
          <label style={{ display: "grid", gap: 4 }}>
            <span style={{ fontSize: 12 }}>Estado</span>
            <input
              value={values.address.state}
              onChange={(e) => updateAddress("state", e.target.value)}
              placeholder="UF"
            />
          </label>
        </div>
      </div>

      {error ? <p style={{ margin: 0, fontSize: 12, color: "#a12222" }}>{error}</p> : null}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button type="button" onClick={onCancel} disabled={saving}>
          Cancelar
        </button>
        <button type="submit" disabled={saving || !!blockingMessage}>
          {saving ? "Salvando..." : "Salvar Loja de Rede"}
        </button>
      </div>
    </form>
  );
}
