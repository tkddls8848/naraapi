# NARA-P 전면 리팩토링 결과 보고서

- **작업일**: 2026-07-28 ~ 2026-07-29
- **대상 커밋**: `1f340c5` (리팩토링 전) → `24a44e6` (리팩토링 후)
- **변경 규모**: 162개 파일, +7,691 / −31,530
- **작업 방식**: Orca 오케스트레이션 기반 5단계 다중 에이전트 분업

3년 전 Next.js 12 Pages Router로 작성된 코드를 Next.js 16 App Router 기반으로 전면
재작성했다. **기존 API의 URL과 응답 JSON 형태는 100% 보존**해 동작 호환성을 유지했다.

---

## 1. 착수 시점의 문제 상황

| 항목 | 상태 |
|---|---|
| 프레임워크 | Next 12.3.4 / React 17 (약 3년 경과) |
| 코드 트리 | `frontend/`(운영 중)와 `frontend_13/`(미완성 app router 마이그레이션)가 **중복 존재** |
| 서버 구조 | Express 커스텀 서버가 Next를 감싸고 API는 `/api/v1/*` Express 라우터 |
| 모듈 시스템 | 서버는 CommonJS, 프론트는 ESM 혼용 |
| 파일명 규칙 | camelCase / 오타(`taskSageon.js`) / `layout copy.tsx`, `.gitignore copy` 등 잔재 |
| 린트·포맷 | ESLint 설정만 존재하고 사실상 미적용, Prettier 없음 |
| 의존성 | `axios@0.24`, `moment`, `mongodb`+`mongoose` 중복, `typescript`(미사용) 등 |
| lockfile | `yarn.lock`과 `package-lock.json` **동시 존재** |

---

## 2. 사용자 확정 결정사항

작업 착수 전 4가지를 확인받고 그대로 이행했다.

1. **단일 앱 통합** — `frontend/`를 Next 16 App Router로 마이그레이션, `frontend_13/` 삭제
2. **Express 커스텀 서버 제거** — 모든 API를 Next Route Handlers로 이전
3. **보안은 손대지 않음** — 평문 비밀번호, JWT 미검증 로직을 **동작 그대로 보존**
4. **JavaScript 유지** — TypeScript로 전환하지 않고 컨벤션만 통일

> 3번에 대해: 평문 비밀번호 저장·비교는 실제 취약점이다. 사용자 결정에 따라 이번 범위에서
> 제외했으며 해당 코드마다 `// NOTE:` 주석과 README 개선 항목으로 남겼다.

---

## 3. 확정 버전

| 패키지 | 버전 | 비고 |
|---|---|---|
| next | 16.2.12 | |
| react / react-dom | 19.2.8 | |
| tailwindcss | **3.4.19** | v4 미채택 — 4장 판단 2번 참조 |
| mongoose | 8.24.2 | |
| date-fns | 4.4.0 | `moment` 대체 |
| @heroicons/react | 2.2.0 | v1 → v2 경로 변경 |
| jsonwebtoken | 9.0.3 | |
| eslint / prettier | 9.39.5 / 3.9.6 | flat config |
| Node (도커) | 22-alpine | 기존 19(EOL) → 현행 LTS |

**제거한 의존성**: `axios`, `moment`, `express`, `cookie-parser`, `cors`, `dotenv`,
`dotenv-webpack`, `ssl-root-cas`, `urlencode`, `react-cookies`, `mongodb`, `typescript`,
`@types/*`, `nprogress`

---

## 4. 변경 내용

### 4.1 구조

- `frontend/`를 Next 16 App Router 단일 앱으로 통합, `frontend_13/` 삭제
- 레거시 `pages/` 트리 삭제 (25개 파일 1:1 이관 확인 후)
- 파일·디렉터리명 **kebab-case** 통일, 오타 `taskSageon.js` → `task-sajeon.js` 교정
- 경로 alias `@/*` → `frontend/` 도입
- ESLint 9 flat config + Prettier로 컨벤션을 **기계적으로 강제**
  (`no-implicit-globals`, `eqeqeq`, `no-var`, `prefer-const`, 세미콜론 없음, 싱글쿼트)
- `yarn.lock` 삭제로 lockfile 단일화

### 4.2 백엔드 — Express 라우터 5개 → Route Handler 11개

`httpserver.js`, `httpsserver.js`, `customserver/` 삭제. URL과 응답 형태는 그대로 유지.

| HTTP | URL |
|---|---|
| GET / POST | `/api/v1/task/sajeon/[departname]` · `/api/v1/task/sajeon` |
| GET / POST | `/api/v1/task/bone/[departname]` · `/api/v1/task/bone` |
| POST | `/api/v1/usertask` |
| GET / DELETE | `/api/v1/usertask/[userId]` |
| POST / PATCH | `/api/v1/login` |
| POST | `/api/v1/login/signin` |
| GET / DELETE | `/api/v1/login/[userId]` |
| GET | `/api/v1/logic` · `/api/v1/list` |

