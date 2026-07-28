'use client'

import { useEffect, useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

export default function ListModal({ lists }) {
  const [showModal, setShowModal] = useState(false)

  // ESC 로도 닫히게 한다. 모달이 열려 있을 때만 리스너를 붙인다.
  useEffect(() => {
    if (!showModal) {
      return
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowModal(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [showModal])

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">수요기관 목록</h1>
        <p className="page-subtitle">나라장터에 등록된 수요기관 {lists.length}곳</p>
      </div>
      <div className="flex justify-center py-4">
        <button className="btn-primary" type="button" onClick={() => setShowModal(true)}>
          목록 보기
        </button>
      </div>

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-sm"
            type="button"
            aria-label="목록 닫기"
            onClick={() => setShowModal(false)}
          />
          <div
            className="animate-rise surface-card relative flex max-h-[85dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl shadow-lift"
            role="dialog"
            aria-modal="true"
            aria-labelledby="listModalTitle"
          >
            <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
              <h2 className="text-lg font-bold tracking-tight" id="listModalTitle">
                수요기관 목록
              </h2>
              <button
                className="chip-remove"
                type="button"
                aria-label="닫기"
                onClick={() => setShowModal(false)}
              >
                <XMarkIcon className="size-5" aria-hidden="true" />
              </button>
            </div>
            {lists.length > 0 ? (
              <ul className="flex-1 divide-y divide-line overflow-y-auto px-5 py-2 text-sm">
                {lists.map((list) => (
                  <li className="py-2.5" key={list}>
                    {list.split('||')[0]}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-10 text-center text-sm text-ink-soft">
                불러온 기관 목록이 없습니다.
              </p>
            )}
            <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-4">
              <button className="btn-outline" type="button" onClick={() => setShowModal(false)}>
                닫기
              </button>
              <button className="btn-primary" type="button" onClick={() => setShowModal(false)}>
                확인
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
