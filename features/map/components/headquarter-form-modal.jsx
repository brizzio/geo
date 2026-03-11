"use client";

import HeadquarterForm from "../forms/headquarter-form";
import FormModalShell from "./form-modal-shell";

export default function HeadquarterFormModal({ open, saving, onClose, onSave }) {
  return (
    <FormModalShell open={open} title="Nova Matriz" onClose={onClose}>
      <HeadquarterForm onCancel={onClose} onSave={onSave} saving={saving} />
    </FormModalShell>
  );
}
