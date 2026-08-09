import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import NoticeCard from './notice-card'
import SaveTaskButton from './save-task-button'

const NOTICE_TYPES = {
  sajeon: {
    label: '사전공고',
    badgeClass: 'badge-brand',
    registeredLabel: '등록일',
    closesLabel: '마감일',
  },
  bone: {
    label: '본공고',
    badgeClass: 'badge-accent',
    registeredLabel: '접수등록',
    closesLabel: '마감',
  },
}

function DownloadLink({ href }) {
  if (!href) return <span className="text-ink-faint">없음</span>

  return (
    <a className="link inline-flex items-center gap-1" href={href} target="_blank" rel="noreferrer">
      <ArrowDownTrayIcon className="size-3.5 shrink-0" aria-hidden="true" />
      다운로드
    </a>
  )
}

export default function NoticeItem({ notice, saveable = false, historical = false }) {
  const type = NOTICE_TYPES[notice.kind]
  const rows = [
    { label: '기관명', value: notice.departName },
    { label: type.registeredLabel, value: notice.registeredAt },
    { label: type.closesLabel, value: notice.closesAt },
    { label: '첨부파일', value: <DownloadLink href={notice.fileUrl} /> },
  ]
  const badge = (
    <>
      <span className={type.badgeClass}>{type.label}</span>
      {historical ? <span className="badge-neutral">이전 공고</span> : null}
    </>
  )

  return (
    <NoticeCard className="card card-hover" badge={badge} title={notice.title} rows={rows}>
      {saveable ? (
        <SaveTaskButton
          taskType={notice.kind}
          taskTitle={notice.title}
          noticeId={notice.id}
          noticeUrl={notice.fileUrl}
        />
      ) : null}
    </NoticeCard>
  )
}
