"use client";

import BranchStoreForm from "../forms/branch-store-form";
import FormModalShell from "./form-modal-shell";

export default function BranchStoreFormModal({
  open,
  saving,
  onClose,
  onSave,
  tenantId = "tenant1"
}) {
  return (
    <FormModalShell open={open} title="Nova Loja de Rede" onClose={onClose}>
      <BranchStoreForm
        onCancel={onClose}
        onSave={onSave}
        saving={saving}
        tenantId={tenantId}
      />
    </FormModalShell>
  );
}
