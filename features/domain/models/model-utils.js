export function buildId(prefix = "id") {
  const random = Math.floor(Math.random() * 1_000_000)
    .toString(36)
    .padStart(4, "0");
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function normalizeText(value) {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}

export function requireField(value, message) {
  if (value === null || value === undefined || value === "") {
    throw new Error(message);
  }
}

export function uniqueStrings(values = []) {
  const seen = new Set();
  return values.reduce((acc, value) => {
    const item = String(value);
    if (seen.has(item)) {
      return acc;
    }
    seen.add(item);
    return [...acc, item];
  }, []);
}
