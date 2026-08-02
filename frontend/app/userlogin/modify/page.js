import { requireUser } from '@/lib/auth'
import ModifyForm from './modify-form'

export default async function ModifyPage() {
  const userId = await requireUser()
  // NOTE: 보안 강화는 사용자 결정에 따라 범위 밖 — 쿠키 존재 여부만 확인하고 서명은 검증하지 않는다.
  return <ModifyForm userId={userId} />
}
