export default function ProfilePage({ value, onChange, onSave, saving }) {
  return (
    <section className="panel">
      <h2>Perfil do pesquisador</h2>
      <p className="muted">Preencha os dados cadastrais do pesquisador.</p>

      <form
        className="form-grid"
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
      >
        <label>
          Nome
          <input
            required
            value={value.name}
            onChange={(event) => onChange("name", event.target.value)}
            placeholder="Nome completo"
          />
        </label>

        <label>
          RG
          <input
            required
            value={value.rg}
            onChange={(event) => onChange("rg", event.target.value)}
            placeholder="Documento RG"
          />
        </label>

        <label>
          CPF
          <input
            required
            value={value.cpf}
            onChange={(event) => onChange("cpf", event.target.value)}
            placeholder="000.000.000-00"
          />
        </label>

        <label>
          Endereco residencial
          <textarea
            required
            value={value.home_address}
            onChange={(event) => onChange("home_address", event.target.value)}
            placeholder="Rua, numero, bairro, cidade, estado"
          />
        </label>

        <label>
          Endereco de trabalho
          <textarea
            required
            value={value.work_address}
            onChange={(event) => onChange("work_address", event.target.value)}
            placeholder="Rua, numero, bairro, cidade, estado"
          />
        </label>

        <button type="submit" className="btn" disabled={saving}>
          {saving ? "Salvando..." : "Salvar perfil"}
        </button>
      </form>
    </section>
  );
}
