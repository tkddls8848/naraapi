'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TrashIcon } from '@heroicons/react/24/solid'

// FIXME: 공고타입을 고르는 라디오가 마크업에 없어서 추가되는 기관은 항상 '본공고'로 들어간다.
// 기본 두 기관만 '사전공고'다. 기존 동작 그대로 보존한다.
const DEFAULT_DEPARTS = [
  { kind: 's', name: '국민연금공단' },
  { kind: 's', name: '건강보험심사평가원' },
]
const ADDED_DEPART_KIND = 'b'

const TEXT_INPUT_CLASS = 'border-solid border-2 border-gray-400 rounded-md'
const ADD_BUTTON_CLASS =
  'inline-block px-6 py-2.5 bg-green-400 text-white font-medium text-xs leading-tight rounded shadow-md hover:bg-green-700 hover:shadow-lg focus:bg-green-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-green-800 active:shadow-lg transition duration-150 ease-in-out'
const SEARCH_BUTTON_CLASS =
  'inline-block px-6 py-2.5 bg-blue-400 text-white font-medium text-xs leading-tight rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out'

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
    <div>
      <div className="flex justify-center items-center space-x-6 m-4">
        <input
          className={TEXT_INPUT_CLASS}
          placeholder="부서명"
          onChange={handleDepartNameChange}
        />
        <div className="flex flex-row items-center space-x-2 ">
          <button className={ADD_BUTTON_CLASS} onClick={addDepart}>
            추가
          </button>
          <button className={SEARCH_BUTTON_CLASS} onClick={searchDeparts}>
            검색
          </button>
        </div>
      </div>
      <div className="flex flex-row items-center justify-center">
        {departs.map((depart) => (
          <div
            className="flex flex-row rounded-md m-2 p-1 bg-red-400 text-white"
            key={`${depart.kind}${depart.name}`}
          >
            <div className="p-1 text-xs font-semibold">{depart.name}</div>
            <button className="p-1" onClick={() => deleteDepart(depart)}>
              <TrashIcon className="flex justify-center h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <div className="mx-16 my-4 text-center text-red-500" />
    </div>
  )
}
