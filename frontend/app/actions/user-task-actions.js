'use server'

import { revalidatePath } from 'next/cache'
import { and, eq } from 'drizzle-orm'
import { getDb, userTasks } from '@/lib/db'
import { requireUser } from '@/lib/auth'

function formText(formData, name) {
  return String(formData.get(name) ?? '')
}

/**
 * @typedef {object} SavedNotice
 * @property {number} contentNumber
 * @property {string} taskType
 * @property {string} taskTitle
 * @property {string} noticeId
 * @property {string|null} noticeUrl
 */

/**
 * @returns {Promise<{userId: string, notices: SavedNotice[]}>}
 */
export async function getSavedNotices() {
  const userId = await requireUser()
  const db = getDb()
  const notices = await db
    .select({
      contentNumber: userTasks.contentNumber,
      taskType: userTasks.taskType,
      taskTitle: userTasks.taskTitle,
      noticeId: userTasks.noticeId,
      noticeUrl: userTasks.noticeUrl,
    })
    .from(userTasks)
    .where(eq(userTasks.userId, userId))

  return { userId, notices }
}

/**
 * @param {object|null} _previousState useActionState의 이전 상태
 * @param {FormData} formData taskType, taskTitle, noticeId, noticeUrl
 * @returns {Promise<{ok: true}|{ok: false, reason: 'already-saved'}>}
 */
export async function saveUserTask(_previousState, formData) {
  const userId = await requireUser()
  const taskType = formText(formData, 'taskType')
  const taskTitle = formText(formData, 'taskTitle')
  const noticeId = formText(formData, 'noticeId')
  const noticeUrl = formText(formData, 'noticeUrl') || null
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
  return { ok: true }
}

/**
 * @param {object|null} _previousState useActionState의 이전 상태
 * @param {FormData} formData contentNumber
 * @returns {Promise<{ok: true}>}
 */
export async function deleteUserTask(_previousState, formData) {
  const userId = await requireUser()
  const contentNumber = Number(formData.get('contentNumber'))
  const db = getDb()
  await db
    .delete(userTasks)
    .where(and(eq(userTasks.contentNumber, contentNumber), eq(userTasks.userId, userId)))

  revalidatePath('/usertask')
  return { ok: true }
}
