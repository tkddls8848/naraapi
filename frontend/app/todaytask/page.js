import { format } from 'date-fns'
import TodaySearchBar from '@/app/components/today/today-search-bar'
import { requireUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function TodayTaskPage() {
  await requireUser()

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">오늘의 공고</h1>
        <p className="page-subtitle">
          {format(new Date(), 'yyyy/MM/dd')}일의 기관별 공고 검색입니다.
        </p>
      </div>
      <TodaySearchBar />
      <div className="empty-state">
        <p className="text-base font-semibold">기관을 담고 검색을 눌러 보세요.</p>
        <p className="text-sm text-ink-soft">담아 둔 기관들의 오늘 공고를 한 번에 모아 봅니다.</p>
      </div>
    </div>
  )
}
