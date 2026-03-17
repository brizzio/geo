"use client";

function SelectField({
  label,
  value,
  onChange,
  options = [],
  allLabel = "Todos"
}) {
  return (
    <label className={"grid gap-1 text-[11px] text-slate-700"}>
      <span className={"font-medium"}>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={"rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 outline-none transition focus:border-slate-500"}
      >
        <option value="__ALL__">{allLabel}</option>
        {options.map((option) => (
          <option key={String(option.id)} value={String(option.id)}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function ToggleChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${"inline-flex h-[32px] items-center justify-center rounded-full border px-3 text-[11px] font-medium transition"} ${
        active
          ? "border-emerald-700 bg-emerald-700 text-white"
          : "border-slate-300 bg-white text-slate-700 hover:border-slate-500"
      }`}
    >
      {label}
    </button>
  );
}

export default function MapFloatingFilters({
  networks = [],
  banners = [],
  ownStores = [],
  competitorStores = [],
  clusters = [],
  selectedNetworkId,
  selectedBannerId,
  selectedOwnStoreId,
  selectedCompetitorStoreId,
  selectedClusterId,
  layerVisibility = {
    ownStores: true,
    competitorStores: true,
    clusters: true,
    coverage: true
  },
  onNetworkChange,
  onBannerChange,
  onOwnStoreChange,
  onCompetitorStoreChange,
  onClusterChange,
  onToggleOwnStores,
  onToggleCompetitorStores,
  onToggleClusters,
  onToggleCoverage
}) {
  return (
    <section className={"pointer-events-auto absolute left-1/2 top-3 z-[1200] w-[min(96vw,1180px)] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white/95 p-2.5 shadow-[0_14px_34px_rgba(15,23,42,0.16)] backdrop-blur-sm"}>
      <div className={"flex flex-wrap items-end gap-2"}>
        <SelectField
          label="Rede"
          value={selectedNetworkId}
          onChange={onNetworkChange}
          options={networks}
          allLabel="Todas as redes"
        />
        <SelectField
          label="Bandeira"
          value={selectedBannerId}
          onChange={onBannerChange}
          options={banners}
          allLabel="Todas as bandeiras"
        />
        <SelectField
          label="Lojas"
          value={selectedOwnStoreId}
          onChange={onOwnStoreChange}
          options={ownStores}
          allLabel="Todas as lojas"
        />
        <SelectField
          label="Concorrentes"
          value={selectedCompetitorStoreId}
          onChange={onCompetitorStoreChange}
          options={competitorStores}
          allLabel="Todos os concorrentes"
        />
        <SelectField
          label="Clusters"
          value={selectedClusterId}
          onChange={onClusterChange}
          options={clusters}
          allLabel="Todos os clusters"
        />
      </div>
      <div className={"mt-2 flex flex-wrap gap-1.5 border-t border-slate-200 pt-2"}>
        <ToggleChip
          label="Camada Lojas"
          active={Boolean(layerVisibility?.ownStores)}
          onClick={onToggleOwnStores}
        />
        <ToggleChip
          label="Camada Concorrentes"
          active={Boolean(layerVisibility?.competitorStores)}
          onClick={onToggleCompetitorStores}
        />
        <ToggleChip
          label="Camada Clusters"
          active={Boolean(layerVisibility?.clusters)}
          onClick={onToggleClusters}
        />
        <ToggleChip
          label="Cobertura Cluster"
          active={Boolean(layerVisibility?.coverage)}
          onClick={onToggleCoverage}
        />
      </div>
    </section>
  );
}
