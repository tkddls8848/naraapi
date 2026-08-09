import { requireUser } from '@/lib/auth'
import DeleteForm from './delete-form'

export default async function DeletePage() {
  const userId = await requireUser()
  return <DeleteForm userId={userId} />
}
