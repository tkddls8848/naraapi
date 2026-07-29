// mongo 컨테이너의 /docker-entrypoint-initdb.d 에 마운트된다.
// **/data/db 볼륨이 비어 있는 최초 기동에서만** 실행된다. 볼륨에 데이터가 이미 있으면
// 이 파일은 조용히 무시되므로, 나중에 계정을 만들거나 비밀번호를 바꿀 때는
// README 의 '앱 계정 수동 생성' 명령을 쓴다.
//
// 값을 셸에서 문자열로 끼워 넣지 않고 환경변수로 읽는다. 비밀번호에 $ ' " 같은 문자가
// 들어가도 깨지지 않게 하려는 것이다.
const dbName = process.env.MONGO_INITDB_DATABASE
const appUser = process.env.MONGO_APP_USER
const appPassword = process.env.MONGO_APP_PASSWORD

if (!dbName || !appUser || !appPassword) {
  throw new Error(
    '[init] MONGO_INITDB_DATABASE / MONGO_APP_USER / MONGO_APP_PASSWORD 가 모두 필요하다. ' +
      'frontend/config_files/.env.production 을 확인하라.'
  )
}

const appDb = db.getSiblingDB(dbName)

// 앱은 자기 DB 에만 읽고 쓴다. root 계정을 커넥션 문자열에 넣지 않기 위한 최소 권한 계정이다.
appDb.createUser({
  user: appUser,
  pwd: appPassword,
  roles: [{ role: 'readWrite', db: dbName }],
})

print(`[init] '${dbName}' DB 에 앱 계정 '${appUser}' 생성 완료`)
