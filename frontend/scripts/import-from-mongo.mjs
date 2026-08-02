/**
 * Mongo에서 Postgres로 한 번만 데이터를 옮기는 스크립트.
 *
 * 1) 기존 배포에서 내보내기
 *    docker compose exec -T mongo mongoexport -u "$MONGO_INITDB_ROOT_USERNAME" \
 *      -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin \
 *      --db naraapi --collection userlists --jsonArray > userlists.json
 *    (usertasklists도 같은 방식으로 내보낸다.)
 *
 * 2) Postgres가 빈 상태에서 넣기
 *    DATABASE_URL=postgres://... node scripts/import-from-mongo.mjs userlists.json usertasklists.json
 *
 * 여러 번 실행해도 기본 키나 공고 중복 제약과 충돌하는 행은 건너뛴다.
 */
import fs from 'node:fs'
import pg from 'pg'

const [usersPath, tasksPath] = process.argv.slice(2)

if (!usersPath || !tasksPath) {
  console.error('사용법: node scripts/import-from-mongo.mjs <userlists.json> <usertasklists.json>')
  process.exit(1)
}
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL 환경변수가 필요합니다.')
  process.exit(1)
}

function readJsonArray(path) {
  const parsed = JSON.parse(fs.readFileSync(path, 'utf8'))
  if (!Array.isArray(parsed)) {
    throw new Error(
      `${path}가 JSON 배열이 아닙니다. mongoexport에 --jsonArray를 붙였는지 확인하세요.`
    )
  }
  return parsed
}

function nullableText(value) {
  if (value == null || value === '') return null
  return String(value)
}

const userDocs = readJsonArray(usersPath)
const taskDocs = readJsonArray(tasksPath)

const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
await client.connect()

const summary = {
  users: 0,
  usersSkipped: 0,
  tasks: 0,
  tasksSkipped: 0,
  orphanTasks: [],
  tasksWithoutNumber: 0,
  tasksWithoutNoticeId: 0,
}

try {
  // 중간에 실패하면 일부만 남지 않도록 전체 이관을 한 트랜잭션으로 처리한다.
  await client.query('BEGIN')

  for (const doc of userDocs) {
    if (!doc.user_id) {
      summary.usersSkipped += 1
      continue
    }
    const res = await client.query(
      `INSERT INTO users (user_id, user_pw, email) VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO NOTHING`,
      [doc.user_id, doc.user_pw ?? '', doc.email ?? doc.e_mail ?? null]
    )
    if (res.rowCount === 1) summary.users += 1
    else summary.usersSkipped += 1
  }

  // 외래 키가 가리킬 사용자가 없는 저장 공고는 조용히 유실하지 않고 결과에 모아 알린다.
  const { rows: existing } = await client.query('SELECT user_id FROM users')
  const knownUsers = new Set(existing.map((row) => row.user_id))

  const ownedTasks = taskDocs.filter((doc) => {
    if (knownUsers.has(doc.user_id)) return true
    summary.orphanTasks.push(`${doc.user_id ?? '(user_id 없음)'} / ${doc.task_title ?? ''}`)
    return false
  })
  const hasNumber = (doc) =>
    doc.content_number != null &&
    doc.content_number !== '' &&
    Number.isInteger(Number(doc.content_number))
  const noticeFields = (doc) => ({
    noticeId: nullableText(doc.notice_id ?? doc.noticeId),
    noticeUrl: nullableText(doc.notice_url ?? doc.noticeUrl),
  })

  // 기존 Mongo 문서에는 공고 식별자와 링크가 없으므로 값을 추측하지 않고 NULL로 이관한다.
  // 제목은 고유하지 않고 링크도 복원할 수 없기 때문이다. Postgres UNIQUE는 NULL끼리는 중복으로
  // 보지 않으므로 새 저장 흐름에서는 noticeId를 반드시 전달해야 중복 제약이 완전히 적용된다.
  summary.tasksWithoutNoticeId = ownedTasks.filter(
    (doc) => noticeFields(doc).noticeId == null
  ).length

  // content_number가 있는 문서는 기존 기본 키를 유지한다. GENERATED ALWAYS identity에 값을 직접
  // 넣으려면 OVERRIDING SYSTEM VALUE가 필요하다.
  for (const doc of ownedTasks.filter(hasNumber)) {
    const { noticeId, noticeUrl } = noticeFields(doc)
    const res = await client.query(
      `INSERT INTO user_tasks
         (content_number, user_id, task_type, task_title, notice_id, notice_url)
       OVERRIDING SYSTEM VALUE VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT DO NOTHING`,
      [
        Number(doc.content_number),
        doc.user_id,
        doc.task_type ?? '',
        doc.task_title ?? '',
        noticeId,
        noticeUrl,
      ]
    )
    if (res.rowCount === 1) summary.tasks += 1
    else summary.tasksSkipped += 1
  }

  const bumpSequence = () =>
    client.query(`
      SELECT setval(
        pg_get_serial_sequence('user_tasks', 'content_number'),
        COALESCE((SELECT MAX(content_number) FROM user_tasks), 0) + 1,
        false
      )
    `)
  await bumpSequence()

  // 번호가 없는 레거시 문서는 identity가 새 번호를 만든다. notice_id가 NULL이면 UNIQUE 제약만으로
  // 재실행 중복을 막을 수 없으므로 사용자, 유형, 제목이 같은 레거시 행을 추가로 건너뛴다.
  for (const doc of ownedTasks.filter((doc) => !hasNumber(doc))) {
    summary.tasksWithoutNumber += 1
    const { noticeId, noticeUrl } = noticeFields(doc)
    const res = await client.query(
      `INSERT INTO user_tasks (user_id, task_type, task_title, notice_id, notice_url)
       SELECT $1, $2, $3, $4, $5
       WHERE NOT EXISTS (
         SELECT 1 FROM user_tasks
         WHERE user_id = $1
           AND task_type = $2
           AND (
             ($4::text IS NOT NULL AND notice_id = $4)
             OR ($4::text IS NULL AND notice_id IS NULL AND task_title = $3)
           )
       )
       ON CONFLICT DO NOTHING`,
      [doc.user_id, doc.task_type ?? '', doc.task_title ?? '', noticeId, noticeUrl]
    )
    if (res.rowCount === 1) summary.tasks += 1
    else summary.tasksSkipped += 1
  }

  await bumpSequence()
  await client.query('COMMIT')
} catch (err) {
  await client.query('ROLLBACK')
  console.error('이전 실패: 롤백했습니다.')
  throw err
} finally {
  await client.end()
}

console.log(`users       : ${summary.users}건 입력, ${summary.usersSkipped}건 건너뜀(중복/무효)`)
console.log(`user_tasks  : ${summary.tasks}건 입력, ${summary.tasksSkipped}건 건너뜀(중복)`)
if (summary.tasksWithoutNumber > 0) {
  console.log(`  content_number가 없어 새 번호를 부여한 건: ${summary.tasksWithoutNumber}`)
}
if (summary.tasksWithoutNoticeId > 0) {
  console.log(`  notice_id가 없어 NULL로 이관한 건: ${summary.tasksWithoutNoticeId}`)
}
if (summary.orphanTasks.length > 0) {
  console.log(
    `\n주인 없는 공고 ${summary.orphanTasks.length}건은 넣지 않았습니다(해당 user가 없음):`
  )
  summary.orphanTasks.forEach((item) => console.log(`  - ${item}`))
}
