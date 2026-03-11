"use client";

export default function MapSidebar({
  tenantId = "tenant1",
  layerCount = 0,
  onCreateBanner = () => {},
  onCreateHeadquarter = () => {},
  onCreateHeadquarterStore = () => {},
  onCreateBranchStore = () => {},
  onCreateConcurrentStore = () => {},
  onCreateCluster = () => {},
  onOpenClusters = () => {}
}) {
  return (
    <aside
      style={{
        position: "absolute",
        top: 80,
        left: 10,
        zIndex: 1190,
        width: 240,
        padding: 10,
        borderRadius: 6,
        background: "rgba(255,255,255,0.85)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.18)"
      }}
    >
      <div style={{ fontSize: 12, marginBottom: 8 }}>Tenant: {tenantId}</div>
      <div style={{ fontSize: 12, marginBottom: 10 }}>Layers: {layerCount}</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={onCreateCluster}>Novo cluster</button>
        <button onClick={onCreateBanner}>Nova bandeira</button>
        <button onClick={onCreateHeadquarter}>Nova matriz</button>
        <button onClick={onCreateHeadquarterStore}>Nova loja matriz</button>
        <button onClick={onCreateBranchStore}>Nova filial</button>
        <button onClick={onCreateConcurrentStore}>Novo concorrente</button>
        <button onClick={onOpenClusters}>Clusters</button>
      </div>
    </aside>
  );
}
