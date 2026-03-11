export function toggleValue(list, value) {
  const item = String(value);
  return list.includes(item) ? list.filter((v) => String(v) !== item) : [...list, item];
}

export function buildProductRow() {
  return {
    id: `tmp_${Date.now()}_${Math.floor(Math.random() * 10_000)}`,
    gtin: "",
    name: "",
    category: ""
  };
}
