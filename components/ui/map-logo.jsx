"use client";

export default function MapLogo() {
  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        left: 10,
        zIndex: 1200,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.55)",
        borderRadius: 6,
        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
        padding: 6
      }}
    >
      <img src="/images/nket-logo-black-framed.png" alt="NKET" style={{ width: 120 }} />
      <span style={{ fontSize: 10, marginTop: 2, textAlign: "center" }}>INTELIGENCIA DE PRECOS</span>
    </div>
  );
}
