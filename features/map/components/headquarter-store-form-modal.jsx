"use client";

import HeadquarterStoreForm from "../forms/headquarter-store-form";
import FormModalShell from "./form-modal-shell";

export default function HeadquarterStoreFormModal({
  open,
  saving,
  onClose,
  onSave,
  tenantId = "tenant1"
}) {
  return (
    <FormModalShell open={open} title="Nova Loja Matriz" onClose={onClose}>
      <HeadquarterStoreForm
        onCancel={onClose}
        onSave={onSave}
        saving={saving}
        tenantId={tenantId}
      />
    </FormModalShell>
  );
}
