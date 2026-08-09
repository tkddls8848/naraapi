import { getCurrentUser } from '@/lib/auth'
import LoginPanel from './login-panel'

export default async function LoginPage() {
  const userId = await getCurrentUser()
  return <LoginPanel userId={userId} />
}
