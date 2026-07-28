import NoticeCard from './notice-card'
import SaveTaskButton from './save-task-button'

const CARD_CLASS = 'h-full p-4 bg-white rounded-xl shadow-lg flex items-center space-x-3'

export default function TaskBone({ task, user }) {
  const taskTitle = task.bidNtceNm
  const rows = [
    { label: '기관명', value: task.dminsttNm },
    { label: '사업명', value: taskTitle },
    { label: '접수등록', value: task.bidNtceDt },
    { label: '마감', value: task.bidClseDt },
    { label: '파일링크1', value: <a href={task.ntceSpecDocUrl1}>다운로드 링크</a> },
    { label: '최신여부', value: String(task.isNew) },
  ]

  return (
    <NoticeCard className={CARD_CLASS} title={taskTitle} rows={rows}>
      <SaveTaskButton userId={user} taskType="bone" taskTitle={taskTitle} />
    </NoticeCard>
  )
}
