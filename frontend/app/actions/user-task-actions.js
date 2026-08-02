'use server'

import { revalidatePath } from 'next/cache'
import { and, eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { userTasks } from '@/lib/db/schema'
import { requireUser } from '@/lib/auth'

function formText(formData, name) {
  return String(formData.get(name) ?? '')
}

/**
 * @typedef {object} SavedNotice
 * @property {number} contentNumber
 * @property {string} userId
 * @property {string} taskType
 * @property {string} taskTitle
 * @property {string|null} noticeId
 * @property {string|null} noticeUrl
 */

/**
 * @returns {Promise<SavedNotice[]>}
 */
export async function getSavedNotices() {
  const userId = await requireUser()
  if (!userId) return []

  const db = getDb()
  return db
    .select({
      contentNumber: userTasks.contentNumber,
      userId: userTasks.userId,
      taskType: userTasks.taskType,
      taskTitle: userTasks.taskTitle,
      noticeId: userTasks.noticeId,
      noticeUrl: userTasks.noticeUrl,
    })
    .from(userTasks)
    .where(eq(userTasks.userId, userId))
}

/**
 * @param {object|null} _previousState useActionState의 이전 상태
 * @param {FormData} formData taskType, taskTitle, noticeId, noticeUrl
 * @returns {Promise<{ok: true, contentNumber: number}|{ok: false, reason: 'invalid-session'|'missing-notice-id'|'already-saved'}>}
 */
export async function saveUserTask(_previousState, formData) {
  const userId = await requireUser()
  if (!userId) {
    return { ok: false, reason: 'invalid-session' }
  }

  const taskType = formText(formData, 'taskType')
  const taskTitle = formText(formData, 'taskTitle')
  const noticeId = formText(formData, 'noticeId')
  const noticeUrl = formText(formData, 'noticeUrl') || null
  if (!noticeId) {
    return { ok: false, reason: 'missing-notice-id' }
  }

  const db = getDb()
  const inserted = await db
    .insert(userTasks)
    .values({ userId, taskType, taskTitle, noticeId, noticeUrl })
    .onConflictDoNothing()
    .returning({ contentNumber: userTasks.contentNumber })

  if (inserted.length === 0) {
    return { ok: false, reason: 'already-saved' }
  }

  revalidatePath('/usertask')
  return { ok: true, contentNumber: inserted[0].contentNumber }
}

/**
 * @param {object|null} _previousState useActionState의 이전 상태
 * @param {FormData} formData contentNumber
 * @returns {Promise<{ok: true, contentNumber: number}|{ok: false, reason: 'invalid-session'|'invalid-content-number'|'not-found'}>}
 */
export async function deleteUserTask(_previousState, formData) {
  const userId = await requireUser()
  if (!userId) {
    return { ok: false, reason: 'invalid-session' }
  }

  const contentNumber = Number(formData.get('contentNumber'))
  if (!Number.isInteger(contentNumber)) {
    return { ok: false, reason: 'invalid-content-number' }
  }

  const db = getDb()
  const deleted = await db
    .delete(userTasks)
    .where(and(eq(userTasks.contentNumber, contentNumber), eq(userTasks.userId, userId)))
    .returning({ contentNumber: userTasks.contentNumber })

  if (deleted.length === 0) {
    return { ok: false, reason: 'not-found' }
  }

  revalidatePath('/usertask')
  return { ok: true, contentNumber }
}
