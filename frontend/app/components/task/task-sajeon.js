import NoticeCard from './notice-card'
import SaveTaskButton from './save-task-button'

const CARD_CLASS = 'h-full p-4 bg-white rounded-xl shadow-lg flex items-center space-x-3'

export default function TaskSajeon({ task, user }) {
  const taskTitle = task.prdctClsfcNoNm
  const rows = [
    { label: '기관명', value: task.rlDminsttNm },
    { label: '등록일', value: task.rcptDt },
    { label: '마감일', value: task.opninRgstClseDt },
    { label: '다운로드1', value: <a href={task.specDocFileUrl1}>다운로드</a> },
    { label: '최신여부', value: String(task.isNew) },
  ]

  return (
    <NoticeCard className={CARD_CLASS} title={taskTitle} rows={rows}>
      <SaveTaskButton userId={user} taskType="sajeon" taskTitle={taskTitle} />
    </NoticeCard>
  )
}
