import NoticeCard from '@/app/components/task/notice-card'
import DownloadLink from '@/app/components/task/download-link'

export default function TodayBone({ task }) {
  const rows = [
    { label: '기관명', value: task.departName },
    { label: '접수등록', value: task.registeredAt },
    { label: '마감', value: task.closesAt },
    {
      label: '첨부파일',
      value: <DownloadLink href={task.fileUrl} label="다운로드 링크" />,
    },
  ]

  return (
    <NoticeCard
      className="card card-hover"
      badge={<span className="badge-accent">본공고</span>}
      title={task.title}
      rows={rows}
    />
  )
}
