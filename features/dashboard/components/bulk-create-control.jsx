"use client";

import { useRef, useState } from "react";

export default function BulkCreateControl({
  onImport,
  label = "Criar em lote (JSON)",
  disabled = false
}) {
  const inputRef = useRef(null);
  const [message, setMessage] = useState(null);

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw);
      const result = await onImport(parsed);
      if (result?.failed) {
        const firstError = result?.errors?.[0];
        setMessage({
          type: "error",
          text:
            `Importacao parcial: ${result.success}/${result.total}. ` +
            `Primeiro erro na linha ${Number(firstError?.index ?? 0) + 1}: ${firstError?.message || "erro"}.`
        });
      } else {
        setMessage({
          type: "success",
          text: `Importacao concluida: ${result?.success ?? 0}/${result?.total ?? 0} registros.`
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error?.message || "Falha ao importar arquivo JSON."
      });
    } finally {
      event.target.value = "";
    }
  }

  return (
    <>
      <button
        type="button"
        className={`${"cursor-pointer rounded-md border-0 bg-slate-800 px-2.5 py-2 text-xs text-white"} ${"border border-slate-300 bg-white text-slate-900"}`}
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        {label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/json"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      {message ? (
        <p className={message.type === "error" ? "m-0 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-800" : "m-0 rounded-lg border border-green-200 bg-green-50 p-2 text-xs text-green-800"}>{message.text}</p>
      ) : null}
    </>
  );
}

