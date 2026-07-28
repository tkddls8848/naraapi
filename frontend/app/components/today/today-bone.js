import NoticeCard from '@/app/components/task/notice-card'
import DownloadLink from '@/app/components/task/download-link'

export default function TodayBone({ task }) {
  const rows = [
    { label: '기관명', value: task.dminsttNm },
    { label: '접수등록', value: task.bidNtceDt },
    {
      label: '첨부파일',
      value: <DownloadLink href={task.ntceSpecDocUrl1} label="다운로드 링크" />,
    },
  ]

  return (
    <NoticeCard
      className="card card-hover"
      badge={<span className="badge-accent">본공고</span>}
      title={task.bidNtceNm}
      rows={rows}
    />
  )
}
