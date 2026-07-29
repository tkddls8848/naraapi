import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { userTasks } from '@/lib/db/schema'

// 기존 express 라우터는 GET 은 :userId, DELETE 는 :contentNumber 로 같은 자리를 썼다.
// Next 는 한 경로 단계에 서로 다른 슬러그 이름을 둘 수 없으므로 [userId] 하나로 합치고
// DELETE 안에서만 content_number 로 해석한다. URL 모양은 기존과 동일하다.
export const dynamic = 'force-dynamic'

export async function GET(request, { params }) {
  const db = getDb()

  const { userId } = await params
  const tasks = await db.select().from(userTasks).where(eq(userTasks.user_id, userId))
  const result = tasks.map((task) => [
    task.user_id,
    task.task_type,
    task.task_title,
    task.content_number,
  ])

  return NextResponse.json({ message: 'complete', result })
}

export async function DELETE(request, { params }) {
  const db = getDb()

  const { userId: contentNumber } = await params
  // Mongoose 는 문자열을 스키마 타입으로 캐스팅해 줬지만 여기서는 직접 정수로 바꾼다.
  // 숫자가 아니면 잘못된 SQL 을 보내지 않고 400 으로 끊는다.
  const parsed = Number(contentNumber)
  if (!Number.isInteger(parsed)) {
    return NextResponse.json({ message: 'invalid content number', contentNumber }, { status: 400 })
  }

  await db.delete(userTasks).where(eq(userTasks.content_number, parsed))

  return NextResponse.json({ message: 'complete', contentNumber })
}
