'use client'

import { useRouter } from 'next/navigation'
import { TrashIcon } from '@heroicons/react/24/outline'

const TASK_TYPE_LABELS = {
  sajeon: '사전공고',
  bone: '본공고',
}

export default function UserTasks({ usertask }) {
  // API 응답이 [user_id, task_type, task_title, content_number] 튜플 배열이라 구조분해로 읽는다.
  const [userName, taskType, taskTitle, contentNumber] = usertask
  const router = useRouter()

  const deleteTask = async () => {
    await fetch(`/api/v1/usertask/${contentNumber}`, { method: 'DELETE' })
    alert('삭제되었습니다.')
    router.refresh()
  }

  return (
    <article className="card card-hover">
      <div className="flex flex-wrap items-center gap-1.5">
        {taskType === 'sajeon' ? (
          <span className="badge-brand">{TASK_TYPE_LABELS.sajeon}</span>
        ) : (
          <span className="badge-accent">{TASK_TYPE_LABELS.bone}</span>
        )}
        <span className="badge-neutral">{userName}</span>
      </div>
      <h3 className="notice-title">{taskTitle}</h3>
      <div className="mt-auto flex pt-1">
        <button
          className="btn-ghost btn-sm text-rose-600 hover:bg-rose-500/10 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
          onClick={deleteTask}
        >
          <TrashIcon className="size-4" aria-hidden="true" />
          삭제
        </button>
      </div>
    </article>
  )
}
