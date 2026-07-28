import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import NoData from '@/app/components/common/no-data'
import TodaySearchBar from '@/app/components/today/today-search-bar'
import TodaySajeon from '@/app/components/today/today-sajeon'
import TodayBone from '@/app/components/today/today-bone'
import { fetchNoticesForDepartList, noticeKey } from '@/lib/nara-api'

export const dynamic = 'force-dynamic'

function toDepartList(departParam) {
  if (departParam == null) {
    return []
  }
  return Array.isArray(departParam) ? departParam : [departParam]
}

export default async function TodayTaskShowPage({ searchParams }) {
  const cookieStore = await cookies()
  if (!cookieStore.has('userCookie')) {
    redirect('/')
  }

  const { depart } = await searchParams
  const departList = toDepartList(depart)
  const [sajeonData, boneData] = await Promise.all([
    fetchNoticesForDepartList({ kind: 'sajeon', departList }),
    fetchNoticesForDepartList({ kind: 'bone', departList }),
  ])

  // FIXME: 사전공고가 비면 본공고가 있어도 NoData 를 띄운다. 기존 동작 그대로 보존한 것이다.
  const hasData = sajeonData.length > 0

  return (
    <div>
      <TodaySearchBar />
      <div>
        {hasData ? (
          <div className="h-full w-full p-4 grid gap-2 grid-cols-4">
            {sajeonData.map((sajeon, index) => (
              <div key={noticeKey(sajeon, `sajeon-${index}`)}>
                <TodaySajeon task={sajeon} />
              </div>
            ))}
            {boneData.map((bone, index) => (
              <div key={noticeKey(bone, `bone-${index}`)}>
                <TodayBone task={bone} />
              </div>
            ))}
          </div>
        ) : (
          <NoData />
        )}
      </div>
    </div>
  )
}
