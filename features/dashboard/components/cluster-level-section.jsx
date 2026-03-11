"use client";

import { useState } from "react";
import SectionCard from "./section-card";

export default function ClusterLevelSection({
  enabled = true,
  levels = [],
  onSave,
  onDelete,
  title = "Niveis de Concorrencia",
  hint = "Niveis padrao: PRIMARIO, SECUNDARIO, TERCIARIO e ESTUDO. Voce pode criar niveis adicionais."
}) {
  const [form, setForm] = useState({
    id: null,
    name: "",
    code: "",
    sort_order: 100
  });
  const [error, setError] = useState("");

  function resetForm() {
    setForm({ id: null, name: "", code: "", sort_order: 100 });
  }

  function editLevel(level) {
    if (level.is_system) {
      return;
    }
    setForm({
      id: level.id,
      name: level.name || "",
      code: level.code || "",
      sort_order: level.sort_order ?? 100
    });
  }

  function submit(event) {
    event.preventDefault();
    setError("");
    try {
      onSave({
        ...form,
        sort_order: Number(form.sort_order) || 100
      });
      resetForm();
    } catch (err) {
      setError(err?.message || "Falha ao salvar nivel.");
    }
  }

  return (
    <SectionCard title={title} hint={hint}>
      {!enabled ? <div className={"rounded-lg border border-dashed border-slate-300 p-2.5 text-xs opacity-75"}>Complete os dados basicos do cluster para editar niveis.</div> : null}

      <form onSubmit={submit} className={"grid gap-2"}>
        <div className={"grid grid-cols-3 gap-2 max-[980px]:grid-cols-1"}>
          <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
            <span>Nome</span>
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: PREMIUM"
              disabled={!enabled}
              required
            />
          </label>
          <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
            <span>Codigo</span>
            <input
              value={form.code}
              onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
              placeholder="Ex: PREMIUM"
              disabled={!enabled}
            />
          </label>
          <label className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
            <span>Ordem</span>
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm((prev) => ({ ...prev, sort_order: e.target.value }))}
              disabled={!enabled}
            />
          </label>
        </div>
        {error ? <p className={"m-0 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-800"}>{error}</p> : null}
        <div className={"flex flex-wrap gap-2"}>
          <button type="submit" className={"cursor-pointer rounded-md border-0 bg-slate-800 px-2.5 py-2 text-xs text-white"} disabled={!enabled}>
            {form.id ? "Atualizar nivel" : "Criar nivel"}
          </button>
          {form.id ? (
            <button type="button" className={`${"cursor-pointer rounded-md border-0 bg-slate-800 px-2.5 py-2 text-xs text-white"} ${"border border-slate-300 bg-white text-slate-900"}`} onClick={resetForm}>
              Cancelar edicao
            </button>
          ) : null}
        </div>
      </form>

      <div className={"grid gap-1.5"}>
        {levels.length === 0 ? (
          <div className={"rounded-lg border border-dashed border-slate-300 p-2.5 text-xs opacity-75"}>Nenhum nivel cadastrado.</div>
        ) : (
          levels.map((level) => (
            <article key={level.id} className={"grid gap-1.5 rounded-lg border border-slate-200 bg-white p-2"}>
              <div className={"flex items-center justify-between gap-2"}>
                <strong>{level.name}</strong>
                <div className={"flex flex-wrap gap-1.5"}>
                  <span className={"rounded-full border border-slate-300 px-2 py-0.5 text-[11px]"}>{level.code}</span>
                  {level.is_system ? <span className={`${"inline-flex items-center justify-center rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] text-indigo-900"} ${"bg-amber-100 text-amber-800"}`}>Padrao</span> : null}
                </div>
              </div>
              <small>Ordem: {level.sort_order}</small>
              <div className={"flex flex-wrap gap-2"}>
                <button
                  type="button"
                  className={`${"cursor-pointer rounded-md border-0 bg-slate-800 px-2.5 py-2 text-xs text-white"} ${"bg-slate-600"}`}
                  onClick={() => editLevel(level)}
                  disabled={level.is_system}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className={`${"cursor-pointer rounded-md border-0 bg-slate-800 px-2.5 py-2 text-xs text-white"} ${"bg-red-700"}`}
                  onClick={() => onDelete(level.id)}
                  disabled={level.is_system}
                >
                  Remover
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </SectionCard>
  );
}

