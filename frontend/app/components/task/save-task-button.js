'use client'

const SAVE_BUTTON_CLASS =
  'm-1 inline-block px-3 py-1.5 bg-blue-400 text-white font-medium text-xs leading-tight rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out'

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
    <button className={SAVE_BUTTON_CLASS} onClick={saveTask}>
      저장
    </button>
  )
}
