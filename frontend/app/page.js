import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import LoginPanel from './login-panel'

const GUEST = 'Guest'

export default async function LoginPage() {
  const cookieStore = await cookies()
  // NOTE: 보안 강화는 사용자 결정에 따라 범위 밖 — 서명 검증 없이 payload 만 읽는다.
  const payload = jwt.decode(cookieStore.get('userCookie')?.value)
  const loginState = payload ? payload.userId : GUEST

  return <LoginPanel loginState={loginState} />
}
