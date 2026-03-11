"use client";

import { useEffect, useState } from "react";
import { useMapLookups } from "../hooks/use-map-lookups";

const INITIAL_STATE = {
  cluster_id: "",
  banner_id: "",
  name: "",
  corporate_name: "",
  fiscal_code: "",
  legal_type: "",
  store_type: "",
  description: "",
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

export default function ConcurrentStoreForm({
  onCancel,
  onSave,
  saving = false,
  tenantId = "tenant1"
}) {
  const { loadBannerOptions, loadStoreTypeOptions, loadClusterOptions } = useMapLookups();
  const [values, setValues] = useState(INITIAL_STATE);
  const [error, setError] = useState("");
  const [bannerOptions, setBannerOptions] = useState([]);
  const [storeTypeOptions, setStoreTypeOptions] = useState([]);
  const [clusterOptions, setClusterOptions] = useState([]);

  useEffect(() => {
    setBannerOptions(loadBannerOptions(tenantId));
    setStoreTypeOptions(loadStoreTypeOptions("pt-BR"));
    setClusterOptions(loadClusterOptions(tenantId));
  }, [loadBannerOptions, loadStoreTypeOptions, loadClusterOptions, tenantId]);

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
      setError("Nome do concorrente é obrigatório.");
      return;
    }
    if (!values.cluster_id) {
      setError("Selecione um cluster.");
      return;
    }
    if (!values.banner_id) {
      setError("Selecione uma bandeira.");
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
      setError(err?.message || "Falha ao salvar concorrente.");
    }
  }

  const blockingMessage =
    clusterOptions.length === 0
      ? "Nenhum cluster cadastrado. Cadastre um cluster antes de criar concorrente."
      : bannerOptions.length === 0
        ? "Nenhuma bandeira cadastrada. Cadastre uma bandeira antes de criar concorrente."
        : "";

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10 }}>
      {blockingMessage ? (
        <p style={{ margin: 0, fontSize: 12, color: "#a12222" }}>{blockingMessage}</p>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <label style={{ display: "grid", gap: 4 }}>
          <span style={{ fontSize: 12 }}>Cluster</span>
          <select value={values.cluster_id} onChange={(e) => update("cluster_id", e.target.value)}>
            <option value="">Selecione...</option>
            {clusterOptions.map((option) => (
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <label style={{ display: "grid", gap: 4 }}>
          <span style={{ fontSize: 12 }}>Nome</span>
          <input
            value={values.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Nome do concorrente"
            required
          />
        </label>
        <label style={{ display: "grid", gap: 4 }}>
          <span style={{ fontSize: 12 }}>Razão Social</span>
          <input
            value={values.corporate_name}
            onChange={(e) => update("corporate_name", e.target.value)}
            placeholder="Razão social"
          />
        </label>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        <label style={{ display: "grid", gap: 4 }}>
          <span style={{ fontSize: 12 }}>CNPJ</span>
          <input
            value={values.fiscal_code}
            onChange={(e) => update("fiscal_code", e.target.value)}
            placeholder="00.000.000/0000-00"
          />
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
          {saving ? "Salvando..." : "Salvar Concorrente"}
        </button>
      </div>
    </form>
  );
}
