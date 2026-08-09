export default function NoticeCard({ className, badge, title, rows, children }) {
  return (
    <article className={className}>
      {badge ? <div className="flex flex-wrap items-center gap-1.5">{badge}</div> : null}
      <h3 className="notice-title">{title}</h3>
      <dl className="notice-meta">
        {rows.map((row) => (
          <div className="notice-meta-row" key={row.label}>
            <dt className="notice-meta-label">{row.label}</dt>
            <dd className="notice-meta-value">{row.value}</dd>
          </div>
        ))}
      </dl>
      {children ? <div className="mt-auto flex flex-wrap gap-2 pt-1">{children}</div> : null}
    </article>
  )
}
