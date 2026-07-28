import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import connectMongo from '@/lib/mongoose'
import User from '@/lib/models/user'

const COOKIE_NAME = 'userCookie'
// Express maxAge(ms) 8640000 == Next maxAge(s) 8640 — 기존 2.4시간 수명 유지
const COOKIE_MAX_AGE = 8640

export async function POST(request) {
  await connectMongo()

  const { user_id, user_pw } = await request.json()
  const signinUser = await User.findOne({ user_id }).exec()

  if (signinUser == null) {
    // 미등록도 기존과 동일하게 HTTP 200 으로 응답한다.
    return NextResponse.json({ state: process.env.STATUS_NO_REGITERED })
  }

  // NOTE: 보안 강화는 사용자 결정에 따라 범위 밖 (평문 비교 유지)
  if (signinUser.user_pw !== user_pw) {
    return NextResponse.json({ state: process.env.STATUS_WRONG_PASSWORD })
  }

  // NOTE: 보안 강화는 사용자 결정에 따라 범위 밖 (jwt.sign 만 사용, 검증 없음)
  const token = jwt.sign({ userId: signinUser.user_id }, process.env.TOKEN_SECRET_KEY)

  const cookieStore = await cookies()
  // NOTE: 보안 강화는 사용자 결정에 따라 범위 밖 (httpOnly/secure 미설정 유지)
  cookieStore.set(COOKIE_NAME, token, { maxAge: COOKIE_MAX_AGE })

  return NextResponse.json({ state: process.env.STATUS_REGITERED, data: token })
}
