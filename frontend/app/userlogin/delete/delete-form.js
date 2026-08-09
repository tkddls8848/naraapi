'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { deleteAccount } from '@/app/actions/auth-actions'
import { SubmitButton } from '@/app/userlogin/form-controls'

export default function DeleteForm({ userId }) {
  const [state, formAction] = useActionState(deleteAccount, null)

  if (state?.ok === true) {
    return (
      <div className="flex justify-center py-6 sm:py-10">
        <div className="panel text-center">
          <h1 className="panel-title">회원탈퇴 완료</h1>
          <p className="panel-caption mt-3" role="status" aria-live="polite">
            계정과 저장한 공고를 삭제했습니다.
          </p>
          <Link className="btn-primary btn-block mt-7" href="/">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-center py-6 sm:py-10">
      <form className="panel text-center" action={formAction}>
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-rose-500/12 text-rose-600 dark:text-rose-300">
          <ExclamationTriangleIcon className="size-6" aria-hidden="true" />
        </span>
        <h1 className="panel-title mt-4">탈퇴확인</h1>
        <p className="panel-caption">{userId}님의 계정을 삭제하시겠습니까?</p>
        <p className="mt-2 text-xs text-ink-faint">저장한 공고 기록도 함께 사라집니다.</p>
        <div className="mt-7 flex flex-col gap-3">
          <SubmitButton className="btn-danger btn-block" pendingLabel="탈퇴 처리 중...">
            회원탈퇴
          </SubmitButton>
          <Link className="btn-outline btn-block" href="/">
            취소
          </Link>
        </div>
      </form>
    </div>
  )
}
