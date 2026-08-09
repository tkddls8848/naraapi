import { requireUser } from '@/lib/auth'
import ModifyForm from './modify-form'

export default async function ModifyPage() {
  const userId = await requireUser()
  return <ModifyForm userId={userId} />
}
