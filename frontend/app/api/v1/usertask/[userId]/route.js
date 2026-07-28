import { NextResponse } from 'next/server'
import connectMongo from '@/lib/mongoose'
import UserTask from '@/lib/models/user-task'

// 기존 express 라우터는 GET 은 :userId, DELETE 는 :contentNumber 로 같은 자리를 썼다.
// Next 는 한 경로 단계에 서로 다른 슬러그 이름을 둘 수 없으므로 [userId] 하나로 합치고
// DELETE 안에서만 content_number 로 해석한다. URL 모양은 기존과 동일하다.
export const dynamic = 'force-dynamic'

export async function GET(request, { params }) {
  await connectMongo()

  const { userId } = await params
  const tasks = await UserTask.find({ user_id: userId }).lean()
  const result = tasks.map((task) => [
    task.user_id,
    task.task_type,
    task.task_title,
    task.content_number,
  ])

  return NextResponse.json({ message: 'complete', result })
}

export async function DELETE(request, { params }) {
  await connectMongo()

  const { userId: contentNumber } = await params
  await UserTask.deleteOne({ content_number: contentNumber })

  return NextResponse.json({ message: 'complete', contentNumber })
}
