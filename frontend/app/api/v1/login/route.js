import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { eq } from 'drizzle-orm'
import jwt from 'jsonwebtoken'
import { getDb } from '@/lib/db'
import { users } from '@/lib/db/schema'

const COOKIE_NAME = 'userCookie'
// Express maxAge(ms) 8640000 == Next maxAge(s) 8640 — 기존 2.4시간 수명 유지
const COOKIE_MAX_AGE = 8640

// 회원가입
export async function POST(request) {
  const db = getDb()

  const { user_id, user_pw, e_mail } = await request.json()

  // Mongo 시절에는 findOne 으로 확인한 뒤 insert 해서 두 요청이 겹치면 경합이 있었다.
  // PK 충돌을 DB 가 판정하게 하면 한 문장으로 끝나고 경합도 사라진다.
  // NOTE: 보안 강화는 사용자 결정에 따라 범위 밖 (평문 저장 유지)
  const inserted = await db
    .insert(users)
    .values({ user_id, user_pw, e_mail })
    .onConflictDoNothing({ target: users.user_id })
    .returning({ user_id: users.user_id })

  if (inserted.length === 0) {
    return NextResponse.json({ state: process.env.STATUS_ALREADY_JOIN })
  }

  const token = jwt.sign({ userId: user_id }, process.env.TOKEN_SECRET_KEY)

  const cookieStore = await cookies()
  // NOTE: 보안 강화는 사용자 결정에 따라 범위 밖 (httpOnly/secure 미설정 유지)
  cookieStore.set(COOKIE_NAME, token, { maxAge: COOKIE_MAX_AGE })

  return NextResponse.json({ state: process.env.STATUS_JOIN, token })
}

// 회원정보 수정
export async function PATCH(request) {
  const db = getDb()

  const { user_id, user_pw, e_mail } = await request.json()
  // 기존 $set 은 user_id 까지 자기 값으로 덮어썼지만, 이제 PK 라 갱신 대상이 아니다.
  // NOTE: 보안 강화는 사용자 결정에 따라 범위 밖 (평문 저장 유지)
  await db.update(users).set({ user_pw, e_mail }).where(eq(users.user_id, user_id))

  const token = jwt.sign({ userId: user_id }, process.env.TOKEN_SECRET_KEY)

  const cookieStore = await cookies()
  // NOTE: 보안 강화는 사용자 결정에 따라 범위 밖 (httpOnly/secure 미설정 유지)
  cookieStore.set(COOKIE_NAME, token, { maxAge: COOKIE_MAX_AGE })

  return NextResponse.json({ state: process.env.STATUS_MODIFY, token })
}
