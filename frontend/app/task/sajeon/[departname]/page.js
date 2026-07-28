import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import jwt from 'jsonwebtoken'
import NoData from '@/app/components/common/no-data'
import TaskSearchBar from '@/app/components/task/task-search-bar'
import TaskSajeon from '@/app/components/task/task-sajeon'
import { fetchNoticesByDepart, noticeKey } from '@/lib/nara-api'

export const dynamic = 'force-dynamic'

export default async function TaskSajeonPage({ params, searchParams }) {
  const cookieStore = await cookies()
  const jwtCookie = cookieStore.get('userCookie')?.value
  if (!jwtCookie) {
    redirect('/')
  }

  const { departname } = await params
  const { beginDate, endDate } = await searchParams
  const user = jwt.decode(jwtCookie)?.userId
  const tasks = await fetchNoticesByDepart({
    kind: 'sajeon',
    departName: departname,
    beginDate,
    endDate,
  })

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">{departname} 사전공고</h1>
        <p className="page-subtitle">검색 결과 {tasks.length}건</p>
      </div>
      <TaskSearchBar />
      {tasks.length > 0 ? (
        <div className="notice-grid">
          {tasks.map((task, index) => (
            <TaskSajeon key={noticeKey(task, index)} task={task} user={user} />
          ))}
        </div>
      ) : (
        <NoData />
      )}
    </div>
  )
}
