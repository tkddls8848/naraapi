import { drizzle } from 'drizzle-orm/node-postgres'
import { index, integer, pgTable, text, unique } from 'drizzle-orm/pg-core'
import { Pool } from 'pg'

export const users = pgTable('users', {
  userId: text('user_id').primaryKey(),
  userPw: text('user_pw').notNull(),
  email: text('email'),
})

export const userTasks = pgTable(
  'user_tasks',
  {
    contentNumber: integer('content_number').primaryKey().generatedAlwaysAsIdentity(),
    userId: text('user_id')
      .notNull()
      .references(() => users.userId, { onDelete: 'cascade' }),
    taskType: text('task_type').notNull(),
    taskTitle: text('task_title').notNull(),
    noticeId: text('notice_id').notNull(),
    noticeUrl: text('notice_url'),
  },
  (table) => [
    index('user_tasks_user_id_idx').on(table.userId),
    unique('user_tasks_user_notice_unique').on(table.userId, table.taskType, table.noticeId),
  ]
)

const CACHE_KEY = '__naraapiDrizzle'

export function getDb() {
  const cached = globalThis[CACHE_KEY]
  if (cached) return cached

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL 환경변수가 설정되지 않았습니다.')
  }

  const pool = new Pool({ connectionString, max: 5 })
  const db = drizzle(pool, { schema: { users, userTasks } })

  globalThis[CACHE_KEY] = db
  return db
}