- 4곳에 복붙돼 있던 나라장터 API 호출 로직을 **`lib/nara-api.js` 하나로 통합**
- `axios` → 표준 `fetch`, 문자열 `+` 조립 → `URLSearchParams`
- Mongoose 모델 5개를 ESM + 핫리로드 안전 패턴(`mongoose.models.X ?? mongoose.model(...)`)으로 이전
- `lib/mongoose.js`에 `globalThis` 캐싱 커넥션 유틸 추가 (중복 커넥션 방지)

### 4.3 프론트엔드

- `getServerSideProps` 전량 제거 → 서버 컴포넌트 + `await cookies()`
- `next/router` → `next/navigation`, 훅 사용 컴포넌트에만 `'use client'`
- `process.env.BACK_URL` / `FRONT_URL` 제거 → **같은 오리진 상대경로**
  (API가 같은 앱으로 들어와 절대 주소가 불필요해졌고, 클라이언트 env 주입 문제도 소멸)
- `_app.js`의 `router.events` 기반 NProgress는 App Router에 존재하지 않아
  `app/loading.js` 기반 전역 로딩 UI로 대체
- 반복되던 긴 Tailwind 버튼 클래스와 공고 카드 마크업을 컴포넌트로 공용화

### 4.4 배포

- **Dockerfile 재작성**: multi-stage + `output: 'standalone'`, Node 22 LTS,
  non-root 유저 실행, `node server.js` 기동
- **시크릿을 이미지에 굽지 않음**: `COPY ./config_files` 제거 →
  docker-compose `env_file` 주입 + `.env.example` 템플릿 추가
- **nginx**: `proxy_pass https://www.naraapi.com:3000`(공용 도메인으로 자기 자신에게 HTTPS 프록시)
  → `http://naraapi:3000` + `X-Forwarded-For/Proto/Host` 헤더 추가.
  80→443 리다이렉트와 `/.well-known/acme-challenge/` 블록은 보존
- docker-compose: obsolete `version` 키 제거, `naraapi`의 불필요한 certbot 볼륨 마운트 제거

---

## 5. 수정한 실제 버그

리팩토링 과정에서 발견한 것들이다. 단순 정리가 아니라 동작이 잘못돼 있던 지점이다.

| # | 내용 | 영향 |
|---|---|---|
| 1 | `POST /task/bone`의 URL 배열에 `Cnstwk`가 **두 번**, `Thng`이 **누락** | 오늘의 공고에서 **물품 공고가 아예 조회되지 않음** |
| 2 | `taskSearchBar`에서 `const message = ''` 뒤 `message += ...` | `TypeError`로 **입력 검증 경로 전체가 동작 불가** |
| 3 | `archiveListModel`의 `mongoose.Model`(대문자 M) 오타 | 모델이 생성되지 않음 (참조 코드가 없어 드러나지 않았음) |
| 4 | `userlogin/modify`·`delete`에 쿠키 가드 없음 → `jwt.decode(undefined).userId` | 비로그인 접근 시 **500 크래시** |
| 5 | `yesterday`/`today`를 모듈 최상단에서 1회 계산 | 장시간 구동 시 **조회 날짜가 갱신되지 않음** |
| 6 | Mongoose 콜백 API `find({}, cb)` | Mongoose 7에서 제거됨 → 업그레이드 시 동작 불가 |
| 7 | `totalCount != 0 && !null` | `!null`은 항상 true인 무의미한 조건 |
| 8 | 암묵적 전역 `dataProcess`, `getData` (선언 키워드 없음) | 모듈 스코프 오염 |
| 9 | 라디오 두 개가 모두 `id='radio'`, `htmlFor`가 없는 id를 가리킴 | 잘못된 HTML, label 클릭 동작 불가 |
| 10 | `document.getElementById('warning').innerText` 직접 DOM 조작 | 원작자가 `//안티 패턴 수정 필요` 주석을 남긴 지점 |
| 11 | `modify`에서 안내문과 제출 게이트의 비밀번호 판정 기준이 다름 | "잘못되었습니다" 표시 상태로도 제출 가능 |
| 12 | 조달청 일부 요청 거절 시 `Promise.all`로 전체 실패 | `Promise.allSettled`로 부분 결과 반환 |
| 13 | Dockerfile이 프로덕션에서 `npm run dev:https` 실행 | **운영 환경에서 dev 서버 기동** |
| 14 | `server.get("*")`가 `/test`보다 먼저 등록 | `/test` 도달 불가 (커스텀 서버 제거로 소멸) |

