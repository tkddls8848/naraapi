import { NextResponse } from 'next/server'
import { fetchDminsttList } from '@/lib/nara-api'

// 외부 나라장터 API 의존 — 캐싱되면 오래된 목록이 나간다.
export const dynamic = 'force-dynamic'

export async function GET() {
  const departList = await fetchDminsttList()

  return NextResponse.json(departList)
}
