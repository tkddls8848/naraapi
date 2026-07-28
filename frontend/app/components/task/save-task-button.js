'use client'

import { BookmarkIcon } from '@heroicons/react/24/outline'

export default function SaveTaskButton({ userId, taskType, taskTitle }) {
  const saveTask = async () => {
    await fetch('/api/v1/usertask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, task_type: taskType, task_title: taskTitle }),
    })
    alert(`"${taskTitle}" 사업이 저장 되었습니다.`)
  }

  return (
    <button className="btn-outline btn-sm" onClick={saveTask}>
      <BookmarkIcon className="size-4" aria-hidden="true" />
      저장
    </button>
  )
}
