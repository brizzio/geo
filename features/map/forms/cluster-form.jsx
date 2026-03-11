"use client";

import { useState } from "react";

const INITIAL_STATE = {
  code: "",
  name: "",
  description: ""
};

export default function ClusterForm({ onCancel, onSave, saving = false }) {
  const [values, setValues] = useState(INITIAL_STATE);
  const [error, setError] = useState("");

  function update(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!values.name.trim()) {
      setError("Nome do cluster é obrigatório.");
      return;
    }

    try {
      await onSave(values);
      setValues(INITIAL_STATE);
    } catch (err) {
      setError(err?.message || "Falha ao salvar cluster.");
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10 }}>
      <label style={{ display: "grid", gap: 4 }}>
        <span style={{ fontSize: 12 }}>Código</span>
        <input
          value={values.code}
          onChange={(e) => update("code", e.target.value)}
          placeholder="Código do cluster"
        />
      </label>

      <label style={{ display: "grid", gap: 4 }}>
        <span style={{ fontSize: 12 }}>Nome</span>
        <input
          value={values.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="Nome do cluster"
          required
        />
      </label>

      <label style={{ display: "grid", gap: 4 }}>
        <span style={{ fontSize: 12 }}>Descrição</span>
        <textarea
          value={values.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="Breve descrição"
          rows={3}
        />
      </label>

      {error ? <p style={{ margin: 0, fontSize: 12, color: "#a12222" }}>{error}</p> : null}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button type="button" onClick={onCancel} disabled={saving}>
          Cancelar
        </button>
        <button type="submit" disabled={saving}>
          {saving ? "Salvando..." : "Salvar Cluster"}
        </button>
      </div>
    </form>
  );
}
