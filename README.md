# NARA-P

나라장터 사전규격·본공고를 기관과 기간으로 조회하고, 로그인한 사용자가 관심 공고를 저장하는 개인용 웹 서비스입니다.

- 서비스: <https://www.naraapi.com>
- 웹: Next.js 16 App Router, React 19, Tailwind CSS 4
- 데이터베이스: PostgreSQL 17, Drizzle ORM
- 공고 데이터: [나라장터 입찰공고정보서비스](https://www.data.go.kr/index.do)

## 기능

- 기관·기간별 사전규격 및 본공고 조회
- 여러 기관의 전일~당일 공고 모아보기
- 나라장터 수요기관명과 기관 코드 검색
- 회원가입, 로그인, 정보 수정, 탈퇴
- 관심 공고 저장 및 삭제

공고 데이터는 `frontend/lib/nara-api.js`에서 다음 형태로 정규화합니다.

```js
{ id, title, departName, registeredAt, closesAt, fileUrl, kind }
```

## 프로젝트 구조

```text
frontend/
  app/                  Next.js 페이지, 컴포넌트, Server Action
  lib/                  인증, DB, 나라장터 API
  config_files/         배포 환경변수 예시
postgres/init/          신규 DB 초기 스키마
docker-compose.yml      PostgreSQL과 웹 앱 실행
```

## 환경변수

로컬 개발은 `frontend/.env.local`, Compose 배포는 `frontend/config_files/.env.production`을 사용합니다. 배포 파일은 `.env.example`을 복사해 작성합니다.

```dotenv
POSTGRES_USER=naraapi
POSTGRES_PASSWORD=<password>
POSTGRES_DB=naraapi
DATABASE_URL=postgres://naraapi:<password>@postgres:5432/naraapi
SERVICE_KEY=serviceKey=<공공데이터포털 서비스 키>
TOKEN_SECRET_KEY=<충분히 긴 임의 문자열>
```

`SERVICE_KEY`는 `serviceKey=...` 전체 쿼리 조각이며, 공공데이터포털이 발급한 인코딩 값을 그대로 사용합니다. DB 비밀번호의 URL 예약 문자는 URL 인코딩해야 합니다.

## 로컬 실행

Node.js 22와 실행 중인 PostgreSQL이 필요합니다.

```sh
cd frontend
npm ci
npm run dev
```

PostgreSQL에는 `postgres/init/01-schema.sql`을 적용하고, 로컬 `DATABASE_URL`의 호스트는 `127.0.0.1`로 설정합니다.

## Compose 배포

```sh
cp frontend/config_files/.env.example frontend/config_files/.env.production
# 값을 채운 후
docker compose up -d --build
```

웹은 3000 포트로 노출됩니다. PostgreSQL 데이터는 `postgres-data` 볼륨에 저장되며 초기 스키마는 빈 볼륨의 첫 실행에만 생성됩니다.

## 검증

```sh
cd frontend
npm run lint
npx prettier --check .
npm run build
```

현재 개인 개발 범위에서는 비밀번호를 평문으로 저장합니다. 공개 사용자 대상 서비스로 확장하기 전에는 비밀번호 해싱을 적용해야 합니다.
