'use client'

import { useRouter } from 'next/navigation'

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
    <div className="m-3 p-4 bg-white rounded-lg border-2 border-gray-300">
      <p>유저명 : {userName}</p>
      <p>업무 타입 : {TASK_TYPE_LABELS[taskType] ?? TASK_TYPE_LABELS.bone}</p>
      <p>업무명 : {taskTitle}</p>
      <button
        className="inline-block px-3 py-2 mt-2 bg-red-400 text-white font-medium text-xs leading-tight rounded shadow-md hover:bg-red-700 hover:shadow-lg focus:bg-red-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-red-800 active:shadow-lg transition duration-150 ease-in-out"
        onClick={deleteTask}
      >
        삭제
      </button>
    </div>
  )
}
