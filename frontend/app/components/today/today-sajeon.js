import NoticeCard from '@/app/components/task/notice-card'

const CARD_CLASS =
  'h-full p-2 bg-white rounded-xl border-2 border-blue-400 shadow-lg flex items-center space-x-3'

export default function TodaySajeon({ task }) {
  const rows = [
    { label: '기관명', value: task.rlDminsttNm },
    { label: '등록일', value: task.rcptDt },
    { label: '파일링크1', value: <a href={task.specDocFileUrl1}>다운로드</a> },
  ]

  return (
    <NoticeCard className={CARD_CLASS} title={`(사전공고) ${task.prdctClsfcNoNm}`} rows={rows} />
  )
}
