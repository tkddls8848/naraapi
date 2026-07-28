import { NextResponse } from 'next/server'
import { fetchNoticesForDepartList } from '@/lib/nara-api'

// 외부 나라장터 API 의존 — 캐싱되면 오래된 공고가 나간다.
export const dynamic = 'force-dynamic'

export async function POST(request) {
  const { departList } = await request.json()
  const notices = await fetchNoticesForDepartList({ kind: 'bone', departList })

  return NextResponse.json(notices)
}
