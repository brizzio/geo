export function upsertById(list, item) {
  const index = list.findIndex((entry) => String(entry.id) === String(item.id));
  if (index === -1) {
    return [...list, item];
  }
  const next = [...list];
  next[index] = { ...next[index], ...item };
  return next;
}

export function dedupeByPlaceId(list, item) {
  const placeId = item?.place_id;
  if (!placeId) {
    return upsertById(list, item);
  }
  const index = list.findIndex((entry) => String(entry.place_id) === String(placeId));
  if (index === -1) {
    return [...list, item];
  }
  const next = [...list];
  next[index] = { ...next[index], ...item };
  return next;
}
