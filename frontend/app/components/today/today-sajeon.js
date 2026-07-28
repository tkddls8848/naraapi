import NoticeCard from '@/app/components/task/notice-card'
import DownloadLink from '@/app/components/task/download-link'

export default function TodaySajeon({ task }) {
  const rows = [
    { label: '기관명', value: task.rlDminsttNm },
    { label: '등록일', value: task.rcptDt },
    { label: '첨부파일', value: <DownloadLink href={task.specDocFileUrl1} /> },
  ]

  return (
    <NoticeCard
      className="card card-hover"
      badge={<span className="badge-brand">사전공고</span>}
      title={task.prdctClsfcNoNm}
      rows={rows}
    />
  )
}