---

## 6. 코디네이터 판단 3건

명세를 그대로 따르면 오히려 동작이 나빠지는 지점이라 판단해 조정했다.

1. **쿠키 수명을 8640초로 유지**
   Express의 `maxAge`는 **밀리초**여서 원본 `8640000`은 실제로 `Max-Age=8640`초(2.4시간)를
   내보냈다. Next의 `maxAge`는 **초**라서 그대로 옮기면 수명이 **100일로 1000배 연장**된다.
   요청하지 않은 보안 완화이므로 기존 동작(2.4시간)을 유지했다.

2. **Tailwind v4 대신 v3.4.19 유지**
   레거시 마크업이 `shadow`(93회), `rounded`(55회), `outline-none`(29회)을 쓰는데
   v4에서 이 세 유틸리티의 의미가 바뀐다. "화면 모양을 바꾸지 않는다"는 원칙상 v3가 맞다.

3. **서버 컴포넌트가 자기 API를 HTTP로 재호출하는 구조 제거**
   서버 컴포넌트에서는 상대경로 `fetch`가 불가능한데, 이를 `x-forwarded-*` 헤더로 자기 오리진을
   재구성해 자기 라우트 핸들러를 다시 호출하는 방식으로 우회한 구현이 있었다.
   nginx 헤더 설정에 결합되고 불필요한 왕복이 발생하므로 `lib/nara-api.js`·모델을
   **직접 import**하도록 교체했다.

---

## 7. 검증 결과

### 검증 완료

- `.next` 삭제 후 **클린 프로덕션 빌드 exit 0** — 23개 라우트 등록(페이지 12 + API 11)
- `npx eslint .` **에러 0** (warning 포함 0)
- `npx prettier --check .` 통과
- 잔존 레거시 패턴 **0건**: `axios`, `moment`, `getServerSideProps`, `next/router`,
  `checkCookies`, date-fns 딥임포트, heroicons v1 경로
- `output: 'standalone'` 설정과 `.next/standalone/server.js` 산출물 존재 확인
  (Dockerfile의 `node server.js`가 동작할 조건)
- 커밋에 시크릿·`node_modules`·`.next` 미포함 확인

### ⚠️ 검증하지 못한 것

작업 머신에 `MONGO_URL`과 `SERVICE_KEY`가 없어 **런타임 동작은 한 번도 실행되지 않았다.**
빌드 통과가 동작 보장이 아니므로 배포 전 아래를 실제로 확인해야 한다.

- DB 접근 경로 전체 — `/usertask` 직접 Mongoose 조회, 로그인·가입·수정·탈퇴
- 나라장터 오픈API 호출 전체, 특히 `SERVICE_KEY`를 `key=value` 원문으로 붙이는 방식
- 로그인 쿠키 왕복 (설정 → 전송 → 만료)
- `docker build` 및 `docker compose up`
- nginx → 앱 컨테이너 프록시 경로

---

## 8. 배포 절차

```bash
# 1) 환경변수 파일 생성 (실제 값은 커밋 대상이 아니다)
cp frontend/config_files/.env.example frontend/config_files/.env.production
# 2) 값을 채운다. SERVICE_KEY 는 `key=value` 형태 문자열을 통째로 넣어야 한다.
# 3) 기동
docker-compose up -d --build
```

`.env.production`이 없으면 `docker-compose up`이 실패한다. 필요한 키 10개와 주의사항은
`frontend/config_files/.env.example`의 주석에 정리돼 있다.

---

## 9. 남은 과제

**사용자 결정으로 범위에서 제외 (실제 취약점)**
- 비밀번호 평문 저장·비교 → bcrypt 등 해싱 필요
- JWT 미검증 — 쿠키 존재 여부만 확인하며 `jwt.verify`를 하지 않음
- 쿠키에 `httpOnly`/`secure` 미설정

**의도적으로 보존한 레거시 동작** (고치면 화면 동작이 바뀌므로 `FIXME` 주석과 함께 유지)
- `/todaytask/show`: 사전공고가 0건이면 본공고가 있어도 "데이터 없음" 표시
- `/todaytask`: 사용자가 추가한 기관이 항상 본공고(`'b'`)로 태깅됨 (라디오 마크업이 원래 없었음)
- `GET /api/v1/list`: 쿼리 파라미터를 무시하고 특정 기관명으로만 조회 (원작자 의도 불명)
- `/list/[pageNum]`: `pageNum` 세그먼트가 실제로 사용되지 않음

**기존 README에서 이어지는 항목**
- 한글 로그인 방지, 공고 검색 속도 개선(데이터 아카이빙),
  기관명 입력 시 목록 표시, 프로세스 관리(PM2 등)
