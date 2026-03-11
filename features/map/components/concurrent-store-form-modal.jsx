"use client";

import ConcurrentStoreForm from "../forms/concurrent-store-form";
import FormModalShell from "./form-modal-shell";

export default function ConcurrentStoreFormModal({
  open,
  saving,
  onClose,
  onSave,
  tenantId = "tenant1"
}) {
  return (
    <FormModalShell open={open} title="Novo Concorrente" onClose={onClose}>
      <ConcurrentStoreForm
        onCancel={onClose}
        onSave={onSave}
        saving={saving}
        tenantId={tenantId}
      />
    </FormModalShell>
  );
}
