import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { userTasks } from '@/lib/db/schema'

export async function POST(request) {
  const db = getDb()

  const { user_id, task_type, task_title } = await request.json()
  // content_number 는 identity 컬럼이라 DB 가 채운다(구 mongoose-sequence 대체).
  await db.insert(userTasks).values({ user_id, task_type, task_title })

  return NextResponse.json({ message: 'complete' })
}
