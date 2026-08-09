import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import jwt from 'jsonwebtoken'

export const USER_COOKIE_NAME = 'userCookie'
export const USER_COOKIE_MAX_AGE = 8640

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get(USER_COOKIE_NAME)?.value
  if (!token) return null

  try {
    const payload = jwt.verify(token, process.env.TOKEN_SECRET_KEY)
    return typeof payload.userId === 'string' ? payload.userId : null
  } catch {
    return null
  }
}

export async function requireUser() {
  const userId = await getCurrentUser()
  if (!userId) redirect('/')
  return userId
}
