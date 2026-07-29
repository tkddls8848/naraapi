import { index, integer, jsonb, pgTable, text } from 'drizzle-orm/pg-core'

/**
 * 컬럼명은 Mongo 시절 필드명(user_id, task_type, content_number ...)을 그대로 쓴다.
 * API 응답이 이 이름들을 그대로 실어 보내므로 프론트를 건드리지 않기 위한 것이고,
 * 데이터 이전 스크립트의 매핑도 1:1 로 단순해진다.
 *
 * 이 파일은 쿼리용 선언이고, 실제 테이블을 만드는 DDL 은 postgres/init/01-schema.sql 이다.
 * 스키마를 바꿀 때는 두 파일을 함께 고쳐야 한다. 어긋나면 기동 후 첫 쿼리에서 바로 깨진다.
 */

export const users = pgTable('users', {
  // 로그인 아이디가 자연키다. 대리키를 따로 두지 않고 이걸 PK 로 쓴다.
  user_id: text('user_id').primaryKey(),
  // NOTE: 보안 강화는 사용자 결정에 따라 범위 밖 — 평문 저장을 유지한다.
  user_pw: text('user_pw').notNull(),
  e_mail: text('e_mail'),
})

export const userTasks = pgTable(
  'user_tasks',
  {
    // Mongo 에서는 mongoose-sequence 가 카운터 컬렉션으로 흉내내던 값이다.
    // Postgres 에서는 identity 컬럼이라 별도 카운터도, 추가 왕복도 없다.
    content_number: integer('content_number').primaryKey().generatedAlwaysAsIdentity(),
    // 유저가 지워지면 저장한 공고도 DB 가 함께 지운다(ON DELETE CASCADE).
    // 앱 코드에서 두 번 삭제하던 것을 DB 제약으로 옮긴 것이다.
    user_id: text('user_id')
      .notNull()
      .references(() => users.user_id, { onDelete: 'cascade' }),
    task_type: text('task_type').notNull(),
    task_title: text('task_title').notNull(),
  },
  (table) => [
    // Postgres 는 외래키에 인덱스를 자동으로 만들지 않는다. 목록 조회가 이 컬럼으로만 걸린다.
    index('user_tasks_user_id_idx').on(table.user_id),
  ]
)

/**
 * 공고 아카이빙용. 나라장터 API 는 물품/공사/용역 엔드포인트마다 응답 필드가 달라서
 * 원본 JSON 을 그대로 담는다(jsonb). 아직 쓰는 코드는 없고 GET /api/v1/logic 이 읽기만 한다.
 */
export const archives = pgTable('archives', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  depart_name: text('depart_name'),
  task_type: text('task_type'),
  date: text('date'),
  task_data: jsonb('task_data'),
})
