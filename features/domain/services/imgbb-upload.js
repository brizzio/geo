"use client";

export async function uploadImageToImgbb(file, options = {}) {
  if (!file) {
    throw new Error("Arquivo de imagem nao informado.");
  }

  const formData = new FormData();
  formData.append("image", file);

  if (options.expirationSeconds) {
    formData.append("expiration", String(options.expirationSeconds));
  }

  if (options.name) {
    formData.append("name", String(options.name));
  } else if (file.name) {
    formData.append("name", file.name);
  }

  const response = await fetch("/api/imgbb/upload", {
    method: "POST",
    body: formData
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || `Falha no upload da imagem (${response.status}).`);
  }

  return {
    id: payload?.id || null,
    url: payload?.image_url || payload?.url || payload?.display_url || null,
    imageUrl: payload?.image_url || payload?.url || payload?.display_url || null,
    displayUrl: payload?.display_url || payload?.image_url || payload?.url || null,
    thumbUrl: payload?.thumb_url || null,
    mediumUrl: payload?.medium_url || null,
    viewerUrl: payload?.viewer_url || null,
    deleteUrl: payload?.delete_url || null,
    raw: payload?.raw || null
  };
}
