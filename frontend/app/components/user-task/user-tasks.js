'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { ArrowTopRightOnSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import { deleteUserTask } from '@/app/actions/user-task-actions'

const TASK_TYPE_LABELS = {
  sajeon: '사전공고',
  bone: '본공고',
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

export default function UserTasks({ notice }) {
  const [state, formAction] = useActionState(deleteUserTask, null)
  const deleted = state?.ok === true
  const taskTypeLabel = TASK_TYPE_LABELS[notice.taskType]

  return (
    <article className="card card-hover">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={notice.taskType === 'sajeon' ? 'badge-brand' : 'badge-accent'}>
          {taskTypeLabel}
        </span>
      </div>
      <h3 className="notice-title">{notice.taskTitle}</h3>
      <p className="text-xs text-ink-faint">공고 ID {notice.noticeId}</p>
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
        {notice.noticeUrl ? (
          <a
            className="btn-outline btn-sm"
            href={notice.noticeUrl}
            target="_blank"
            rel="noreferrer"
          >
            <ArrowTopRightOnSquareIcon className="size-4" aria-hidden="true" />
            관련 파일 열기
          </a>
        ) : null}
        <form className="flex flex-col items-start gap-2" action={formAction}>
          <input type="hidden" name="contentNumber" value={notice.contentNumber} />
          <DeleteButton deleted={deleted} />
          {deleted ? (
            <p className="text-sm text-emerald-700" role="status">
              저장 목록에서 삭제했습니다.
            </p>
          ) : null}
        </form>
      </div>
    </article>
  )
}
