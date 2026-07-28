'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DatePicker from 'react-datepicker'
import { addDays, format, isBefore, startOfDay, subDays } from 'date-fns'
import 'react-datepicker/dist/react-datepicker.css'

const QUERY_DATE_FORMAT = 'yyyyMMdd0000'
const RADIO_INPUT_CLASS =
  'form-check-input rounded-full h-4 w-4 border border-gray-300 checked:bg-blue-400 mt-1 align-top mr-2 cursor-pointer'
const TEXT_INPUT_CLASS = 'border-solid border-2 border-gray-400 rounded-md'
const DATE_INPUT_CLASS = 'border-solid border-2 border-gray-400 rounded-md m-2'
const SEARCH_BUTTON_CLASS =
  'inline-block px-6 py-2.5 bg-blue-400 text-white font-medium text-xs leading-tight rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out'

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
    <div>
      <div className="flex justify-center items-center space-x-4 m-4">
        <div className="form-check form-check-inline">
          <input
            className={RADIO_INPUT_CLASS}
            type="radio"
            name="inlineRadioOptions"
            id="inlineRadioSajeon"
            value="sajeon"
            onChange={handleRadioChange}
          />
          <label
            className="form-check-label inline-block text-gray-800"
            htmlFor="inlineRadioSajeon"
          >
            사전공고
          </label>
        </div>
        <div className="form-check form-check-inline">
          <input
            className={RADIO_INPUT_CLASS}
            type="radio"
            name="inlineRadioOptions"
            id="inlineRadioBone"
            value="bone"
            onChange={handleRadioChange}
          />
          <label className="form-check-label inline-block text-gray-800" htmlFor="inlineRadioBone">
            본공고
          </label>
        </div>
        <input
          className={TEXT_INPUT_CLASS}
          placeholder="부서명"
          onChange={handleDepartNameChange}
        />
        <div className="flex flex-row items-center">
          <DatePicker
            selected={startDate}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            dateFormat="yyyyMMdd"
            todayButton="TODAY"
            onChange={(date) => setStartDate(date)}
            customInput={<input className={DATE_INPUT_CLASS} placeholder="시작일" id="startDate" />}
          />
          <DatePicker
            selected={endDate}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            dateFormat="yyyyMMdd"
            todayButton="TODAY"
            onChange={(date) => setEndDate(date)}
            customInput={<input className={DATE_INPUT_CLASS} placeholder="종료일" id="endDate" />}
          />
        </div>
        <div>
          <button className={SEARCH_BUTTON_CLASS} onClick={handleSearch}>
            검색
          </button>
        </div>
      </div>
      <div className="mx-16 my-4 text-center text-red-500">{warning}</div>
    </div>
  )
}
