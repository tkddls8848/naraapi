# 나라장터 공고 검색 서비스 (NARA-P)

나라장터의 사전규격·본공고를 수요기관과 기간으로 조회하고, 로그인한 사용자가 관심 공고를 저장할 수 있는 웹 애플리케이션입니다. 별도 REST API는 두지 않으며, Next.js Server Component와 Server Action으로 데이터를 처리합니다.

- 서비스: <https://www.naraapi.com>
- 프런트엔드: Next.js 16 App Router, React 19, Tailwind CSS 4
- 데이터베이스: PostgreSQL 17, Drizzle ORM
- 공공 데이터: [나라장터 입찰공고정보서비스](https://www.data.go.kr/index.do)
- 배포: Docker Compose, Next.js standalone 이미지

## 주요 기능

- 수요기관 및 기간별 사전규격·본공고 조회
- 선택한 여러 수요기관의 전일~당일 공고 모아보기
- 수요기관명 및 기관 코드 검색
- 회원 가입, 로그인, 회원정보 수정 및 탈퇴
- 관심 공고 저장 및 삭제

## 페이지

| 경로 | 설명 | 로그인 |
| --- | --- | --- |
| `/` | 로그인 및 서비스 진입 | 선택 |
| `/userlogin/join` | 회원 가입 | 아니요 |
| `/userlogin/modify` | 회원정보 수정 | 예 |
| `/userlogin/delete` | 회원 탈퇴 | 예 |
| `/task` | 기관·기간별 공고 검색 | 예 |
| `/task/sajeon/[departname]` | 기관별 사전규격 검색 결과 | 예 |
| `/task/bone/[departname]` | 기관별 본공고 검색 결과 | 예 |
| `/todaytask` | 오늘 공고를 조회할 기관 선택 | 예 |
| `/todaytask/show` | 선택 기관의 전일~당일 공고 | 예 |
| `/usertask` | 저장한 공고 조회 및 삭제 | 예 |
| `/list?query=기관명` | 수요기관명·기관 코드 검색 | 아니요 |

## 데이터 처리 구조

`frontend/app/api` Route Handler는 사용하지 않습니다. 페이지의 서버 컴포넌트가 `frontend/lib/nara-api.js`를 통해 나라장터 API를 호출하고, 계정 및 저장 공고 변경은 Server Action에서 PostgreSQL에 반영합니다.

나라장터 응답은 화면에서 다음 형태로 정규화합니다.

```js
{
  id, title, departName, registeredAt, closesAt,
  fileUrl, kind, isNew, raw
}
```

- `kind`: `sajeon`(사전규격) 또는 `bone`(본공고)
- `isNew`: 전일~당일 조회 결과인지 여부
- 세 종류(공사·용역·물품)의 나라장터 엔드포인트를 모두 조회합니다. 일부 요청이 실패해도 성공한 결과는 표시합니다.
- 공고 저장은 `(user_id, task_type, notice_id)` 조합으로 중복을 막습니다.

## 환경 변수

배포용 예시는 `frontend/config_files/.env.example`입니다. 이를 `frontend/config_files/.env.production`으로 복사해 값을 채우세요. 로컬 Next.js 개발에서는 `frontend/.env.local`을 사용합니다.

| 변수 | 사용처 | 설명 |
| --- | --- | --- |
| `POSTGRES_USER` | PostgreSQL 컨테이너 | 초기 DB 사용자 |
| `POSTGRES_PASSWORD` | PostgreSQL 컨테이너 | 초기 DB 비밀번호 |
| `POSTGRES_DB` | PostgreSQL 컨테이너 | 초기 DB 이름 |
| `DATABASE_URL` | Next.js, 데이터 이전 스크립트 | PostgreSQL 연결 문자열 |
| `SERVICE_KEY` | 나라장터 API 모듈 | `serviceKey=...` 전체 쿼리 조각. 이미 URL 인코딩된 값은 다시 인코딩하지 않습니다. |
| `TOKEN_SECRET_KEY` | 인증 Server Action | 로그인 JWT 서명 키 |

Compose 환경에서 `DATABASE_URL`의 호스트는 `postgres`를 사용합니다.

```dotenv
DATABASE_URL=postgres://naraapi:<password>@postgres:5432/naraapi
```

비밀번호에 `@` 등 URL 예약 문자가 있으면 URL 인코딩해야 합니다. `.env.production`, `.env.local`, 실제 서비스 키는 커밋하지 마세요.

## 로컬 실행

Node.js 22와 Docker가 필요합니다.

```sh
docker run -d --name naraapi-dev-db -p 5432:5432 \
  -e POSTGRES_USER=naraapi -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=naraapi \
  -v naraapi-dev-db:/var/lib/postgresql/data \
  -v "$PWD/../postgres/init:/docker-entrypoint-initdb.d:ro" postgres:17-alpine
```

`frontend/.env.local`을 만들고 최소한 아래 값을 설정합니다.

```dotenv
DATABASE_URL=postgres://naraapi:dev@127.0.0.1:5432/naraapi
SERVICE_KEY=serviceKey=...
TOKEN_SECRET_KEY=development-only-secret
```

그다음 프런트엔드를 실행합니다.

```sh
cd frontend
npm ci
npm run dev
```

<http://localhost:3000>에서 확인할 수 있습니다.

## Docker Compose 배포

```sh
cp frontend/config_files/.env.example frontend/config_files/.env.production
# .env.production의 값을 채운 뒤
docker compose up -d --build
```

- 애플리케이션은 `3000` 포트로 노출됩니다.
- PostgreSQL은 호스트 포트를 열지 않으며 Compose 네트워크 안에서만 `postgres:5432`로 접근합니다.
- 데이터는 `postgres-data` named volume에 보존됩니다.
- `postgres/init/01-schema.sql`은 비어 있는 볼륨으로 PostgreSQL을 처음 시작할 때만 실행됩니다.
- TLS는 컨테이너 밖의 리버스 프록시 또는 로드밸런서에서 종료해야 합니다.

## 기존 v3.2 DB 마이그레이션

기존 데이터베이스에는 초기화 SQL이 재실행되지 않습니다. 배포 전 DB를 백업하고, v3.2에서 v4.0으로 올릴 때 아래 마이그레이션을 한 번 적용하세요.

```sh
docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -v ON_ERROR_STOP=1 < postgres/migrations/v3.2-to-v4.0.sql
```

마이그레이션은 다음을 처리합니다.

- `users.e_mail`을 `email`로 이름 변경
- `user_tasks.notice_id`, `notice_url` 추가 및 중복 저장 방지 제약 추가
- 더 이상 쓰지 않는 `archives` 테이블 삭제

## MongoDB 데이터 이전

기존 MongoDB의 `userlists`, `usertasklists` JSON 배열을 PostgreSQL로 옮길 수 있습니다. 대상 DB를 백업한 뒤 실행하세요.

```sh
cd frontend
DATABASE_URL=postgres://naraapi:<password>@127.0.0.1:5432/naraapi \
  node scripts/import-from-mongo.mjs ../userlists.json ../usertasklists.json
```

스크립트는 트랜잭션으로 실행되며, 중복 사용자·공고는 건너뜁니다. 기존 문서에 없던 `notice_id`와 `notice_url`은 `NULL`로 이전될 수 있습니다.

## DB 스키마

Drizzle 스키마(`frontend/lib/db/schema.js`)와 초기화 SQL(`postgres/init/01-schema.sql`)은 항상 함께 수정해야 합니다. JavaScript 속성은 camelCase, PostgreSQL 열은 snake_case를 사용합니다.

| 테이블 | 주요 열 | 제약 |
| --- | --- | --- |
| `users` | `user_id`, `user_pw`, `email` | `user_id` 기본 키 |
| `user_tasks` | `content_number`, `user_id`, `task_type`, `task_title`, `notice_id`, `notice_url` | 사용자 FK(CASCADE), `(user_id, task_type, notice_id)` 유일 제약 |

## 검증 명령

```sh
cd frontend
npm run lint
npx prettier --check .
npm run build
```

## 보안 관련 참고

현재 구현은 기존 동작 호환성을 위해 비밀번호를 평문으로 저장·비교하고, JWT는 서명 시점에만 사용하며 검증하지 않습니다. 쿠키에도 `httpOnly`, `secure`, `sameSite` 옵션이 설정되어 있지 않습니다. 인터넷에 공개 배포하기 전에 비밀번호 해싱, JWT 검증, 안전한 쿠키 속성, 세션 만료 정책을 반드시 적용해야 합니다.

## 변경 이력

- v4.0 (2026-08): PostgreSQL/Drizzle 스키마 정리, 공고 식별자 기반 저장, Route Handler 제거 및 Server Action 전환, 나라장터 응답 정규화와 공고 조회 안정성 개선
- v3.0~3.2: Next.js App Router·React 19 전환, UI 개편, 나라장터 API 모듈 통합, PostgreSQL 17/Drizzle 이전
- v2.0~2.2: JWT 로그인, 공고 저장, 기관별 오늘 공고, HTTPS 및 Docker 배포
- v1.0: 기본 공고 검색 및 AWS EC2 배포
