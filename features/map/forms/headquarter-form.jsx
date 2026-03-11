"use client";

import { useState } from "react";

const INITIAL_STATE = {
  internal_code: "",
  name: "",
  legal_type: "",
  industry: "",
  fiscal_code: "",
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

export default function HeadquarterForm({ onCancel, onSave, saving = false }) {
  const [values, setValues] = useState(INITIAL_STATE);
  const [error, setError] = useState("");

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
      setError("Nome da matriz é obrigatório.");
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
      setError(err?.message || "Falha ao salvar matriz.");
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10 }}>
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
            placeholder="Nome da matriz"
            required
          />
        </label>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <label style={{ display: "grid", gap: 4 }}>
          <span style={{ fontSize: 12 }}>Ramo</span>
          <input
            value={values.industry}
            onChange={(e) => update("industry", e.target.value)}
            placeholder="Ex: retail"
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
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <label style={{ display: "grid", gap: 4 }}>
          <span style={{ fontSize: 12 }}>CNPJ</span>
          <input
            value={values.fiscal_code}
            onChange={(e) => update("fiscal_code", e.target.value)}
            placeholder="00.000.000/0000-00"
          />
        </label>
        <label style={{ display: "grid", gap: 4 }}>
          <span style={{ fontSize: 12 }}>Descrição</span>
          <input
            value={values.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Descrição"
          />
        </label>
      </div>

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

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <label style={{ display: "grid", gap: 4 }}>
            <span style={{ fontSize: 12 }}>CEP</span>
            <input
              value={values.address.postcode}
              onChange={(e) => updateAddress("postcode", e.target.value)}
              placeholder="CEP"
            />
          </label>
          <label style={{ display: "grid", gap: 4 }}>
            <span style={{ fontSize: 12 }}>País</span>
            <input
              value={values.address.country}
              onChange={(e) => updateAddress("country", e.target.value)}
              placeholder="País"
            />
          </label>
        </div>
      </div>

      {error ? <p style={{ margin: 0, fontSize: 12, color: "#a12222" }}>{error}</p> : null}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button type="button" onClick={onCancel} disabled={saving}>
          Cancelar
        </button>
        <button type="submit" disabled={saving}>
          {saving ? "Salvando..." : "Salvar Matriz"}
        </button>
      </div>
    </form>
  );
}
