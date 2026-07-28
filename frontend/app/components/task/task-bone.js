import NoticeCard from './notice-card'
import SaveTaskButton from './save-task-button'
import DownloadLink from './download-link'

export default function TaskBone({ task, user }) {
  const taskTitle = task.bidNtceNm
  // 사업명은 카드 제목으로 크게 뜨므로 본문에서는 뺐다.
  const rows = [
    { label: '기관명', value: task.dminsttNm },
    { label: '접수등록', value: task.bidNtceDt },
    { label: '마감', value: task.bidClseDt },
    {
      label: '첨부파일',
      value: <DownloadLink href={task.ntceSpecDocUrl1} label="다운로드 링크" />,
    },
  ]

  const badge = (
    <>
      <span className="badge-accent">본공고</span>
      {task.isNew ? (
        <span className="badge-new">NEW</span>
      ) : (
        <span className="badge-neutral">이전 공고</span>
      )}
    </>
  )

  return (
    <NoticeCard className="card card-hover" badge={badge} title={taskTitle} rows={rows}>
      <SaveTaskButton userId={user} taskType="bone" taskTitle={taskTitle} />
    </NoticeCard>
  )
}
