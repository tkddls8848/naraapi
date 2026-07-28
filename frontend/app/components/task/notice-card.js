export default function NoticeCard({ className, title, rows, children }) {
  return (
    <div className={className}>
      <span className="inline-block align-top">
        <div className="text-xl font-medium text-black">{title}</div>
        {rows.map((row) => (
          <p className="text-slate-500" key={row.label}>
            {row.label} : {row.value}
          </p>
        ))}
        {children}
      </span>
    </div>
  )
}
