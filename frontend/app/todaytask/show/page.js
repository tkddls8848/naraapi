import NoData from '@/app/components/common/no-data'
import TodaySearchBar from '@/app/components/today/today-search-bar'
import TodaySajeon from '@/app/components/today/today-sajeon'
import TodayBone from '@/app/components/today/today-bone'
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

  const hasData = sajeonData.length + boneData.length > 0

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
          <section aria-labelledby="today-sajeon-heading">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold tracking-tight" id="today-sajeon-heading">
                사전공고
              </h2>
              <span className="badge-brand">{sajeonData.length}건</span>
            </div>
            {sajeonData.length > 0 ? (
              <div className="notice-grid">
                {sajeonData.map((notice) => (
                  <TodaySajeon key={notice.id} task={notice} />
                ))}
              </div>
            ) : (
              <NoData
                message="오늘 등록된 사전공고가 없습니다."
                hint="본공고 결과를 확인해 보세요."
              />
            )}
          </section>

          <section aria-labelledby="today-bone-heading">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold tracking-tight" id="today-bone-heading">
                본공고
              </h2>
              <span className="badge-accent">{boneData.length}건</span>
            </div>
            {boneData.length > 0 ? (
              <div className="notice-grid">
                {boneData.map((notice) => (
                  <TodayBone key={notice.id} task={notice} />
                ))}
              </div>
            ) : (
              <NoData
                message="오늘 등록된 본공고가 없습니다."
                hint="사전공고 결과를 확인해 보세요."
              />
            )}
          </section>
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
