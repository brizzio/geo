"use client";

export default function MapControls({
  onCreateBanner = () => {},
  onCreateHeadquarter = () => {},
  onCreateHeadquarterStore = () => {},
  onCreateBranchStore = () => {},
  onCreateConcurrentStore = () => {},
  onCreateCluster = () => {},
  onOpenClusters = () => {}
}) {
  return (
    <div
      style={{
        position: "absolute",
        right: 12,
        bottom: 18,
        zIndex: 1200,
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        justifyContent: "flex-end",
        maxWidth: "70vw"
      }}
    >
      <button onClick={onOpenClusters}>Clusters</button>
      <button onClick={onCreateCluster}>+ Cluster</button>
      <button onClick={onCreateBanner}>+ Bandeira</button>
      <button onClick={onCreateHeadquarter}>+ Matriz</button>
      <button onClick={onCreateHeadquarterStore}>+ Loja Matriz</button>
      <button onClick={onCreateBranchStore}>+ Filial</button>
      <button onClick={onCreateConcurrentStore}>+ Concorrente</button>
    </div>
  );
}
