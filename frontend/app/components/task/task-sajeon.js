import NoticeCard from './notice-card'
import SaveTaskButton from './save-task-button'
import DownloadLink from './download-link'

export default function TaskSajeon({ task, user }) {
  const taskTitle = task.prdctClsfcNoNm
  const rows = [
    { label: '기관명', value: task.rlDminsttNm },
    { label: '등록일', value: task.rcptDt },
    { label: '마감일', value: task.opninRgstClseDt },
    { label: '첨부파일', value: <DownloadLink href={task.specDocFileUrl1} /> },
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
    <NoticeCard className="card card-hover" badge={badge} title={taskTitle} rows={rows}>
      <SaveTaskButton userId={user} taskType="sajeon" taskTitle={taskTitle} />
    </NoticeCard>
  )
}
