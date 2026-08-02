'use client'

import { useActionState, useState } from 'react'
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
  const [noticeType, setNoticeType] = useState('')
  const [departName, setDepartName] = useState('')
  const [startDate, setStartDate] = useState(subDays(new Date(), 1))
  const [endDate, setEndDate] = useState(new Date())
  const router = useRouter()

  const [warning, searchAction] = useActionState((_previousWarning, formData) => {
    const submittedNoticeType = String(formData.get('noticeType') ?? '')
    const submittedDepartName = String(formData.get('departName') ?? '').trim()
    const lastDate = endDate == null ? null : addDays(endDate, 1)
    const isValidPeriod =
      startDate != null && lastDate != null && isBefore(startOfDay(startDate), startOfDay(lastDate))

    const invalidFields = []
    if (!NOTICE_TYPES.some(({ value }) => value === submittedNoticeType)) {
      invalidFields.push('공고타입')
    }
    if (submittedDepartName === '') {
      invalidFields.push('기관명')
    }
    if (!isValidPeriod) {
      invalidFields.push('조회기간')
    }

    if (invalidFields.length > 0) {
      return `${invalidFields.join(', ')}을(를) 확인해 주세요.`
    }

    const query = new URLSearchParams({
      beginDate: format(startDate, QUERY_DATE_FORMAT),
      endDate: format(lastDate, QUERY_DATE_FORMAT),
    })
    router.push(`/task/${submittedNoticeType}/${encodeURIComponent(submittedDepartName)}?${query}`)
    return ''
  }, '')

  return (
    <form className="toolbar" action={searchAction}>
      <div className="toolbar-row">
        <fieldset className="field">
          <legend className="field-label">공고타입</legend>
          <div className="segmented">
            {NOTICE_TYPES.map(({ value, label }) => (
              <label className="segmented-item" key={value}>
                <input
                  className="sr-only"
                  type="radio"
                  name="noticeType"
                  value={value}
                  checked={noticeType === value}
                  onChange={(event) => setNoticeType(event.target.value)}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="field flex-1 md:min-w-56">
          <label className="field-label" htmlFor="departName">
            기관명
          </label>
          <input
            className="input"
            id="departName"
            name="departName"
            value={departName}
            placeholder="예) 국민연금공단"
            onChange={(event) => setDepartName(event.target.value)}
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

        <button className="btn-primary" type="submit">
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
    </form>
  )
}
