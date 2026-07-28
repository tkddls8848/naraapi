/**
 * 공고 한 건을 보여주는 카드. 라벨/값을 정의 목록으로 세워 긴 사업명이 들어와도
 * 줄이 밀리지 않게 했다.
 *
 * @param badge 카드 상단 배지 영역(공고 타입, 최신 여부 등)
 * @param rows  [{ label, value }] 형태의 본문 항목
 * @param children 카드 하단 액션 영역(저장 버튼 등)
 */
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
