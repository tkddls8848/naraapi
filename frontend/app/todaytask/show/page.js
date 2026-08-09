import NoData from '@/app/components/common/no-data'
import NoticeItem from '@/app/components/task/notice-item'
import TodaySearchBar from '@/app/components/today/today-search-bar'
import { requireUser } from '@/lib/auth'
import { fetchNoticesForDepartList } from '@/lib/nara-api'

export const dynamic = 'force-dynamic'

function toDepartList(departParam) {
  const departList =
    departParam == null ? [] : Array.isArray(departParam) ? departParam : [departParam]
  return [...new Set(departList.map((depart) => String(depart).trim()).filter(Boolean))]
}

export default async function TodayTaskShowPage({ searchParams }) {
  await requireUser()

  const { depart } = await searchParams
  const departList = toDepartList(depart)
  const [sajeonData, boneData] = await Promise.all([
    fetchNoticesForDepartList({ kind: 'sajeon', departList }),
    fetchNoticesForDepartList({ kind: 'bone', departList }),
  ])

  const groups = [
    { kind: 'sajeon', label: '사전공고', notices: sajeonData, badgeClass: 'badge-brand' },
    { kind: 'bone', label: '본공고', notices: boneData, badgeClass: 'badge-accent' },
  ]
  const hasData = groups.some(({ notices }) => notices.length > 0)

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">오늘의 공고</h1>
        <p className="page-subtitle">
          기관 {departList.length}곳 · 사전공고 {sajeonData.length}건 · 본공고 {boneData.length}건
        </p>
      </div>
      <TodaySearchBar key={departList.join('|')} initialDeparts={departList} />
      {hasData ? (
        <div className="space-y-10">
          {groups.map(({ kind, label, notices, badgeClass }) => (
            <section aria-labelledby={`today-${kind}-heading`} key={kind}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold tracking-tight" id={`today-${kind}-heading`}>
                  {label}
                </h2>
                <span className={badgeClass}>{notices.length}건</span>
              </div>
              {notices.length > 0 ? (
                <div className="notice-grid">
                  {notices.map((notice) => (
                    <NoticeItem key={notice.id} notice={notice} />
                  ))}
                </div>
              ) : (
                <NoData
                  message={`오늘 등록된 ${label}가 없습니다.`}
                  hint="다른 공고 결과를 확인해 보세요."
                />
              )}
            </section>
          ))}
        </div>
      ) : (
        <NoData
          message="선택한 기관의 오늘 공고가 없습니다."
          hint="기관명을 확인하거나 다른 기관을 추가해 보세요."
        />
      )}
    </div>
  )
}
