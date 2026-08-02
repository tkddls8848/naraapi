import TaskSearchBar from '@/app/components/task/task-search-bar'
import { requireUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function TaskSearchPage() {
  await requireUser()

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">공고 검색</h1>
        <p className="page-subtitle">공고타입과 기관명, 조회기간을 골라 검색하세요.</p>
      </div>
      <TaskSearchBar />
      <div className="empty-state">
        <p className="text-base font-semibold">검색을 통해 공고를 확인 할 수 있습니다.</p>
        <p className="text-sm text-ink-soft">
          기관명은 나라장터에 등록된 수요기관 이름과 같아야 합니다.
        </p>
      </div>
    </div>
  )
}
