'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DatePicker from 'react-datepicker'
import { addDays, format, isBefore, startOfDay, subDays } from 'date-fns'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

const QUERY_DATE_FORMAT = 'yyyyMMdd0000'

const NOTICE_TYPES = [
  { value: 'sajeon', label: '사전공고' },
  { value: 'bone', label: '본공고' },
]

export default function TaskSearchBar() {
  const [radioType, setRadioType] = useState(null)
  const [departName, setDepartName] = useState(null)
  const [startDate, setStartDate] = useState(subDays(new Date(), 1))
  const [endDate, setEndDate] = useState(new Date())
  const [warning, setWarning] = useState('')
  const router = useRouter()

  const handleRadioChange = (e) => setRadioType(e.target.value)
  const handleDepartNameChange = (e) => setDepartName(e.target.value)

  const handleSearch = () => {
    const lastDate = addDays(endDate, 1)
    // 조회 종료일에 하루를 더한 값과 비교한다. 기존 'YYYYMMDD0000' 문자열 비교와 같은 결과를
    // 내려면 시각을 버리고 날짜 단위로만 비교해야 한다.
    const isValidPeriod = isBefore(startOfDay(startDate), startOfDay(lastDate))

    const invalidFields = []
    if (radioType == null) {
      invalidFields.push('공고타입')
    }
    if (departName == null) {
      invalidFields.push('부서명')
    }
    if (!isValidPeriod) {
      invalidFields.push('날짜')
    }

    if (invalidFields.length > 0) {
      const message = ` ${invalidFields.join(' ')}(이)가 잘못되었습니다.`
      setWarning(message)
      alert(message)
      return
    }

    setWarning('')
    const query = new URLSearchParams({
      beginDate: format(startDate, QUERY_DATE_FORMAT),
      endDate: format(lastDate, QUERY_DATE_FORMAT),
    })
    router.push(`/task/${radioType}/${encodeURIComponent(departName)}?${query}`)
  }

  return (
    <div className="toolbar">
      <div className="toolbar-row">
        <div className="field">
          <span className="field-label">공고타입</span>
          <div className="segmented">
            {NOTICE_TYPES.map(({ value, label }) => (
              <label className="segmented-item" key={value}>
                <input
                  className="sr-only"
                  type="radio"
                  name="inlineRadioOptions"
                  value={value}
                  checked={radioType === value}
                  onChange={handleRadioChange}
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div className="field flex-1 md:min-w-56">
          <label className="field-label" htmlFor="departName">
            기관명
          </label>
          <input
            className="input"
            id="departName"
            placeholder="예) 국민연금공단"
            onChange={handleDepartNameChange}
          />
        </div>

        <div className="field">
          <span className="field-label">조회기간</span>
          <div className="flex items-center gap-2">
            <DatePicker
              selected={startDate}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              dateFormat="yyyyMMdd"
              todayButton="TODAY"
              onChange={(date) => setStartDate(date)}
              // react-datepicker 가 customInput 의 id 는 덮어써 버리므로 aria-label 로 이름을 준다.
              customInput={
                <input className="input md:w-32" placeholder="시작일" aria-label="조회 시작일" />
              }
            />
            <span className="text-ink-faint">~</span>
            <DatePicker
              selected={endDate}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              dateFormat="yyyyMMdd"
              todayButton="TODAY"
              onChange={(date) => setEndDate(date)}
              customInput={
                <input className="input md:w-32" placeholder="종료일" aria-label="조회 종료일" />
              }
            />
          </div>
        </div>

        <button className="btn-primary" onClick={handleSearch}>
          <MagnifyingGlassIcon className="size-4" aria-hidden="true" />
          검색
        </button>
      </div>

      {warning ? (
        <p
          className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-sm font-medium text-rose-700 dark:text-rose-300"
          role="alert"
        >
          {warning}
        </p>
      ) : null}
    </div>
  )
}
