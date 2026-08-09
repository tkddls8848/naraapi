import { notFound } from 'next/navigation'
import NoData from '@/app/components/common/no-data'
import NoticeItem from '@/app/components/task/notice-item'
import TaskSearchBar from '@/app/components/task/task-search-bar'
import { requireUser } from '@/lib/auth'
import { fetchNoticesByDepart } from '@/lib/nara-api'

export const dynamic = 'force-dynamic'

const NOTICE_TYPE_LABELS = {
  sajeon: '사전공고',
  bone: '본공고',
}

export default async function TaskResultPage({ params, searchParams }) {
  await requireUser()
  const { kind, departname } = await params
  const label = NOTICE_TYPE_LABELS[kind]
  if (!label) notFound()

  const { beginDate, endDate } = await searchParams
  const notices = await fetchNoticesByDepart({ kind, departName: departname, beginDate, endDate })

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">
          {departname} {label}
        </h1>
        <p className="page-subtitle">검색 결과 {notices.length}건</p>
      </div>
      <TaskSearchBar />
      {notices.length > 0 ? (
        <div className="notice-grid">
          {notices.map((notice) => (
            <NoticeItem key={notice.id} notice={notice} saveable historical />
          ))}
        </div>
      ) : (
        <NoData />
      )}
    </div>
  )
}
