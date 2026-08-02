import { requireUser } from '@/lib/auth'
import DeleteForm from './delete-form'

export default async function DeletePage() {
  const userId = await requireUser()
  // NOTE: 보안 강화는 사용자 결정에 따라 범위 밖 — 쿠키 존재 여부만 확인하고 서명은 검증하지 않는다.
  return <DeleteForm userId={userId} />
}
