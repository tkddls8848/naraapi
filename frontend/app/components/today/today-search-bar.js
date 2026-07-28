'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MagnifyingGlassIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'

// FIXME: 공고타입을 고르는 라디오가 마크업에 없어서 추가되는 기관은 항상 '본공고'로 들어간다.
// 기본 두 기관만 '사전공고'다. 기존 동작 그대로 보존한다.
const DEFAULT_DEPARTS = [
  { kind: 's', name: '국민연금공단' },
  { kind: 's', name: '건강보험심사평가원' },
]
const ADDED_DEPART_KIND = 'b'

export default function TodaySearchBar() {
  const [departName, setDepartName] = useState('')
  const [departs, setDeparts] = useState(DEFAULT_DEPARTS)
  const router = useRouter()

  const handleDepartNameChange = (e) => setDepartName(e.target.value)

  const addDepart = () => {
    const name = departName.trim()
    if (name === '') {
      return
    }
    setDeparts((current) =>
      current.some((depart) => depart.kind === ADDED_DEPART_KIND && depart.name === name)
        ? current
        : [...current, { kind: ADDED_DEPART_KIND, name }]
    )
  }

  const deleteDepart = (target) => {
    setDeparts((current) =>
      current.filter((depart) => depart.kind !== target.kind || depart.name !== target.name)
    )
  }

  const searchDeparts = () => {
    const query = new URLSearchParams()
    departs.forEach((depart) => query.append('depart', depart.name))
    router.push(`/todaytask/show?${query}`)
  }

  return (
    <div className="toolbar">
      <div className="toolbar-row">
        <div className="field flex-1 md:min-w-56">
          <label className="field-label" htmlFor="todayDepartName">
            기관명 추가
          </label>
          <input
            className="input"
            id="todayDepartName"
            placeholder="예) 국민연금공단"
            onChange={handleDepartNameChange}
            onKeyDown={(e) => {
              // 엔터로도 목록에 담을 수 있게 한다.
              if (e.key === 'Enter') {
                addDepart()
              }
            }}
          />
        </div>
        <div className="flex gap-2">
          <button className="btn-outline" onClick={addDepart}>
            <PlusIcon className="size-4" aria-hidden="true" />
            추가
          </button>
          <button className="btn-primary" onClick={searchDeparts}>
            <MagnifyingGlassIcon className="size-4" aria-hidden="true" />
            검색
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
        <span className="field-label">선택한 기관 {departs.length}곳</span>
        {departs.map((depart) => (
          <span className="chip" key={`${depart.kind}${depart.name}`}>
            {depart.name}
            <button
              className="chip-remove"
              aria-label={`${depart.name} 제외`}
              onClick={() => deleteDepart(depart)}
            >
              <XMarkIcon className="size-3.5" aria-hidden="true" />
            </button>
          </span>
        ))}
      </div>
    </div>
  )
}
