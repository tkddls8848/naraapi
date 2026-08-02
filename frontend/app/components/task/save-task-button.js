'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { BookmarkIcon, CheckIcon } from '@heroicons/react/24/outline'
import { saveUserTask } from '@/app/actions/user-task-actions'

const ERROR_MESSAGES = {
  'invalid-session': '로그인 정보를 확인할 수 없습니다.',
  'missing-notice-id': '공고 식별자가 없어 저장할 수 없습니다.',
  'already-saved': '이미 저장한 공고입니다.',
}

function SubmitButton({ saved }) {
  const { pending } = useFormStatus()

  return (
    <button className="btn-outline btn-sm" type="submit" disabled={pending || saved}>
      {saved ? (
        <CheckIcon className="size-4" aria-hidden="true" />
      ) : (
        <BookmarkIcon className="size-4" aria-hidden="true" />
      )}
      {pending ? '저장 중...' : saved ? '저장됨' : '저장'}
    </button>
  )
}

export default function SaveTaskButton({ taskType, taskTitle, noticeId, noticeUrl }) {
  const [state, formAction] = useActionState(saveUserTask, null)
  const saved = state?.ok === true || state?.reason === 'already-saved'
  const message = state?.ok
    ? `“${taskTitle ?? '제목 없는 공고'}”을(를) 저장했습니다.`
    : ERROR_MESSAGES[state?.reason]

  return (
    <form className="flex flex-col items-start gap-2" action={formAction}>
      <input type="hidden" name="taskType" value={taskType} />
      <input type="hidden" name="taskTitle" value={taskTitle ?? ''} />
      <input type="hidden" name="noticeId" value={noticeId} />
      <input type="hidden" name="noticeUrl" value={noticeUrl ?? ''} />
      <SubmitButton saved={saved} />
      {message ? (
        <p
          className={saved ? 'text-sm text-emerald-700' : 'text-sm text-rose-700'}
          role={saved ? 'status' : 'alert'}
        >
          {message}
        </p>
      ) : null}
    </form>
  )
}
