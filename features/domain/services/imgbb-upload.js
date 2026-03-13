"use client";

export const IMGBB_MAX_UPLOAD_BYTES = 32 * 1024 * 1024;
const AUTO_RESIZE_MAX_WIDTH = 4096;
const AUTO_RESIZE_MIN_WIDTH = 480;
const AUTO_RESIZE_SCALE = 0.82;
const AUTO_RESIZE_MAX_STEPS = 12;
const AUTO_RESIZE_MIME_TYPE = "image/webp";
const AUTO_RESIZE_QUALITY = 0.86;

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Falha ao ler imagem para redimensionamento."));
    reader.readAsDataURL(file);
  });
}

function loadImageFromDataURL(dataURL) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Falha ao processar imagem para redimensionamento."));
    image.src = dataURL;
  });
}

function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Falha ao converter imagem redimensionada."));
        return;
      }
      resolve(blob);
    }, mimeType, quality);
  });
}

function buildOptimizedFileName(originalName = "") {
  const base = String(originalName || "image")
    .replace(/\.[^/.]+$/, "")
    .trim();
  return `${base || "image"}-optimized.webp`;
}

async function resizeFileToFitLimit(file, maxBytes) {
  if (!file || typeof file.size !== "number" || file.size <= maxBytes) {
    return file;
  }

  if (typeof window === "undefined" || !String(file.type || "").startsWith("image/")) {
    return file;
  }

  const sourceDataUrl = await readFileAsDataURL(file);
  const image = await loadImageFromDataURL(sourceDataUrl);
  const sourceWidth = Number(image.naturalWidth || image.width || 0);
  const sourceHeight = Number(image.naturalHeight || image.height || 0);

  if (!Number.isFinite(sourceWidth) || !Number.isFinite(sourceHeight) || sourceWidth <= 0 || sourceHeight <= 0) {
    return file;
  }

  const aspectRatio = sourceHeight / sourceWidth;
  let currentWidth = Math.min(sourceWidth, AUTO_RESIZE_MAX_WIDTH);
  let candidateBlob = null;

  for (let step = 0; step < AUTO_RESIZE_MAX_STEPS; step += 1) {
    const width = Math.max(1, Math.round(currentWidth));
    const height = Math.max(1, Math.round(width * aspectRatio));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      break;
    }

    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    candidateBlob = await canvasToBlob(canvas, AUTO_RESIZE_MIME_TYPE, AUTO_RESIZE_QUALITY);
    if (candidateBlob.size <= maxBytes) {
      return new File([candidateBlob], buildOptimizedFileName(file.name), {
        type: AUTO_RESIZE_MIME_TYPE,
        lastModified: Date.now()
      });
    }

    const nextWidth = Math.max(AUTO_RESIZE_MIN_WIDTH, Math.round(currentWidth * AUTO_RESIZE_SCALE));
    if (nextWidth >= currentWidth) {
      break;
    }
    currentWidth = nextWidth;
  }

  if (candidateBlob && candidateBlob.size < file.size) {
    return new File([candidateBlob], buildOptimizedFileName(file.name), {
      type: AUTO_RESIZE_MIME_TYPE,
      lastModified: Date.now()
    });
  }

  return file;
}

export async function uploadImageToImgbb(file, options = {}) {
  if (!file) {
    throw new Error("Arquivo de imagem nao informado.");
  }

  const uploadFile = await resizeFileToFitLimit(file, IMGBB_MAX_UPLOAD_BYTES);

  const formData = new FormData();
  formData.append("image", uploadFile);

  if (options.expirationSeconds) {
    formData.append("expiration", String(options.expirationSeconds));
  }

  if (options.name) {
    formData.append("name", String(options.name));
  } else if (uploadFile.name) {
    formData.append("name", uploadFile.name);
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
