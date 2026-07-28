import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import connectMongo from '@/lib/mongoose'
import User from '@/lib/models/user'
import UserTask from '@/lib/models/user-task'

const COOKIE_NAME = 'userCookie'
const EXPIRED_COOKIE_MAX_AGE = 0

export const dynamic = 'force-dynamic'

// 로그아웃
export async function GET(request, { params }) {
  const { userId } = await params

  // NOTE: 보안 강화는 사용자 결정에 따라 범위 밖 (jwt.sign 만 사용, 검증 없음)
  const token = jwt.sign({ userId }, process.env.TOKEN_SECRET_KEY, { expiresIn: '1s' })

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, { maxAge: EXPIRED_COOKIE_MAX_AGE })

  return NextResponse.json({ message: 'cookie del complete' })
}

// 회원탈퇴
export async function DELETE(request, { params }) {
  await connectMongo()

  const { userId } = await params
  await User.deleteOne({ user_id: userId })
  await UserTask.deleteMany({ user_id: userId })

  // NOTE: 보안 강화는 사용자 결정에 따라 범위 밖 (jwt.sign 만 사용, 검증 없음)
  const token = jwt.sign({ userId }, process.env.TOKEN_SECRET_KEY, { expiresIn: '1s' })

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, { maxAge: EXPIRED_COOKIE_MAX_AGE })

  return NextResponse.json({ state: process.env.STATUS_DELETE, token })
}
