"use client";

import BannerForm from "../forms/banner-form";
import FormModalShell from "./form-modal-shell";

export default function BannerFormModal({ open, saving, onClose, onSave }) {
  return (
    <FormModalShell open={open} title="Nova Bandeira" onClose={onClose}>
      <BannerForm onCancel={onClose} onSave={onSave} saving={saving} />
    </FormModalShell>
  );
}
