import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { eq } from 'drizzle-orm'
import jwt from 'jsonwebtoken'
import { getDb } from '@/lib/db'
import { users } from '@/lib/db/schema'

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
  const db = getDb()

  const { userId } = await params
  // 저장한 공고는 user_tasks 의 ON DELETE CASCADE 로 DB 가 같이 지운다.
  // Mongo 에서는 deleteOne + deleteMany 를 트랜잭션 없이 두 번 호출해서, 사이에서
  // 죽으면 주인 없는 공고가 남았다. 이제 한 문장이라 그 틈이 없다.
  await db.delete(users).where(eq(users.user_id, userId))

  // NOTE: 보안 강화는 사용자 결정에 따라 범위 밖 (jwt.sign 만 사용, 검증 없음)
  const token = jwt.sign({ userId }, process.env.TOKEN_SECRET_KEY, { expiresIn: '1s' })

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, { maxAge: EXPIRED_COOKIE_MAX_AGE })

  return NextResponse.json({ state: process.env.STATUS_DELETE, token })
}
