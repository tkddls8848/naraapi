import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import connectMongo from '@/lib/mongoose'
import User from '@/lib/models/user'

const COOKIE_NAME = 'userCookie'
// Express maxAge(ms) 8640000 == Next maxAge(s) 8640 — 기존 2.4시간 수명 유지
const COOKIE_MAX_AGE = 8640

// 회원가입
export async function POST(request) {
  await connectMongo()

  const { user_id, user_pw, e_mail } = await request.json()
  const existingUser = await User.findOne({ user_id }).exec()

  if (existingUser != null) {
    return NextResponse.json({ state: process.env.STATUS_ALREADY_JOIN })
  }

  // NOTE: 보안 강화는 사용자 결정에 따라 범위 밖 (평문 저장 유지)
  await new User({ user_id, user_pw, e_mail }).save()

  const token = jwt.sign({ userId: user_id }, process.env.TOKEN_SECRET_KEY)

  const cookieStore = await cookies()
  // NOTE: 보안 강화는 사용자 결정에 따라 범위 밖 (httpOnly/secure 미설정 유지)
  cookieStore.set(COOKIE_NAME, token, { maxAge: COOKIE_MAX_AGE })

  return NextResponse.json({ state: process.env.STATUS_JOIN, token })
}

// 회원정보 수정
export async function PATCH(request) {
  await connectMongo()

  const { user_id, user_pw, e_mail } = await request.json()
  // NOTE: 보안 강화는 사용자 결정에 따라 범위 밖 (평문 저장 유지)
  await User.updateOne({ user_id }, { $set: { user_id, user_pw, e_mail } }).exec()

  const token = jwt.sign({ userId: user_id }, process.env.TOKEN_SECRET_KEY)

  const cookieStore = await cookies()
  // NOTE: 보안 강화는 사용자 결정에 따라 범위 밖 (httpOnly/secure 미설정 유지)
  cookieStore.set(COOKIE_NAME, token, { maxAge: COOKIE_MAX_AGE })

  return NextResponse.json({ state: process.env.STATUS_MODIFY, token })
}
