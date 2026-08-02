'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { ArrowTopRightOnSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import { deleteUserTask } from '@/app/actions/user-task-actions'

const TASK_TYPE_LABELS = {
  sajeon: '사전공고',
  bone: '본공고',
}

const ERROR_MESSAGES = {
  'invalid-session': '로그인 정보를 확인할 수 없습니다.',
  'invalid-content-number': '삭제할 공고 번호가 올바르지 않습니다.',
  'not-found': '이미 삭제되었거나 찾을 수 없는 공고입니다.',
}

function DeleteButton({ deleted }) {
  const { pending } = useFormStatus()

  return (
    <button
      className="btn-ghost btn-sm text-rose-600 hover:bg-rose-500/10 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
      type="submit"
      disabled={pending || deleted}
    >
      <TrashIcon className="size-4" aria-hidden="true" />
      {pending ? '삭제 중...' : deleted ? '삭제됨' : '삭제'}
    </button>
  )
}

export default function UserTasks({ usertask }) {
  const [state, formAction] = useActionState(deleteUserTask, null)
  const deleted = state?.ok === true
  const message = deleted ? '저장 목록에서 삭제했습니다.' : ERROR_MESSAGES[state?.reason]
  const taskTypeLabel = TASK_TYPE_LABELS[usertask.taskType] ?? '공고'

  return (
    <article className="card card-hover">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={usertask.taskType === 'sajeon' ? 'badge-brand' : 'badge-accent'}>
          {taskTypeLabel}
        </span>
        <span className="badge-neutral">{usertask.userId}</span>
      </div>
      <h3 className="notice-title">{usertask.taskTitle}</h3>
      {usertask.noticeId ? (
        <p className="text-xs text-ink-faint">공고 ID {usertask.noticeId}</p>
      ) : null}
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
        {usertask.noticeUrl ? (
          <a
            className="btn-outline btn-sm"
            href={usertask.noticeUrl}
            target="_blank"
            rel="noreferrer"
          >
            <ArrowTopRightOnSquareIcon className="size-4" aria-hidden="true" />
            관련 파일 열기
          </a>
        ) : null}
        <form className="flex flex-col items-start gap-2" action={formAction}>
          <input type="hidden" name="contentNumber" value={usertask.contentNumber} />
          <DeleteButton deleted={deleted} />
          {message ? (
            <p
              className={deleted ? 'text-sm text-emerald-700' : 'text-sm text-rose-700'}
              role={deleted ? 'status' : 'alert'}
            >
              {message}
            </p>
          ) : null}
        </form>
      </div>
    </article>
  )
}
