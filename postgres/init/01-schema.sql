-- frontend/lib/db/index.js와 실제 컬럼 및 제약 조건을 함께 갱신한다.

CREATE TABLE users (
  user_id text PRIMARY KEY,
  user_pw text NOT NULL,
  email text
);

CREATE TABLE user_tasks (
  content_number integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
  task_type text NOT NULL,
  task_title text NOT NULL,
  notice_id text NOT NULL,
  notice_url text,
  CONSTRAINT user_tasks_user_notice_unique UNIQUE (user_id, task_type, notice_id)
);

CREATE INDEX user_tasks_user_id_idx ON user_tasks (user_id);
