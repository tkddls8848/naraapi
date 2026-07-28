import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import jwt from 'jsonwebtoken'
import connectMongo from '@/lib/mongoose'
import UserTask from '@/lib/models/user-task'
import NoData from '@/app/components/common/no-data'
import UserTasks from '@/app/components/user-task/user-tasks'

export const dynamic = 'force-dynamic'

// 자기 라우트 핸들러를 HTTP 로 다시 부르지 않고 DB 를 직접 읽는다.
// 반환 모양은 GET /api/v1/usertask/:userId 의 result 와 동일하다.
async function fetchUserTasks(userId) {
  await connectMongo()

  const tasks = await UserTask.find({ user_id: userId }).lean()

  return tasks.map((task) => [task.user_id, task.task_type, task.task_title, task.content_number])
}

export default async function UserTaskPage() {
  const cookieStore = await cookies()
  const jwtCookie = cookieStore.get('userCookie')?.value
  // NOTE: 보안 강화는 사용자 결정에 따라 범위 밖 — 쿠키 존재 여부만 확인하고 서명은 검증하지 않는다.
  if (!jwtCookie) {
    redirect('/')
  }

  const { userId } = jwt.decode(jwtCookie)
  const usertasks = await fetchUserTasks(userId)

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
            <UserTasks usertask={usertask} key={usertask[3]} />
          ))}
        </div>
      )}
    </div>
  )
}
