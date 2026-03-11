"use client";

export default function FormModalShell({ open, title, onClose, children }) {
  if (!open) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 1300,
        background: "rgba(0, 0, 0, 0.35)",
        display: "grid",
        placeItems: "center",
        padding: 16
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 500,
          maxWidth: "100%",
          background: "#fff",
          borderRadius: 8,
          padding: 16,
          boxShadow: "0 12px 30px rgba(0,0,0,0.25)"
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <h3 style={{ marginTop: 0, marginBottom: 10, fontSize: 18 }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}
