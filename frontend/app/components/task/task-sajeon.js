import NoticeCard from './notice-card'
import SaveTaskButton from './save-task-button'
import DownloadLink from './download-link'

export default function TaskSajeon({ task }) {
  const rows = [
    { label: '기관명', value: task.departName },
    { label: '등록일', value: task.registeredAt },
    { label: '마감일', value: task.closesAt },
    { label: '첨부파일', value: <DownloadLink href={task.fileUrl} /> },
  ]

  const badge = (
    <>
      <span className="badge-brand">사전공고</span>
      {task.isNew ? (
        <span className="badge-new">NEW</span>
      ) : (
        <span className="badge-neutral">이전 공고</span>
      )}
    </>
  )

  return (
    <NoticeCard className="card card-hover" badge={badge} title={task.title} rows={rows}>
      <SaveTaskButton
        taskType={task.kind}
        taskTitle={task.title}
        noticeId={task.id}
        noticeUrl={task.fileUrl}
      />
    </NoticeCard>
  )
}
