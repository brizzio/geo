
export default function SectionCard({ title, hint, full = false, sectionId = null, children }) {
  return (
    <section id={sectionId || undefined} className={`${"grid gap-2.5 rounded-xl border border-slate-900/10 bg-white/90 p-[14px]"} ${full ? "col-span-full" : ""}`}>
      <h2 className={"m-0 text-lg"}>{title}</h2>
      {hint ? <p className={"m-0 text-xs opacity-70"}>{hint}</p> : null}
      {children}
    </section>
  );
}

