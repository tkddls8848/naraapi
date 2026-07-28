import { InboxIcon } from '@heroicons/react/24/outline'

export default function NoData({
  message = '요청한 데이터가 없습니다.',
  hint = '검색 조건을 바꿔 다시 시도해 보세요.',
}) {
  return (
    <div className="empty-state">
      <InboxIcon className="size-10 text-ink-faint" aria-hidden="true" />
      <p className="text-base font-semibold">{message}</p>
      {hint ? <p className="text-sm text-ink-soft">{hint}</p> : null}
    </div>
  )
}
