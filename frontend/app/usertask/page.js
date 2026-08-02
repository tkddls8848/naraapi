import { getSavedNotices } from '@/app/actions/user-task-actions'
import NoData from '@/app/components/common/no-data'
import UserTasks from '@/app/components/user-task/user-tasks'
import { requireUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function UserTaskPage() {
  const userId = await requireUser()
  const usertasks = await getSavedNotices()

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">저장된 공고</h1>
        <p className="page-subtitle">
          {userId}님이 저장한 공고 {usertasks.length}건
        </p>
      </div>
      {usertasks.length === 0 ? (
        <NoData
          message="저장한 공고가 없습니다."
          hint="검색 화면에서 공고 카드의 저장 버튼을 누르면 여기에 모입니다."
        />
      ) : (
        <div className="notice-grid">
          {usertasks.map((usertask) => (
            <UserTasks usertask={usertask} key={usertask.contentNumber} />
          ))}
        </div>
      )}
    </div>
  )
}
