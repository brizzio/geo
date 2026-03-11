"use client";

import { useMemo, useState } from "react";
import { useMapActions } from "../../features/map/hooks/use-map-actions";

export default function MapSearch() {
  const { createSearchItem } = useMapActions();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState({});
  const [error, setError] = useState("");

  const selectedCount = useMemo(
    () => Object.values(selected).filter(Boolean).length,
    [selected]
  );

  async function performSearch() {
    const term = query.trim();
    if (!term) {
      setResults([]);
      setSelected({});
      return;
    }

    setLoading(true);
    setError("");
    try {
      const url = `/api/nominatim/search?q=${encodeURIComponent(term)}`;
      const response = await fetch(url);
      if (!response.ok) {
        const details = await response.json().catch(() => ({}));
        throw new Error(details.error || `Busca falhou (${response.status})`);
      }
      const data = await response.json();
      setResults(Array.isArray(data) ? data : []);
      setSelected({});
    } catch (err) {
      setError(err.message || "Erro na busca");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function toggle(placeId) {
    setSelected((prev) => ({ ...prev, [placeId]: !prev[placeId] }));
  }

  function addSelected() {
    results.forEach((item) => {
      if (selected[item.place_id]) {
        createSearchItem(item);
      }
    });
    setResults([]);
    setSelected({});
    setQuery("");
  }

  return (
    <section
      style={{
        position: "absolute",
        top: 12,
        left: 160,
        width: 360,
        maxWidth: "calc(100vw - 180px)",
        zIndex: 1200,
        background: "rgba(255,255,255,0.55)",
        borderRadius: 6,
        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
        padding: 10
      }}
    >
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              performSearch();
            }
          }}
          placeholder="Buscar empresa ou endereco..."
          style={{
            flex: 1,
            border: "1px solid #ccc",
            borderRadius: 4,
            padding: "8px 10px",
            fontSize: 13
          }}
        />
        <button onClick={performSearch} disabled={loading}>
          {loading ? "..." : "Buscar"}
        </button>
      </div>

      {error ? <p style={{ margin: "8px 0 0", fontSize: 12, color: "#a12222" }}>{error}</p> : null}

      {results.length > 0 ? (
        <div
          style={{
            marginTop: 8,
            maxHeight: 240,
            overflowY: "auto",
            background: "#fff",
            border: "1px solid #ccc",
            borderRadius: 4,
            padding: 8
          }}
        >
          {results.map((item) => (
            <label
              key={item.place_id}
              style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8 }}
            >
              <input
                type="checkbox"
                checked={!!selected[item.place_id]}
                onChange={() => toggle(item.place_id)}
              />
              <span style={{ fontSize: 12 }}>{item.display_name}</span>
            </label>
          ))}
          <button disabled={!selectedCount} onClick={addSelected}>
            Adicionar selecionados ({selectedCount})
          </button>
        </div>
      ) : null}
    </section>
  );
}
