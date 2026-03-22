"use client";

import { useRef } from "react";

function fieldClassName() {
  return "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-500";
}

export default function MobileTaskProductCard({
  item,
  draft,
  disabled = false,
  uploadingPhoto = false,
  onChange,
  onConfirm,
  onPhotoSelected
}) {
  const inputRef = useRef(null);
  const isConfirmed = Boolean(draft?.confirmed);

  return (
    <article className={"grid gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-[0_8px_20px_rgba(15,23,42,0.06)]"}>
      <div className={"flex items-center justify-between gap-2"}>
        <div className={"grid gap-0.5"}>
          <strong className={"text-sm text-slate-900"}>
            {item?.product?.name || item?.product_name || `Produto ${item?.product_id || "-"}`}
          </strong>
          <small className={"text-slate-600"}>EAN: {item?.product?.ean || item?.product_ean || "-"}</small>
        </div>
        <span
          className={
            isConfirmed
              ? "rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700"
              : "rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700"
          }
        >
          {isConfirmed ? "OK" : "Pendente"}
        </span>
      </div>

      <div className={"grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]"}>
        <label className={"grid gap-1 text-xs text-slate-700"}>
          <span>Primeiro preco</span>
          <input
            inputMode="decimal"
            value={draft?.first_price || ""}
            onChange={(event) => onChange("first_price", event.target.value)}
            className={fieldClassName()}
            placeholder="0,00"
            disabled={disabled}
          />
        </label>

        <label className={"grid gap-1 text-xs text-slate-700"}>
          <span>Segundo preco</span>
          <input
            inputMode="decimal"
            value={draft?.second_price || ""}
            onChange={(event) => onChange("second_price", event.target.value)}
            className={fieldClassName()}
            placeholder="0,00"
            disabled={disabled}
          />
        </label>

        <label className={"grid gap-1 text-xs text-slate-700"}>
          <span>Quantidade para segundo preco</span>
          <input
            inputMode="numeric"
            value={draft?.second_price_quantity || ""}
            onChange={(event) => onChange("second_price_quantity", event.target.value)}
            className={fieldClassName()}
            placeholder="Ex: 3"
            disabled={disabled}
          />
        </label>

        <label className={"grid gap-1 text-xs text-slate-700"}>
          <span>Preco fidelidade</span>
          <input
            inputMode="decimal"
            value={draft?.loyalty_price || ""}
            onChange={(event) => onChange("loyalty_price", event.target.value)}
            className={fieldClassName()}
            placeholder="0,00"
            disabled={disabled}
          />
        </label>
      </div>

      <label className={"grid gap-1 text-xs text-slate-700"}>
        <span>Departamento (opcional)</span>
        <input
          value={draft?.department_name || ""}
          onChange={(event) => onChange("department_name", event.target.value)}
          className={fieldClassName()}
          placeholder="Ex: Mercearia"
          disabled={disabled}
        />
      </label>

      <label className={"flex items-center gap-2 text-xs text-slate-700"}>
        <input
          type="checkbox"
          checked={Boolean(draft?.is_promotion)}
          onChange={(event) => onChange("is_promotion", event.target.checked)}
          disabled={disabled}
        />
        <span>Produto em promocao</span>
      </label>

      <div className={"grid gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-2.5"}>
        <div className={"flex items-center justify-between gap-2"}>
          <span className={"text-xs text-slate-700"}>Foto da etiqueta da gondola (opcional)</span>
          {draft?.shelf_tag_photo?.display_url || draft?.shelf_tag_photo?.image_url ? (
            <span className={"rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700"}>
              Foto anexada
            </span>
          ) : null}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onPhotoSelected}
          className={"hidden"}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploadingPhoto}
          className={"w-fit cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"}
        >
          {uploadingPhoto ? "Enviando foto..." : "Adicionar foto da etiqueta"}
        </button>

        {draft?.shelf_tag_photo?.display_url || draft?.shelf_tag_photo?.image_url ? (
          <img
            src={draft?.shelf_tag_photo?.display_url || draft?.shelf_tag_photo?.image_url}
            alt="Etiqueta da gondola"
            className={"max-h-[220px] w-full rounded-lg border border-slate-200 object-cover"}
          />
        ) : null}
      </div>

      <button
        type="button"
        onClick={onConfirm}
        disabled={disabled}
        className={"w-fit cursor-pointer rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-xs text-white disabled:cursor-not-allowed disabled:opacity-60"}
      >
        {isConfirmed ? "Item confirmado" : "OK"}
      </button>
    </article>
  );
}
