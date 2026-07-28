import { NextResponse } from 'next/server'
import connectMongo from '@/lib/mongoose'
import ArchiveData from '@/lib/models/archive/archive-data'

export const dynamic = 'force-dynamic'

export async function GET() {
  await connectMongo()

  // Mongoose 7 에서 콜백 형태의 find(query, cb) 는 제거됐다.
  const archives = await ArchiveData.find({}).lean()

  return NextResponse.json(archives)
}
