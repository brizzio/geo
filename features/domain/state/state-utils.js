export function upsertById(list = [], item) {
  const index = list.findIndex((entry) => String(entry.id) === String(item.id));
  if (index === -1) {
    return [...list, item];
  }
  const next = [...list];
  next[index] = { ...next[index], ...item };
  return next;
}

export function removeById(list = [], id) {
  return list.filter((item) => String(item.id) !== String(id));
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
