'use client'

import { useRouter } from 'next/navigation'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export default function DeleteForm({ userId }) {
  const router = useRouter()

  const deleteSubmit = async () => {
    await fetch(`/api/v1/login/${userId}`, { method: 'DELETE' })
    alert('삭제되었습니다.')
    router.push('/')
    router.refresh()
  }

  return (
    <div className="flex justify-center py-6 sm:py-10">
      <div className="panel text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-rose-500/12 text-rose-600 dark:text-rose-300">
          <ExclamationTriangleIcon className="size-6" aria-hidden="true" />
        </span>
        <h1 className="panel-title mt-4">탈퇴확인</h1>
        <p className="panel-caption">{userId}님의 계정을 삭제하시겠습니까?</p>
        <p className="mt-2 text-xs text-ink-faint">저장한 공고 기록도 함께 사라집니다.</p>
        <div className="mt-7 flex flex-col gap-3">
          <button className="btn-danger btn-block" onClick={deleteSubmit}>
            회원탈퇴
          </button>
          <button className="btn-outline btn-block" onClick={() => router.push('/')}>
            취소
          </button>
        </div>
      </div>
    </div>
  )
}
