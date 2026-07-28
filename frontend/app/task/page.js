import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import TaskSearchBar from '@/app/components/task/task-search-bar'

export const dynamic = 'force-dynamic'

export default async function TaskSearchPage() {
  const cookieStore = await cookies()
  if (!cookieStore.has('userCookie')) {
    redirect('/')
  }

  return (
    <div>
      <TaskSearchBar />
      <div className="flex justify-center py-10 text-base">
        검색을 통해 공고를 확인 할 수 있습니다.
      </div>
    </div>
  )
}
