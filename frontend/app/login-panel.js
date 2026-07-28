'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const GUEST = 'Guest'

// 서버가 process.env.STATUS_* 값을 그대로 내려주므로 기존 문자열을 그대로 유지한다.
const STATUS_WRONG_PASSWORD = 'wrong password'
const STATUS_NO_REGITERED = 'not registered user'

const BUTTON_BASE =
  'inline-block px-6 py-2.5 text-white font-medium text-xs leading-tight rounded shadow-md hover:shadow-lg focus:shadow-lg focus:outline-none focus:ring-0 active:shadow-lg transition duration-150 ease-in-out'
const BUTTON_LOGIN = `${BUTTON_BASE} bg-blue-400 hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-800`
const BUTTON_JOIN = `${BUTTON_BASE} uppercase bg-green-500 hover:bg-green-600 focus:bg-green-600 active:bg-green-700`
const BUTTON_LOGOUT = `${BUTTON_BASE} bg-green-400 hover:bg-green-700 focus:bg-green-700 active:bg-green-800`
const BUTTON_MODIFY = `${BUTTON_BASE} bg-gray-400 hover:bg-gray-700 focus:bg-gray-700 active:bg-gray-800`
const BUTTON_DELETE = `${BUTTON_BASE} bg-red-400 hover:bg-red-700 focus:bg-red-700 active:bg-red-800`

const INPUT_CLASS = 'border-solid border-2 border-gray-400 rounded-md'

export default function LoginPanel({ loginState }) {
  const [userId, setUserId] = useState('')
  const [userPw, setUserPw] = useState('')
  const router = useRouter()
  const isGuest = loginState === GUEST

  const loginSubmit = async () => {
    // NOTE: 보안 강화는 사용자 결정에 따라 범위 밖 — 비밀번호는 기존과 동일하게 평문 전송한다.
    const res = await fetch('/api/v1/login/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, user_pw: userPw }),
    })
    const { state } = await res.json()

    if (state === STATUS_WRONG_PASSWORD) {
      alert('로그인 정보가 잘못되었습니다.')
    } else if (state === STATUS_NO_REGITERED) {
      alert('가입한 정보가 없습니다.')
    } else {
      router.push('/task')
      router.refresh()
    }
  }

  const logoutSubmit = async () => {
    await fetch(`/api/v1/login/${loginState}`)
    alert('로그아웃 되었습니다.')
    router.push('/')
    router.refresh()
  }

  return (
    <div className="flex justify-center">
      <div className="container max-w-sm mx-auto bg-white border-2 rounded-xl shadow-lg m-5 p-5">
        <div className="flex flex-col space-y-2 m-4">
          <div className="flex justify-center pb-1 text-lg">조달청 검색기 NARA-P입니다.</div>
          <div className="flex justify-center pb-1 text-lg">로그인 페이지</div>
          {isGuest ? (
            <div className="flex justify-center py-1 text-sm">로그인 되어 있지 않습니다.</div>
          ) : (
            <div className="flex justify-center py-1 text-sm">{loginState}님 반갑습니다.</div>
          )}
          {isGuest ? (
            <div className="flex flex-col space-y-2">
              <input
                className={INPUT_CLASS}
                id="id"
                defaultValue={userId}
                placeholder="ID"
                onChange={(e) => setUserId(e.target.value)}
              />
              <input
                className={INPUT_CLASS}
                id="pw"
                defaultValue={userPw}
                placeholder="PW"
                onChange={(e) => setUserPw(e.target.value)}
              />
              <button className={BUTTON_LOGIN} onClick={loginSubmit}>
                로그인
              </button>
              <button className={BUTTON_JOIN} onClick={() => router.push('/userlogin/join')}>
                회원가입
              </button>
            </div>
          ) : (
            <div></div>
          )}
          {isGuest ? (
            <div></div>
          ) : (
            <div className="flex flex-col space-y-2">
              <button className={BUTTON_LOGOUT} onClick={logoutSubmit}>
                로그아웃
              </button>
              <button className={BUTTON_MODIFY} onClick={() => router.push('/userlogin/modify')}>
                정보수정
              </button>
              <button className={BUTTON_DELETE} onClick={() => router.push('/userlogin/delete')}>
                회원탈퇴
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
