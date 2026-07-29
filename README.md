# 나라장터 API기반 사업 검색 사이트 NARA-P

>나라장터 사전공고 및 본공고 검색사이트입니다.
>Next.js App Router 단일 애플리케이션으로 프론트엔드와 API를 함께 서비스합니다.

- 1차 작업기간 : 22.01.04 ~ 22.01.10 (기능 구현 진행)
- 2차 작업기간 : 22.02.05 ~ 22.02.28 (상세 기능 및 배포 환경 설정)
- 3차 작업기간 : 26.07 (Next.js 16 App Router 전면 리팩토링)

**[서비스 사이트 링크](https://www.naraapi.com)**

**기술스택**
  - Front-End : Next.js 16 (App Router) + React 19 + Tailwind CSS 4
  - Back-End : Next.js Route Handlers (`app/api/v1/**`) — 별도 Express 서버 없음
  - Data API : [나라장터 공개 API 활용](https://www.data.go.kr/index.do)
  - Database : PostgreSQL 17 + Drizzle ORM — 클라우드가 아니라 docker-compose 의
    `postgres` 서비스로 자체 호스팅한다. 데이터는 named volume `postgres-data` 에 남는다.
  - DevOps : AWS, docker / docker-compose. **HTTPS 는 앞단 프로바이더가 종단한다**
    (앱은 3000 포트로 평문 http 만 듣는다)

**URL**
  - `/` : 로그인 창
  - `/userlogin/join` : 회원가입
  - `/userlogin/modify` : 회원정보 수정
  - `/userlogin/delete` : 회원탈퇴
  - `/task` : 검색 홈
  - `/task/sajeon/[departname]` : 기관별 사전공고 검색 결과
  - `/task/bone/[departname]` : 기관별 본공고 검색 결과
  - `/todaytask` : 여러 기관 선택 화면
  - `/todaytask/show` : 선택한 기관들의 오늘 공고
  - `/usertask` : 로그인 유저의 공고 저장 기록 확인
  - `/list/[pageNum]` : 수요기관 목록

**API** (모두 `/api/v1` 하위, 기존 Express 라우트와 경로·응답 형태 동일)
  - `GET|POST /api/v1/task/sajeon`, `/api/v1/task/sajeon/[departname]`
  - `GET|POST /api/v1/task/bone`, `/api/v1/task/bone/[departname]`
  - `POST /api/v1/usertask`, `GET|DELETE /api/v1/usertask/[userId]`
  - `POST|PATCH /api/v1/login`, `POST /api/v1/login/signin`, `GET|DELETE /api/v1/login/[userId]`
  - `GET /api/v1/logic`, `GET /api/v1/list`

**실행 방법**

로컬 개발:
```
cd frontend
npm install
npm run dev
```
로컬에서는 `frontend/.env.local` 에 환경변수를 넣으면 Next 가 자동으로 읽는다.
개발용 DB 는 컨테이너 하나만 띄우면 된다 (개발 전용).
```
docker run -d --name naraapi-dev-db -p 5432:5432 \
  -e POSTGRES_USER=naraapi -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=naraapi \
  -v naraapi-dev-db:/var/lib/postgresql/data \
  -v "$PWD/../postgres/init:/docker-entrypoint-initdb.d:ro" postgres:17-alpine

# frontend/.env.local
# DATABASE_URL=postgres://naraapi:dev@127.0.0.1:5432/naraapi
```

배포:
```
# 배포 전에 반드시 환경변수 파일을 만들어야 한다 (실제 값은 커밋 대상이 아니다)
cp frontend/config_files/.env.example frontend/config_files/.env.production
# 값을 채운 뒤
docker-compose up -d --build
```
`docker-compose.yml` 의 `naraapi` 와 `postgres` 서비스가 `env_file` 로 같은 `.env.production` 을
읽는다. 필요한 키 목록과 주의사항(특히 `SERVICE_KEY` 는 `key=value` 형태 문자열 통째로 넣어야
한다)은 `frontend/config_files/.env.example` 의 주석 참고.

HTTPS 는 앱 앞단의 프로바이더(로드밸런서 등)가 종단한다. 앱 컨테이너는 3000 포트로 평문 http
만 듣고, 이 포트가 서비스 진입점이다. 프로바이더에서 TLS 를 켜고 3000 으로 프록시하면 된다.

**DB 스키마**

| 테이블 | 컬럼 | 비고 |
|---|---|---|
| `users` | `user_id`(PK), `user_pw`, `e_mail` | 로그인 아이디가 자연키 |
| `user_tasks` | `content_number`(PK, identity), `user_id`(FK→users, CASCADE), `task_type`, `task_title` | `user_id` 에 인덱스 |
| `archives` | `id`(PK, identity), `depart_name`, `task_type`, `date`, `task_data`(jsonb) | 아카이빙용, 아직 쓰는 코드 없음 |

DDL 은 `postgres/init/01-schema.sql`, 쿼리용 선언은 `frontend/lib/db/schema.js` 다. **둘은 짝이라
한쪽만 고치면 기동 후 첫 쿼리에서 깨진다.** 스키마를 바꿀 때는 두 파일을 함께 고치고, 이미
데이터가 있는 DB 에는 `ALTER` 문을 직접 적용해야 한다(init 스크립트는 최초 기동에만 실행된다).

**DB 운영 (자체 호스팅)**

`postgres` 서비스는 호스트로 포트를 열지 않는다. 같은 compose 네트워크의 앱만 `postgres:5432` 로
접근하고, 사람이 붙을 때는 컨테이너 안에서 접속한다.
```
docker compose exec postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
```

*최초 기동 확인* — 테이블은 `postgres/init/01-schema.sql` 이 **볼륨이 빈 최초 기동에서만** 만든다.
첫 배포 후 아래로 확인한다.
```
docker compose exec postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c '\dt'   # 3개 테이블
docker compose exec postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c '\di'   # 인덱스
docker compose logs naraapi | grep -i -E "database|error"                          # 연결 오류 없어야 함
```

*이미 데이터가 있는 볼륨에 테이블만 없을 때* — init 스크립트가 실행되지 않으므로 직접 적용한다.
```
docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < postgres/init/01-schema.sql
```

*백업* — 클라우드를 벗어나면 자동 백업도 없어진다. 볼륨만 믿지 말고 주기적으로 덤프를 뜬다.
```
# 호스트의 ./backup 으로 덤프 (backup/ 은 .gitignore 처리돼 있다)
mkdir -p backup
docker compose exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc \
  > "backup/naraapi-$(date +%Y%m%d).dump"
```
`crontab -e` 에 하루 한 번 등록하고, 덤프 파일은 호스트 밖(S3 등)으로 복사해 두는 것이 좋다.

*복구*
```
docker compose exec -T postgres pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  --clean --if-exists < backup/naraapi-20260729.dump
```

**MongoDB 에서 이전하기** (기존 배포가 있는 경우 1회)

기존 Mongo 배포에서 두 컬렉션을 내보낸 뒤 스크립트로 넣는다. Mongo 드라이버를 쓰지 않으므로
Mongo 컨테이너를 이미 내린 뒤에도 파일만 있으면 이전할 수 있다.
```
# 1) 기존 배포에서 내보내기 (구 docker-compose 의 mongo 컨테이너에서)
docker compose exec -T mongo mongoexport -u <root> -p <pw> --authenticationDatabase admin \
  --db naraapi --collection userlists --jsonArray > userlists.json
docker compose exec -T mongo mongoexport -u <root> -p <pw> --authenticationDatabase admin \
  --db naraapi --collection usertasklists --jsonArray > usertasklists.json

# 2) 새 postgres 가 뜬 상태에서 넣기
cd frontend
DATABASE_URL=postgres://naraapi:<pw>@127.0.0.1:5432/naraapi \
  node scripts/import-from-mongo.mjs ../userlists.json ../usertasklists.json
```
스크립트는 한 트랜잭션으로 처리하고, 두 번 돌려도 안전하다. `content_number` 는 기존 값을
그대로 보존하고 identity 시퀀스를 그 뒤로 옮긴다. 넘어갈 수 없는 데이터는 조용히 버리지 않고
보고한다 — **탈퇴한 유저의 공고(주인 없는 행)는 외래키 때문에 넣을 수 없어 목록으로 출력되니**
로그를 확인해라.

**버전정보**
* version 1.0
  - 사이트 AWS EC2 인스턴스 배포 완료 & 서비스 개시
  - 사이트 기능 구현
  - Google Search Console 등록

* version 2.0
  - 로그인 기능 구현 (JWT를 이용한 로그인 상태 유지)
  - 공고 저장 기능 추가
  - https 적용
  - docker컨테이너 기반 배포
  - 도메인 네임 적용(www.naraapi.com)

* version 2.1
  - 검색일 기준 여러 부서 공고 현황 검색 기능 구현

* version 2.2
  - AWS 실행 환경 개선 및 docker 구현

* version 3.0
  - Next.js 16 App Router 전환 (Pages Router · `getServerSideProps` 제거)
  - React 19 / Tailwind CSS 3 로 업그레이드 (Tailwind 는 이후 3.1 에서 v4 로 올렸다)
  - Express 커스텀 서버(`httpserver.js`, `httpsserver.js`, `customserver/`) 제거,
    모든 API를 Next Route Handlers 로 이전 (URL·응답 형태는 그대로)
  - 나라장터 API 호출 로직을 `lib/nara-api.js` 하나로 통합.
    `Promise.allSettled` 로 조달청 일부 요청 거절 시에도 부분 결과를 반환
  - 본공고 POST 조회에서 누락돼 있던 물품(Thng) 공고 추가, 건설(Cnstwk) 중복 제거
  - `axios` → `fetch`, `moment` → `date-fns`, heroicons v2 로 정리.
    `express`/`cookie-parser`/`cors`/`dotenv`/`mongodb`/`typescript` 등 미사용 의존성 제거
  - ESLint 9 flat config + Prettier 도입, 파일명 kebab-case 통일
  - 미완성 마이그레이션 잔재(`frontend_13/`)와 레거시 `pages/` 트리 삭제
  - 도커 이미지를 multi-stage + `output: 'standalone'` 로 재작성 (Node 22 LTS),
    프로덕션에서 dev 서버가 뜨던 문제 수정. 시크릿은 이미지에 굽지 않고 `env_file` 로 주입

* version 3.1
  - Tailwind CSS 4 로 업그레이드 (`tailwind.config.js` 제거 → `app/globals.css` 안에서
    `@theme` 로 토큰 선언, PostCSS 플러그인은 `@tailwindcss/postcss` 하나, autoprefixer 제거)
  - 화면 전면 리디자인: 디자인 토큰 기반 색/타이포, 라이트·다크 모드 자동 대응,
    모바일 우선 반응형(공고 카드 1→2→3→4열), 고정 헤더와 현재 메뉴 표시
  - 화면마다 복사돼 있던 버튼·입력 클래스 문자열을 `globals.css` 의 `@utility` 로 통합
    (`.btn-primary`, `.input`, `.card`, `.badge-*` 등)
  - 공고 카드를 라벨/값 정의 목록으로 재구성, `최신여부: true` 문자열을 `NEW` 배지로 대체
  - 라디오 버튼을 세그먼트 컨트롤로, 기관 목록을 칩(chip) 목록으로 변경
  - `react-datepicker` 팝업을 앱 테마에 맞춰 재스타일 (다크 모드 포함)
  - 로그인·회원가입·정보수정 폼을 `<form>` 으로 감싸 엔터 제출 지원,
    비밀번호 입력에 `type="password"` 적용

* version 3.2
  - **DB 를 MongoDB → PostgreSQL 17 로 이전** (Mongoose → Drizzle ORM).
    MERN 유행에 따라 고른 Mongo 였는데 데이터가 관계형이라 억지스러운 부분을 정리했다.
    - `mongoose-sequence` 가 카운터 컬렉션으로 흉내내던 `content_number` → identity 컬럼
    - 회원탈퇴 시 앱이 두 번 삭제하던 정리 → 외래키 `ON DELETE CASCADE`
      (트랜잭션 없이 두 번 호출해 중간에 죽으면 주인 없는 공고가 남던 문제 해소)
    - 가입 시 `findOne` 후 `insert` 경합 → PK 충돌을 DB 가 판정 (`ON CONFLICT DO NOTHING`)
    - 인덱스가 앱 코드 선언에 의존하던 구조 → 테이블 정의(DDL)의 일부
  - 데이터 이전 스크립트 추가 (`frontend/scripts/import-from-mongo.mjs`)
  - 참조가 0건이던 모델 정리 (`naraData`, `archivelists`)
  - **nginx / certbot 제거** — EC2 에서 HTTPS 를 직접 종단하려고 두었던 것이라
    프로바이더가 TLS 를 지원하면 불필요하다. `init-letsencrypt.sh` 와 nginx 컨테이너,
    certbot 컨테이너를 모두 제거하고, 앱 컨테이너의 3000 포트를 진입점으로 삼는다.
  - API 응답 형태는 그대로다 (`state` 문자열, 저장 공고 튜플 순서 포함)

**추후 개선 필요**
  - 비밀번호 암호화 (현재 평문 저장·비교 — 사용자 결정으로 이번 리팩토링 범위에서 제외)
  - JWT 검증 (현재 쿠키 존재 여부만 확인 — 동일 사유로 범위 밖)
  - 한글로그인 방지
  - 공고 검색 속도 개선(데이터 아카이빙)
  - 기관명 입력 시 기관 목록 표시 기능
  - PM2 등 프로세스 관리 (현재는 docker `restart: on-failure` 에 의존)
  - `/todaytask/show` 에서 사전공고가 0건이면 본공고가 있어도 "데이터 없음"으로 표시된다
    (레거시 동작 그대로 보존 — `app/todaytask/show/page.js` 의 `FIXME` 참고)
  - `/todaytask` 에서 사용자가 추가한 기관이 항상 본공고(`'b'`)로 태깅된다
    (레거시에 라디오 마크업이 없어 그대로 보존 — `app/components/today/today-search-bar.js` 의 `FIXME` 참고)
  - `GET /api/v1/list` 가 쿼리 파라미터를 무시하고 특정 기관명으로만 조회한다
    (원작자 의도 불명 — `lib/nara-api.js` 의 `FIXME` 참고)
  - `/list/[pageNum]` 의 `pageNum` 세그먼트가 실제로 사용되지 않는다

  **추후 하고 싶은 것**
  - 앱 지원
