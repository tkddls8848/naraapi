'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MagnifyingGlassIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'

function uniqueDepartNames(departNames) {
  return [...new Set((departNames ?? []).map((name) => String(name).trim()).filter(Boolean))]
}

export default function TodaySearchBar({ initialDeparts = [] }) {
  const [departName, setDepartName] = useState('')
  const [departs, setDeparts] = useState(() => uniqueDepartNames(initialDeparts))
  const [feedback, setFeedback] = useState(null)
  const router = useRouter()

  const addDepart = (formData) => {
    const name = String(formData.get('departName') ?? '').trim()
    if (name === '') {
      setFeedback({ type: 'error', message: '추가할 기관명을 입력해 주세요.' })
      return
    }
    if (departs.includes(name)) {
      setFeedback({ type: 'error', message: '이미 선택한 기관입니다.' })
      return
    }

    setDeparts((current) => [...current, name])
    setDepartName('')
    setFeedback({ type: 'success', message: `${name}을(를) 추가했습니다.` })
  }

  const deleteDepart = (target) => {
    setDeparts((current) => current.filter((depart) => depart !== target))
    setFeedback({ type: 'success', message: `${target}을(를) 제외했습니다.` })
  }

  const searchDeparts = () => {
    if (departs.length === 0) {
      setFeedback({ type: 'error', message: '검색할 기관을 한 곳 이상 추가해 주세요.' })
      return
    }

    const query = new URLSearchParams()
    departs.forEach((depart) => query.append('depart', depart))
    router.push(`/todaytask/show?${query}`)
  }

  return (
    <div className="toolbar">
      <div className="toolbar-row">
        <form className="contents" action={addDepart}>
          <div className="field flex-1 md:min-w-56">
            <label className="field-label" htmlFor="todayDepartName">
              기관명 추가
            </label>
            <input
              className="input"
              id="todayDepartName"
              name="departName"
              value={departName}
              placeholder="예) 국민연금공단"
              onChange={(event) => {
                setDepartName(event.target.value)
                setFeedback(null)
              }}
            />
          </div>
          <button className="btn-outline" type="submit">
            <PlusIcon className="size-4" aria-hidden="true" />
            추가
          </button>
        </form>
        <form action={searchDeparts}>
          <button className="btn-primary" type="submit">
            <MagnifyingGlassIcon className="size-4" aria-hidden="true" />
            검색
          </button>
        </form>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
        <span className="field-label">선택한 기관 {departs.length}곳</span>
        {departs.length === 0 ? (
          <span className="text-sm text-ink-soft">아직 선택한 기관이 없습니다.</span>
        ) : (
          departs.map((depart) => (
            <span className="chip" key={depart}>
              {depart}
              <button
                className="chip-remove"
                type="button"
                aria-label={`${depart} 제외`}
                onClick={() => deleteDepart(depart)}
              >
                <XMarkIcon className="size-3.5" aria-hidden="true" />
              </button>
            </span>
          ))
        )}
      </div>

      {feedback ? (
        <p
          className={
            feedback.type === 'error'
              ? 'rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-sm font-medium text-rose-700 dark:text-rose-300'
              : 'rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-sm font-medium text-emerald-700 dark:text-emerald-300'
          }
          role={feedback.type === 'error' ? 'alert' : 'status'}
        >
          {feedback.message}
        </p>
      ) : null}
    </div>
  )
}
