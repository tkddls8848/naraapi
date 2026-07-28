import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import TodaySearchBar from '@/app/components/today/today-search-bar'

export const dynamic = 'force-dynamic'

export default async function TodayTaskPage() {
  const cookieStore = await cookies()
  if (!cookieStore.has('userCookie')) {
    redirect('/')
  }

  return (
    <div>
      <TodaySearchBar />
      <div className="flex flex-col items-center py-10 text-base">
        <div className="py-2">{format(new Date(), 'yyyy/MM/dd')}일의 기관별 공고 검색입니다.</div>
      </div>
    </div>
  )
}
