'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import jwt from 'jsonwebtoken'
import { getDb, users } from '@/lib/db'
import { requireUser, USER_COOKIE_MAX_AGE, USER_COOKIE_NAME } from '@/lib/auth'

function formText(formData, name) {
  return String(formData.get(name) ?? '')
}

async function setUserCookie(userId) {
  const token = jwt.sign({ userId }, process.env.TOKEN_SECRET_KEY, {
    expiresIn: USER_COOKIE_MAX_AGE,
  })
  const cookieStore = await cookies()
  cookieStore.set(USER_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: USER_COOKIE_MAX_AGE,
  })
}

async function expireUserCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(USER_COOKIE_NAME)
}

/**
 * @param {object|null} _previousState useActionState의 이전 상태
 * @param {FormData} formData userId, userPw
 * @returns {Promise<{ok: true}|{ok: false, reason: 'not-registered'|'wrong-password'}>}
 */
export async function signIn(_previousState, formData) {
  const userId = formText(formData, 'userId')
  const userPw = formText(formData, 'userPw')
  const db = getDb()
  const [user] = await db.select().from(users).where(eq(users.userId, userId)).limit(1)

  if (user == null) {
    return { ok: false, reason: 'not-registered' }
  }

  if (user.userPw !== userPw) {
    return { ok: false, reason: 'wrong-password' }
  }

  await setUserCookie(user.userId)
  revalidatePath('/')
  return { ok: true }
}

/**
 * @param {object|null} _previousState useActionState의 이전 상태
 * @param {FormData} formData userId, userPw, email
 * @returns {Promise<{ok: true}|{ok: false, reason: 'already-registered'}>}
 */
export async function signUp(_previousState, formData) {
  const userId = formText(formData, 'userId')
  const userPw = formText(formData, 'userPw')
  const email = formText(formData, 'email')
  const db = getDb()

  const inserted = await db
    .insert(users)
    .values({ userId, userPw, email })
    .onConflictDoNothing({ target: users.userId })
    .returning({ userId: users.userId })

  if (inserted.length === 0) {
    return { ok: false, reason: 'already-registered' }
  }

  await setUserCookie(userId)
  revalidatePath('/')
  return { ok: true }
}

/**
 * @param {object|null} _previousState useActionState의 이전 상태
 * @param {FormData} formData userPw, email
 * @returns {Promise<{ok: true}>}
 */
export async function updateAccount(_previousState, formData) {
  const userId = await requireUser()
  const userPw = formText(formData, 'userPw')
  const email = formText(formData, 'email')
  const db = getDb()

  await db.update(users).set({ userPw, email }).where(eq(users.userId, userId))
  await setUserCookie(userId)
  revalidatePath('/')
  return { ok: true }
}

/**
 * @returns {Promise<{ok: true}>}
 */
export async function signOut() {
  await expireUserCookie()
  revalidatePath('/')
  return { ok: true }
}

/**
 * @returns {Promise<{ok: true}>}
 */
export async function deleteAccount() {
  const userId = await requireUser()
  const db = getDb()
  await db.delete(users).where(eq(users.userId, userId))
  await expireUserCookie()
  revalidatePath('/')
  return { ok: true }
}
