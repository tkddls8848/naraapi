import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
// 확장자를 명시해 두면 Next 밖(순수 Node 스크립트)에서도 그대로 import 된다.
import * as schema from './schema.js'

// 개발 중 핫리로드와 콜드스타트에서 커넥션 풀이 중복 생성되는 것을 막기 위해
// globalThis 에 캐싱한다(구 lib/mongoose.js 가 하던 역할과 같다).
const CACHE_KEY = '__naraapiDrizzle'

/**
 * DB 핸들을 지연 생성한다. 모듈 로드 시점에 만들면 DATABASE_URL 이 없는 빌드 단계에서
 * 터지므로, 실제로 쿼리하는 시점에만 풀을 만든다.
 */
export function getDb() {
  const cached = globalThis[CACHE_KEY]
  if (cached) return cached

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL 환경변수가 설정되지 않았습니다.')
  }

  // 앱 컨테이너 하나가 쓰는 풀이라 크게 잡을 이유가 없다.
  const pool = new Pool({ connectionString, max: 5 })
  const db = drizzle(pool, { schema })

  globalThis[CACHE_KEY] = db
  return db
}
