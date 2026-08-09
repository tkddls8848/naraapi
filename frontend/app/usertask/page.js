import { getSavedNotices } from '@/app/actions/user-task-actions'
import NoData from '@/app/components/common/no-data'
import UserTasks from '@/app/components/user-task/user-tasks'

export const dynamic = 'force-dynamic'

export default async function UserTaskPage() {
  const { userId, notices } = await getSavedNotices()

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">저장된 공고</h1>
        <p className="page-subtitle">
          {userId}님이 저장한 공고 {notices.length}건
        </p>
      </div>
      {notices.length === 0 ? (
        <NoData
          message="저장한 공고가 없습니다."
          hint="검색 화면에서 공고 카드의 저장 버튼을 누르면 여기에 모입니다."
        />
      ) : (
        <div className="notice-grid">
          {notices.map((notice) => (
            <UserTasks notice={notice} key={notice.contentNumber} />
          ))}
        </div>
      )}
    </div>
  )
}
