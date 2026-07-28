import { NextResponse } from 'next/server'
import connectMongo from '@/lib/mongoose'
import UserTask from '@/lib/models/user-task'

export async function POST(request) {
  await connectMongo()

  const { user_id, task_type, task_title } = await request.json()
  await new UserTask({ user_id, task_type, task_title }).save()

  return NextResponse.json({ message: 'complete' })
}
