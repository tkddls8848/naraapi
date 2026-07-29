-- postgres 컨테이너의 /docker-entrypoint-initdb.d 에 마운트된다.
-- **데이터 볼륨이 빈 최초 기동에서만** 실행된다. 이미 데이터가 있으면 무시되므로,
-- 나중에 스키마를 바꿀 때는 이 파일이 아니라 ALTER 문을 직접 적용해야 한다.
--
-- frontend/lib/db/schema.js 와 짝을 이룬다(그쪽은 쿼리용 선언, 이 파일이 실제 DDL).
-- 한쪽만 고치면 어긋나서 기동 후 첫 쿼리에서 바로 깨지므로 둘을 함께 고쳐야 한다.

CREATE TABLE users (
  -- 로그인 아이디가 자연키다. Mongo 시절에는 unique 인덱스가 앱 코드 선언에 의존했지만
  -- 여기서는 테이블 정의의 일부라 항상 존재한다.
  user_id text PRIMARY KEY,
  -- NOTE: 보안 강화는 사용자 결정에 따라 범위 밖 — 평문 저장을 유지한다.
  user_pw text NOT NULL,
  e_mail text
);

CREATE TABLE user_tasks (
  -- mongoose-sequence 가 카운터 컬렉션으로 흉내내던 자동증가. identity 는 원자적이고
  -- 별도 컬렉션도 추가 왕복도 없다.
  content_number integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- 회원탈퇴 시 저장한 공고를 DB 가 함께 지운다. 앱에서 deleteOne + deleteMany 를
  -- 트랜잭션 없이 두 번 호출하던 것을 제약으로 옮긴 것이다.
  user_id text NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
  task_type text NOT NULL,
  task_title text NOT NULL
);

-- Postgres 는 외래키에 인덱스를 자동 생성하지 않는다. 저장된 공고 목록 조회가 이 컬럼으로만 걸린다.
CREATE INDEX user_tasks_user_id_idx ON user_tasks (user_id);

-- 공고 아카이빙용. 나라장터 API 는 물품/공사/용역마다 응답 필드가 달라 원본 JSON 을 그대로 담는다.
-- 아직 쓰는 코드는 없고 GET /api/v1/logic 이 읽기만 한다.
CREATE TABLE archives (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  depart_name text,
  task_type text,
  date text,
  task_data jsonb
);
