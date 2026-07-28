import { NextResponse } from 'next/server'
import { fetchNoticesByDepart } from '@/lib/nara-api'

// 외부 나라장터 API 의존 — 캐싱되면 오래된 공고가 나간다.
export const dynamic = 'force-dynamic'

export async function GET(request, { params }) {
  const { departname } = await params
  const { searchParams } = new URL(request.url)

  const notices = await fetchNoticesByDepart({
    kind: 'bone',
    departName: departname,
    beginDate: searchParams.get('beginDate'),
    endDate: searchParams.get('endDate'),
  })

  return NextResponse.json(notices)
}
