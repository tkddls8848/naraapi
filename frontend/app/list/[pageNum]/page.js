import ListModal from './list-modal'
import { fetchDminsttList } from '@/lib/nara-api'

export const dynamic = 'force-dynamic'

export default async function ListPage() {
  const lists = await fetchDminsttList()

  return <ListModal lists={lists} />
}
