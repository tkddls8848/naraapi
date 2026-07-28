import NoticeCard from '@/app/components/task/notice-card'

const CARD_CLASS =
  'h-full p-2 bg-white rounded-xl border-2 border-green-400 shadow-lg flex items-center space-x-3'

export default function TodayBone({ task }) {
  const rows = [
    { label: '기관명', value: task.dminsttNm },
    { label: '접수등록', value: task.bidNtceDt },
    { label: '파일링크1', value: <a href={task.ntceSpecDocUrl1}>다운로드 링크</a> },
  ]

  return <NoticeCard className={CARD_CLASS} title={`(본공고) ${task.bidNtceNm}`} rows={rows} />
}
