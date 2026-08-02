-- v3.2 -> v4.0 스키마 마이그레이션
--
-- postgres/init/01-schema.sql 은 **데이터 볼륨이 빈 최초 기동에서만** 실행된다.
-- 이미 데이터가 있는 운영 DB 는 init 스크립트를 무시하므로, v4.0 을 배포하기 전에
-- 이 파일을 직접 적용해야 한다. 적용하지 않으면 앱이 기동 후 첫 쿼리에서 깨진다.
--
--   docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
--     -v ON_ERROR_STOP=1 < postgres/migrations/v3.2-to-v4.0.sql
--
-- 반드시 백업을 먼저 뜬 뒤 적용한다(README 의 백업 절 참고).
-- 전체가 한 트랜잭션이라 중간에 실패하면 아무것도 반영되지 않는다.
-- 재실행해도 안전하도록 각 단계에 존재 여부 조건을 걸었다.

BEGIN;

-- 1) users.e_mail -> users.email
--    이름이 오타에 가까워 정리했다. 값은 그대로 옮겨간다(rename 이라 복사가 없다).
ALTER TABLE users RENAME COLUMN e_mail TO email;

-- 2) user_tasks 에 공고 식별자와 링크 추가
--    기존에는 task_title(문자열)만 저장해서 저장한 공고를 다시 열 방법이 없었다.
--    과거 행에는 이 값이 없으므로 NULL 을 허용한다. 신규 저장은 앱이 notice_id 를 요구한다.
ALTER TABLE user_tasks ADD COLUMN IF NOT EXISTS notice_id text;
ALTER TABLE user_tasks ADD COLUMN IF NOT EXISTS notice_url text;

-- 3) 같은 유저가 같은 공고를 두 번 저장하지 못하게 한다.
--    Postgres 의 UNIQUE 는 NULL 끼리를 중복으로 보지 않으므로, notice_id 가 비어 있는
--    과거 행들은 이 제약에 걸리지 않고 그대로 남는다.
--    제약을 걸기 전에 notice_id 가 있는 행 중 중복이 있으면 실패하므로 먼저 정리한다.
DELETE FROM user_tasks a
USING user_tasks b
WHERE a.notice_id IS NOT NULL
  AND a.notice_id = b.notice_id
  AND a.user_id = b.user_id
  AND a.task_type = b.task_type
  AND a.content_number > b.content_number;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_tasks_user_notice_unique'
  ) THEN
    ALTER TABLE user_tasks
      ADD CONSTRAINT user_tasks_user_notice_unique UNIQUE (user_id, task_type, notice_id);
  END IF;
END
$$;

-- 4) archives 삭제
--    아카이빙 기능은 구현된 적이 없고 읽던 GET /api/v1/logic 도 함께 사라졌다.
--    데이터가 들어간 적이 없으므로 잃을 것이 없다.
DROP TABLE IF EXISTS archives;

COMMIT;

-- 적용 후 확인
--   \d users        -> email 컬럼, e_mail 없음
--   \d user_tasks   -> notice_id / notice_url 컬럼, user_tasks_user_notice_unique 제약
--   \dt             -> users, user_tasks 두 개 (archives 없음)
