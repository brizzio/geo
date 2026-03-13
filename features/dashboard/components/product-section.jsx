"use client";

import Link from "next/link";
import SectionCard from "./section-card";

function resolveProductImage(product) {
  return (
    product?.image?.thumb_url ||
    product?.image?.display_url ||
    product?.image?.image_url ||
    product?.image_url ||
    null
  );
}

export default function ProductSection({ tenantId, products, onDelete }) {
  return (
    <SectionCard
      title="PRODUTOS"
      sectionId="produtos"
      hint="Catalogo de produtos do tenant ativo."
    >
      {!tenantId ? (
        <div className={"rounded-lg border border-dashed border-slate-300 p-2.5 text-xs opacity-75"}>
          Selecione uma conta ativa para gerenciar produtos.
        </div>
      ) : null}

      <div className={"flex flex-wrap gap-2"}>
        <Link
          href="/products/new"
          className={"inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2.5 text-[13px] text-white no-underline"}
        >
          Criar Produto
        </Link>
      </div>

      <div className={"grid gap-1.5"}>
        {products.length === 0 ? (
          <div className={"rounded-lg border border-dashed border-slate-300 p-2.5 text-xs opacity-75"}>
            Nenhum produto cadastrado.
          </div>
        ) : (
          products.map((product) => {
            const imageUrl = resolveProductImage(product);

            return (
              <article key={product.id} className={"grid gap-1.5 rounded-lg border border-slate-200 bg-white p-2"}>
                <div className={"flex items-center justify-between gap-2"}>
                  <strong>{product.name}</strong>
                  <span className={"rounded-full border border-slate-300 px-2 py-0.5 text-[11px]"}>
                    {product.category || "Sem categoria"}
                  </span>
                </div>

                <small>
                  EAN: {product.ean || "-"} | Ref. interna: {product.internal_reference || "-"} | PLU:{" "}
                  {product.code_plu || "-"}
                </small>
                <small>
                  Marca: {product.brand || "-"} | Linha: {product.line || "-"} | Industria:{" "}
                  {product.industry_name || "-"}
                </small>

                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={`Imagem ${product.name || "produto"}`}
                    style={{
                      width: 88,
                      height: 88,
                      objectFit: "contain",
                      border: "1px solid #d1d5db",
                      borderRadius: 8,
                      background: "#fff",
                      padding: 6
                    }}
                  />
                ) : null}

                <div className={"flex flex-wrap gap-2"}>
                  <Link
                    href={`/products/${product.id}/edit`}
                    className={"inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2.5 text-[13px] text-white no-underline"}
                  >
                    Editar
                  </Link>
                  <button
                    type="button"
                    className={`${"cursor-pointer rounded-md border-0 bg-slate-800 px-2.5 py-2 text-xs text-white"} ${"bg-red-700"}`}
                    onClick={() => onDelete(product.id)}
                  >
                    Remover
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </SectionCard>
  );
}
