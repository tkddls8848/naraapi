import mongoose from 'mongoose'

// 개발 중 핫리로드와 서버리스 콜드스타트에서 커넥션이 중복 생성되는 것을 막기 위해
// globalThis 에 커넥션/프라미스를 캐싱한다.
const CACHE_KEY = '__naraapiMongoose'

const cached = globalThis[CACHE_KEY] ?? { conn: null, promise: null }
globalThis[CACHE_KEY] = cached

mongoose.set('strictQuery', true)

async function connectMongo() {
  if (cached.conn) return cached.conn

  if (!cached.promise) {
    const url = process.env.MONGO_URL
    if (!url) throw new Error('MONGO_URL 환경변수가 설정되지 않았습니다.')

    cached.promise = mongoose.connect(url, { bufferCommands: false })
  }

  try {
    cached.conn = await cached.promise
  } catch (err) {
    cached.promise = null
    throw err
  }

  return cached.conn
}

export default connectMongo
