import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { archives } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

export async function GET() {
  const db = getDb()

  // 아카이브에 쓰는 코드는 아직 없어 지금은 빈 배열이 나간다.
  // Mongo 시절 문서의 _id 자리는 identity 컬럼 id 로 바뀌었다(참조하는 코드 없음).
  const rows = await db.select().from(archives)

  return NextResponse.json(rows)
}
