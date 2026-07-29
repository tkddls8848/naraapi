/**
 * Mongo → Postgres 일회성 데이터 이전 스크립트.
 *
 * Mongo 드라이버를 쓰지 않고 mongoexport 로 뽑은 JSON 파일을 읽는다. 이렇게 하면
 * Mongo 컨테이너를 이미 내린 뒤에도 이전이 가능하고, 앱에 불필요한 의존성이 남지 않는다.
 *
 * 1) 기존 배포에서 내보내기
 *    docker compose exec -T mongo mongoexport -u "$MONGO_INITDB_ROOT_USERNAME" \
 *      -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin \
 *      --db naraapi --collection userlists --jsonArray > userlists.json
 *    (usertasklists 도 같은 방식으로)
 *
 * 2) Postgres 가 뜬 상태에서 넣기
 *    DATABASE_URL=postgres://... node scripts/import-from-mongo.mjs userlists.json usertasklists.json
 *
 * 두 번 돌려도 안전하다(PK 충돌은 건너뛴다).
 */
import fs from 'node:fs'
import pg from 'pg'

const [usersPath, tasksPath] = process.argv.slice(2)

if (!usersPath || !tasksPath) {
  console.error('사용법: node scripts/import-from-mongo.mjs <userlists.json> <usertasklists.json>')
  process.exit(1)
}
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL 환경변수가 필요하다.')
  process.exit(1)
}

function readJsonArray(path) {
  const parsed = JSON.parse(fs.readFileSync(path, 'utf8'))
  if (!Array.isArray(parsed)) {
    throw new Error(
      `${path} 가 JSON 배열이 아니다. mongoexport 에 --jsonArray 를 붙였는지 확인하라.`
    )
  }
  return parsed
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
}

try {
  // 중간에 실패하면 아무것도 남지 않게 한 트랜잭션으로 처리한다.
  await client.query('BEGIN')

  for (const doc of userDocs) {
    if (!doc.user_id) {
      summary.usersSkipped += 1
      continue
    }
    const res = await client.query(
      `INSERT INTO users (user_id, user_pw, e_mail) VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO NOTHING`,
      [doc.user_id, doc.user_pw ?? '', doc.e_mail ?? null]
    )
    if (res.rowCount === 1) summary.users += 1
    else summary.usersSkipped += 1
  }

  // 외래키가 걸려 있어 주인 없는 공고는 넣을 수 없다. 조용히 실패시키지 않고 모아서 보고한다.
  const { rows: existing } = await client.query('SELECT user_id FROM users')
  const knownUsers = new Set(existing.map((row) => row.user_id))

  const ownedTasks = taskDocs.filter((doc) => {
    if (knownUsers.has(doc.user_id)) return true
    summary.orphanTasks.push(`${doc.user_id ?? '(user_id 없음)'} / ${doc.task_title ?? ''}`)
    return false
  })
  const hasNumber = (doc) => Number.isInteger(Number(doc.content_number))

  // 번호가 있는 문서를 먼저 넣는다. 번호 없는 문서를 섞어서 넣으면 identity 가 낮은 번호를
  // 먼저 내주고, 뒤에 오는 명시적 번호가 그것과 충돌해 조용히 건너뛰어질 수 있다.
  // content_number 는 GENERATED ALWAYS 라서 값을 직접 넣으려면 OVERRIDING 이 필요하다.
  for (const doc of ownedTasks.filter(hasNumber)) {
    const res = await client.query(
      `INSERT INTO user_tasks (content_number, user_id, task_type, task_title)
       OVERRIDING SYSTEM VALUE VALUES ($1, $2, $3, $4)
       ON CONFLICT (content_number) DO NOTHING`,
      [Number(doc.content_number), doc.user_id, doc.task_type ?? '', doc.task_title ?? '']
    )
    if (res.rowCount === 1) summary.tasks += 1
    else summary.tasksSkipped += 1
  }

  // 번호를 직접 넣었으므로 identity 시퀀스를 최대값 뒤로 옮긴다.
  // 이걸 빼면 이어지는 insert 와 이후 앱의 저장에서 PK 충돌이 난다.
  const bumpSequence = () =>
    client.query(`
      SELECT setval(
        pg_get_serial_sequence('user_tasks', 'content_number'),
        COALESCE((SELECT MAX(content_number) FROM user_tasks), 0) + 1,
        false
      )
    `)
  await bumpSequence()

  // 번호가 없던 문서는 이제 최대값 뒤의 새 번호를 받는다.
  // 충돌 판정에 쓸 PK 가 없어 그냥 넣으면 재실행 때 중복되므로, 같은
  // (user_id, task_type, task_title) 이 이미 있으면 건너뛴다. 원본에 정말로 같은 공고가
  // 두 번 있었다면 한 건으로 합쳐지는데, 번호 없는 레거시 문서에 한정된 이야기라
  // 중복 삽입보다 이쪽이 낫다고 봤다.
  for (const doc of ownedTasks.filter((doc) => !hasNumber(doc))) {
    summary.tasksWithoutNumber += 1
    const res = await client.query(
      `INSERT INTO user_tasks (user_id, task_type, task_title)
       SELECT $1, $2, $3
       WHERE NOT EXISTS (
         SELECT 1 FROM user_tasks
         WHERE user_id = $1 AND task_type = $2 AND task_title = $3
       )`,
      [doc.user_id, doc.task_type ?? '', doc.task_title ?? '']
    )
    if (res.rowCount === 1) summary.tasks += 1
    else summary.tasksSkipped += 1
  }

  await bumpSequence()

  await client.query('COMMIT')
} catch (err) {
  await client.query('ROLLBACK')
  console.error('이전 실패 — 롤백했다.')
  throw err
} finally {
  await client.end()
}

console.log(`users       : ${summary.users}건 입력, ${summary.usersSkipped}건 건너뜀(중복/무효)`)
console.log(`user_tasks  : ${summary.tasks}건 입력, ${summary.tasksSkipped}건 건너뜀(중복)`)
if (summary.tasksWithoutNumber > 0) {
  console.log(`  content_number 가 없어 새 번호를 부여한 건: ${summary.tasksWithoutNumber}`)
}
if (summary.orphanTasks.length > 0) {
  console.log(`\n주인 없는 공고 ${summary.orphanTasks.length}건은 넣지 않았다 (해당 user 가 없음):`)
  summary.orphanTasks.forEach((item) => console.log(`  - ${item}`))
}
