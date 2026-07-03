/** RULE 10 */
export function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? (
          <p className="mb-2 text-[11px] uppercase tracking-[0.3em] text-gold-ink2">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-3xl font-black tracking-tight text-ink">{title}</h1>
        {subtitle ? (
          <p className="mt-2 max-w-xl text-sm text-gray-400">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}
