import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import jwt from 'jsonwebtoken'

export const USER_COOKIE_NAME = 'userCookie'
export const USER_COOKIE_MAX_AGE = 8640

async function readCurrentSession() {
  const cookieStore = await cookies()
  const hasCookie = cookieStore.has(USER_COOKIE_NAME)
  const token = cookieStore.get(USER_COOKIE_NAME)?.value

  // NOTE: 보안 강화는 사용자 결정에 따라 범위 밖이므로 서명 검증 없이 payload만 읽는다.
  const userId = token ? jwt.decode(token)?.userId : undefined
  return { hasCookie, userId }
}

/**
 * 현재 쿠키에서 사용자 아이디를 읽는다.
 *
 * @returns {Promise<string|null|undefined>}
 */
export async function getCurrentUser() {
  const { userId } = await readCurrentSession()
  return userId ?? null
}

/**
 * 로그인 쿠키가 없으면 홈으로 이동하고, 있으면 검증하지 않은 payload의 사용자 아이디를 반환한다.
 * 쿠키 내용의 유효성이 아니라 쿠키 존재 여부만 보는 기존 판정 기준을 유지한다.
 *
 * @returns {Promise<string|undefined>}
 */
export async function requireUser() {
  const { hasCookie, userId } = await readCurrentSession()
  if (!hasCookie) {
    redirect('/')
  }
  return userId
}
