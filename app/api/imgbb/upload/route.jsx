import { NextResponse } from "next/server";

const IMGBB_UPLOAD_URL = "https://api.imgbb.com/1/upload";
const MAX_IMAGE_UPLOAD_BYTES = 32 * 1024 * 1024;

function estimateBase64Bytes(value = "") {
  const normalized = String(value || "")
    .replace(/^data:[^;]+;base64,/, "")
    .replace(/\s+/g, "");
  if (!normalized) {
    return 0;
  }
  return Math.floor((normalized.length * 3) / 4);
}

function resolveApiKey() {
  const direct = process.env.IMGBB_KEY || process.env.IMGBB_API_KEY;
  if (direct) {
    return String(direct).trim();
  }

  const fallbackEntry = Object.entries(process.env).find(([key]) => {
    const normalized = String(key || "").trim();
    return normalized === "IMGBB_KEY" || normalized === "IMGBB_API_KEY";
  });

  return fallbackEntry?.[1] ? String(fallbackEntry[1]).trim() : "";
}

export async function POST(request) {
  const apiKey = resolveApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: "IMGBB_KEY nao configurada no ambiente." },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const image = formData.get("image");
    const expiration = formData.get("expiration");
    const name = formData.get("name");

    if (!image) {
      return NextResponse.json({ error: "Arquivo de imagem e obrigatorio." }, { status: 400 });
    }

    const isBlobLike = typeof image === "object" && typeof image?.size === "number";
    if (isBlobLike && image.size > MAX_IMAGE_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "Imagem excede o limite de 32 MB." },
        { status: 413 }
      );
    }

    if (typeof image === "string") {
      const estimatedBytes = estimateBase64Bytes(image);
      if (estimatedBytes > MAX_IMAGE_UPLOAD_BYTES) {
        return NextResponse.json(
          { error: "Imagem excede o limite de 32 MB." },
          { status: 413 }
        );
      }
    }

    const upstream = new URL(IMGBB_UPLOAD_URL);
    upstream.searchParams.set("key", apiKey);

    if (expiration) {
      upstream.searchParams.set("expiration", String(expiration));
    }

    const uploadFormData = new FormData();
    uploadFormData.append("image", image);

    if (name) {
      uploadFormData.append("name", String(name));
    }

    const response = await fetch(upstream.toString(), {
      method: "POST",
      body: uploadFormData,
      cache: "no-store"
    });

    const payload = await response.json().catch(() => null);
    const ok = response.ok && payload?.success === true;

    if (!ok) {
      return NextResponse.json(
        {
          error: payload?.error?.message || payload?.error || "Falha no upload da imagem."
        },
        { status: response.status || 502 }
      );
    }

    return NextResponse.json(
      {
        id: payload.data?.id || null,
        url: payload.data?.url || null,
        image_url: payload.data?.image?.url || payload.data?.url || null,
        display_url: payload.data?.display_url || null,
        thumb_url: payload.data?.thumb?.url || null,
        medium_url: payload.data?.medium?.url || null,
        viewer_url: payload.data?.url_viewer || null,
        delete_url: payload.data?.delete_url || null,
        raw: payload.data || null
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Erro inesperado no upload de imagem." },
      { status: 500 }
    );
  }
}
