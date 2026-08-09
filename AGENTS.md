# NARA-P 작업 지침

- 현재 구현과 신규 PostgreSQL 스키마만 지원한다. 별도 요청이 없으면 과거 버전 호환 코드나 데이터 이관 도구를 추가하지 않는다.
- 생성 파일인 `frontend/package-lock.json`은 의존성 변경 때만 갱신하고 코드 분석 대상으로 읽지 않는다.

## 핵심 위치

- 페이지와 Server Action: `frontend/app`
- 나라장터 API 정규화: `frontend/lib/nara-api.js`
- 인증: `frontend/lib/auth.js`, `frontend/app/actions/auth-actions.js`
- DB 연결과 스키마: `frontend/lib/db/index.js`
- 신규 DB DDL: `postgres/init/01-schema.sql`

공고 객체 계약은 다음과 같다.

```js
{ id, title, departName, registeredAt, closesAt, fileUrl, kind }
```

`kind`는 `sajeon` 또는 `bone`이다. DB 선언을 바꾸면 `postgres/init/01-schema.sql`도 함께 바꾼다.

## 검증

`frontend`에서 아래 순서로 실행한다.

```sh
npm run lint
npx prettier --check .
npm run build
```
