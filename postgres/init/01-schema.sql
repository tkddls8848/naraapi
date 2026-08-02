-- 이 파일은 비어 있는 Postgres 데이터 디렉터리의 최초 기동 때만 실행된다.
-- 운영 중인 데이터베이스에는 별도의 ALTER 문으로 같은 변경을 적용해야 한다.
-- frontend/lib/db/schema.js와 실제 컬럼 및 제약 조건을 항상 함께 갱신한다.

CREATE TABLE users (
  -- 로그인 아이디가 자연키이므로 별도의 대리키 없이 기본 키로 사용한다.
  user_id text PRIMARY KEY,
  -- NOTE: 보안 강화는 사용자 결정에 따라 범위 밖이며 평문 저장 방식을 유지한다.
  user_pw text NOT NULL,
  email text
);

CREATE TABLE user_tasks (
  -- mongoose-sequence가 만들던 값을 보존할 수 있는 Postgres identity 기본 키다.
  content_number integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
  task_type text NOT NULL,
  task_title text NOT NULL,
  -- 기존 Mongo 문서에는 두 값이 없으므로 마이그레이션 호환을 위해 NULL을 허용한다.
  notice_id text,
  notice_url text,
  -- 공고 번호의 체계가 유형마다 다르므로 유형까지 포함해 같은 공고의 중복 저장을 막는다.
  CONSTRAINT user_tasks_user_notice_unique UNIQUE (user_id, task_type, notice_id)
);

CREATE INDEX user_tasks_user_id_idx ON user_tasks (user_id);
