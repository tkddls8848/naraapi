# 나라장터 공고 검색 서비스 NARA-P

나라장터의 사전규격과 본공고를 기관별로 조회하고, 로그인한 사용자가 관심 공고를 저장하는 Next.js 애플리케이션입니다. 내부 요청은 별도 REST API가 아니라 Server Component와 Server Action으로 처리합니다.

- 서비스: [https://www.naraapi.com](https://www.naraapi.com)
- 웹: Next.js 16 App Router, React 19, Tailwind CSS 4
- 데이터: PostgreSQL 17, Drizzle ORM
- 외부 데이터: [나라장터 공공데이터포털 API](https://www.data.go.kr/index.do)
- 배포: Docker Compose, Next.js standalone 이미지

## URL

| URL                         | 설명                             |
| --------------------------- | -------------------------------- |
| `/`                         | 로그인 및 서비스 진입            |
| `/userlogin/join`           | 회원 가입                        |
| `/userlogin/modify`         | 회원 정보 수정                   |
| `/userlogin/delete`         | 회원 탈퇴                        |
| `/task`                     | 기관과 기간을 지정하는 공고 검색 |
| `/task/sajeon/[departname]` | 기관별 사전규격 검색 결과        |
| `/task/bone/[departname]`   | 기관별 본공고 검색 결과          |
| `/todaytask`                | 오늘 공고를 조회할 기관 선택     |
| `/todaytask/show`           | 선택한 기관들의 오늘 공고        |
| `/usertask`                 | 저장한 공고 조회 및 삭제         |
| `/list?query=기관명`        | 수요기관 이름과 코드 검색        |

## 서버 동작과 Server Actions

`frontend/app/api`는 사용하지 않습니다. 페이지의 서버 컴포넌트가 `frontend/lib/nara-api.js`를 호출해 나라장터 데이터를 읽고, 변경 작업은 아래 Server Action을 폼에 직접 연결합니다.

| 모듈                               | 함수                                      | 입력                                             | 반환                                                                              |
| ---------------------------------- | ----------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------- |
| `app/actions/auth-actions.js`      | `signIn(previousState, formData)`         | `userId`, `userPw`                               | `{ ok: true }` 또는 `{ ok: false, reason: 'not-registered' \| 'wrong-password' }` |
|                                    | `signUp(previousState, formData)`         | `userId`, `userPw`, `email`                      | `{ ok: true }` 또는 `{ ok: false, reason: 'already-registered' }`                 |
|                                    | `updateAccount(previousState, formData)`  | `userPw`, `email`                                | `{ ok: true }` 또는 `{ ok: false, reason: 'invalid-session' }`                    |
|                                    | `signOut()`                               | 없음                                             | `{ ok: true }`                                                                    |
|                                    | `deleteAccount()`                         | 없음                                             | `{ ok: true }` 또는 `{ ok: false, reason: 'invalid-session' }`                    |
| `app/actions/user-task-actions.js` | `getSavedNotices()`                       | 없음                                             | 저장 공고 객체 배열                                                               |
|                                    | `saveUserTask(previousState, formData)`   | `taskType`, `taskTitle`, `noticeId`, `noticeUrl` | `{ ok: true, contentNumber }` 또는 실패 사유                                      |
|                                    | `deleteUserTask(previousState, formData)` | `contentNumber`                                  | `{ ok: true, contentNumber }` 또는 실패 사유                                      |

저장 공고 객체는 `{ contentNumber, userId, taskType, taskTitle, noticeId, noticeUrl }` 형태입니다. 나라장터 조회 결과는 `{ id, title, departName, registeredAt, closesAt, fileUrl, kind, isNew, raw }` 형태로 정규화되므로 화면은 원본 API별 필드 순서에 의존하지 않습니다.

## 환경 변수

배포용 샘플은 `frontend/config_files/.env.example`입니다. 배포할 때 이 파일을 `.env.production`으로 복사한 뒤 값을 채우고, 로컬 Next.js 개발에서는 같은 애플리케이션 키를 `frontend/.env.local`에 둡니다.

| 키                  | 사용처                 | 설명                                                                          |
| ------------------- | ---------------------- | ----------------------------------------------------------------------------- |
| `POSTGRES_USER`     | PostgreSQL 컨테이너    | 초기 데이터베이스 사용자                                                      |
| `POSTGRES_PASSWORD` | PostgreSQL 컨테이너    | 초기 데이터베이스 비밀번호                                                    |
| `POSTGRES_DB`       | PostgreSQL 컨테이너    | 초기 데이터베이스 이름                                                        |
| `DATABASE_URL`      | Next.js, 이관 스크립트 | PostgreSQL 연결 문자열                                                        |
| `SERVICE_KEY`       | 나라장터 API 모듈      | `serviceKey=...` 전체 쿼리 조각. 이미 인코딩된 키를 다시 인코딩하지 않습니다. |
| `TOKEN_SECRET_KEY`  | 인증 Server Action     | 기존 JWT 서명 키                                                              |

화면 상태는 환경 변수가 아니라 Server Action 반환값으로 표현합니다. 따라서 `STATUS_*`, `FRONT_URL`, `BACK_URL` 같은 키는 필요하지 않습니다.

## 로컬 실행

```sh
cd frontend
npm install
npm run dev
```

개발용 PostgreSQL 예시는 다음과 같습니다.

```sh
docker run -d --name naraapi-dev-db -p 5432:5432 \
  -e POSTGRES_USER=naraapi -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=naraapi \
  -v naraapi-dev-db:/var/lib/postgresql/data \
  -v "$PWD/../postgres/init:/docker-entrypoint-initdb.d:ro" postgres:17-alpine
```

`frontend/.env.local`에는 최소한 `DATABASE_URL`, `SERVICE_KEY`, `TOKEN_SECRET_KEY`가 필요합니다.

## Docker Compose 배포

```sh
cp frontend/config_files/.env.example frontend/config_files/.env.production
# .env.production의 값을 채운 뒤
docker compose up -d --build
```

`postgres` 서비스는 호스트에 포트를 공개하지 않고 Compose 네트워크 안에서만 접근합니다. 데이터는 `postgres-data` named volume에 유지되며, `postgres/init/01-schema.sql`은 빈 볼륨의 최초 기동 때만 실행됩니다.

**기존 운영 DB가 있다면 v4.0 배포 전에 마이그레이션을 반드시 적용해야 합니다.** init 스크립트는 데이터가 있는 볼륨에서 실행되지 않으므로, 적용하지 않으면 앱이 기동 후 첫 쿼리에서 깨집니다. 백업을 먼저 뜬 뒤 적용하세요.

```
docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -v ON_ERROR_STOP=1 < postgres/migrations/v3.2-to-v4.0.sql
```

`postgres/migrations/v3.2-to-v4.0.sql`은 한 트랜잭션으로 `e_mail` → `email` 이름 변경, `user_tasks`의 `notice_id`·`notice_url` 추가와 중복 저장 방지 제약, 쓰지 않는 `archives` 테이블 제거를 수행합니다. 재실행해도 안전합니다.

## DB 스키마

Drizzle의 JavaScript 프로퍼티는 camelCase이고 실제 PostgreSQL 컬럼은 snake_case입니다. `frontend/lib/db/schema.js`와 `postgres/init/01-schema.sql`을 항상 함께 변경해야 합니다.

| 테이블       | 컬럼                                                                                                               | 제약과 용도                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `users`      | `user_id` text, `user_pw` text, `email` text                                                                       | `user_id` PK, `user_pw` NOT NULL                                                        |
| `user_tasks` | `content_number` integer, `user_id` text, `task_type` text, `task_title` text, `notice_id` text, `notice_url` text | identity PK, 사용자 FK/CASCADE, `(user_id, task_type, notice_id)` UNIQUE, 사용자 인덱스 |

과거 Mongo 문서에는 공고 식별자와 링크가 없으므로 `notice_id`와 `notice_url`은 이관 호환성을 위해 nullable입니다. 신규 저장은 `noticeId`가 없으면 거부합니다. Mongo JSON 이관은 다음 명령을 사용하며, `e_mail`은 가져오기 입력에서만 호환 필드로 읽어 새 `email` 컬럼에 저장합니다.

```sh
cd frontend
DATABASE_URL=postgres://naraapi:<password>@127.0.0.1:5432/naraapi \
  node scripts/import-from-mongo.mjs ../userlists.json ../usertasklists.json
```

## 품질 확인

```sh
cd frontend
npx eslint .
npx prettier --check .
npm run build
```

## 버전 정보

- version 1.0: AWS EC2 배포와 기본 공고 검색 기능
- version 2.0~2.2: JWT 로그인, 공고 저장, 다기관 오늘 공고, HTTPS와 Docker 배포
- version 3.0~3.2: Next.js 16 App Router/React 19 전환, UI 개편, 나라장터 API 모듈 통합, PostgreSQL 17/Drizzle 이전
- version 4.0 (2026-08): 데이터 스키마 일치와 저장 공고 식별자 추가, Route Handler 제거 및 Server Action 전환, 공통 인증 가드, 나라장터 응답 정규화, React 19 폼과 인라인 피드백, 검색·오늘 공고·저장 공고의 레거시 버그 수정, 전체 lint/format/build 검증

## 추후 개선 필요

- 평문 비밀번호를 안전한 단방향 해시로 이전
- JWT 서명 검증 및 `httpOnly`, `secure`, `sameSite` 쿠키 정책 도입
- 운영 데이터베이스 자동 백업 절차 마련 (버전 마이그레이션은 `postgres/migrations/`에 추가했습니다)
- 실제 DB와 `SERVICE_KEY`가 있는 환경에서 회원·검색·저장 흐름의 E2E 테스트 자동화
- 나라장터 호출량과 검색 지연을 관찰한 뒤 캐시 및 재시도 정책 설계
