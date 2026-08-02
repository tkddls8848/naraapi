import { index, integer, pgTable, text, unique } from 'drizzle-orm/pg-core'

/**
 * 애플리케이션에서는 camelCase 프로퍼티를 사용하고, 실제 Postgres 컬럼에는 snake_case를 사용한다.
 * 이 선언은 쿼리용이며 실제 테이블은 postgres/init/01-schema.sql에서 생성하므로 두 파일을 함께 갱신한다.
 */

export const users = pgTable('users', {
  // 로그인 아이디가 자연키이므로 별도의 대리키 없이 기본 키로 사용한다.
  userId: text('user_id').primaryKey(),
  // NOTE: 보안 강화는 사용자 결정에 따라 범위 밖이며 평문 저장 방식을 유지한다.
  userPw: text('user_pw').notNull(),
  email: text('email'),
})

export const userTasks = pgTable(
  'user_tasks',
  {
    // Mongo의 mongoose-sequence 값을 보존할 수 있도록 Postgres identity 기본 키를 사용한다.
    contentNumber: integer('content_number').primaryKey().generatedAlwaysAsIdentity(),
    userId: text('user_id')
      .notNull()
      .references(() => users.userId, { onDelete: 'cascade' }),
    taskType: text('task_type').notNull(),
    taskTitle: text('task_title').notNull(),
    // 기존 Mongo 문서에는 두 값이 없으므로 마이그레이션 호환을 위해 nullable로 둔다.
    noticeId: text('notice_id'),
    noticeUrl: text('notice_url'),
  },
  (table) => [
    index('user_tasks_user_id_idx').on(table.userId),
    // 공고 번호의 체계가 유형마다 다르므로 유형까지 포함해 같은 공고의 중복 저장을 막는다.
    unique('user_tasks_user_notice_unique').on(table.userId, table.taskType, table.noticeId),
  ]
)
