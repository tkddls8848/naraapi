'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// 서버가 process.env.STATUS_* 값을 그대로 내려주므로 기존 문자열을 그대로 유지한다.
const STATUS_ALREADY_JOIN = 'already join user'
const STATUS_JOIN = 'join user'
const STATUS_NULL_DATA = 'null data'

const PW_MATCH_MESSAGE = '확인되었습니다.'
const PW_MISMATCH_MESSAGE = '비밀번호 입력이 잘못되었습니다.'

const INPUT_CLASS = 'border-solid border-2 border-gray-400 rounded-md'

export default function Join() {
  const [userId, setUserId] = useState('')
  const [userPw, setUserPw] = useState('')
  // 최초 렌더에서 '' !== undefined 라 안내문이 뜨던 기존 동작을 그대로 유지한다.
  const [userRePw, setUserRePw] = useState()
  const [userEmail, setUserEmail] = useState('')
  const router = useRouter()

  const pwAlarm = userPw === userRePw ? PW_MATCH_MESSAGE : PW_MISMATCH_MESSAGE

  const joinSubmit = async () => {
    // NOTE: 보안 강화는 사용자 결정에 따라 범위 밖 — 비밀번호는 기존과 동일하게 평문 전송한다.
    const res = await fetch('/api/v1/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, user_pw: userPw, e_mail: userEmail }),
    })
    const { state } = await res.json()

    if (state === STATUS_ALREADY_JOIN) {
      alert('이미 가입되어 있습니다.')
    } else if (state === STATUS_JOIN) {
      alert('가입되었습니다.')
      router.push('/')
      router.refresh()
    } else if (state === STATUS_NULL_DATA) {
      alert('null')
    }
  }

  return (
    <div className="flex justify-center">
      <div className="container max-w-sm mx-auto bg-white border-2 rounded-xl shadow-lg m-5 p-5">
        <div className="flex justify-center py-4 text-lg">회원가입</div>
        <div className="flex flex-col space-y-3 justify-items-center">
          <input
            className={INPUT_CLASS}
            id="id"
            placeholder="Enter Your ID"
            onChange={(e) => setUserId(e.target.value)}
          />
          <input
            className={INPUT_CLASS}
            id="pw"
            placeholder="Enter Your Password"
            onChange={(e) => setUserPw(e.target.value)}
          />
          <input
            className={INPUT_CLASS}
            id="repw"
            placeholder="Re Enter New Password"
            onChange={(e) => setUserRePw(e.target.value)}
          />
          <div className="text-xs text-red-500" id="pwAlarm">
            {pwAlarm}
          </div>
          <input
            className={INPUT_CLASS}
            id="email"
            placeholder="Enter Your E-Mail"
            onChange={(e) => setUserEmail(e.target.value)}
          />
          <button
            className="inline-block px-6 py-2.5 bg-green-400 text-white font-medium text-xs leading-tight rounded shadow-md hover:bg-green-700 hover:shadow-lg focus:bg-green-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-green-800 active:shadow-lg transition duration-150 ease-in-out"
            onClick={joinSubmit}
          >
            회원가입
          </button>
        </div>
      </div>
    </div>
  )
}
