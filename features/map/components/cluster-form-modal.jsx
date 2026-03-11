"use client";

import ClusterForm from "../forms/cluster-form";
import FormModalShell from "./form-modal-shell";

export default function ClusterFormModal({ open, saving, onClose, onSave }) {
  return (
    <FormModalShell open={open} title="Novo Cluster" onClose={onClose}>
      <ClusterForm onCancel={onClose} onSave={onSave} saving={saving} />
    </FormModalShell>
  );
}
