'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const GUEST = 'Guest'

// 서버가 process.env.STATUS_* 값을 그대로 내려주므로 기존 문자열을 그대로 유지한다.
const STATUS_WRONG_PASSWORD = 'wrong password'
const STATUS_NO_REGITERED = 'not registered user'

export default function LoginPanel({ loginState }) {
  const [userId, setUserId] = useState('')
  const [userPw, setUserPw] = useState('')
  const router = useRouter()
  const isGuest = loginState === GUEST

  const loginSubmit = async (e) => {
    e.preventDefault()
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
    <div className="flex justify-center py-6 sm:py-10">
      <div className="panel">
        <div className="flex flex-col items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-linear-to-br from-brand-500 to-brand-700 text-lg font-black text-white shadow-sm">
            N
          </span>
          <div>
            <h1 className="panel-title">조달청 검색기 NARA-P</h1>
            <p className="panel-caption">
              {isGuest ? '로그인 후 공고를 검색할 수 있습니다.' : `${loginState}님 반갑습니다.`}
            </p>
          </div>
        </div>

        {isGuest ? (
          <form className="mt-7 flex flex-col gap-4" onSubmit={loginSubmit}>
            <div className="field">
              <label className="field-label" htmlFor="id">
                아이디
              </label>
              <input
                className="input"
                id="id"
                autoComplete="username"
                defaultValue={userId}
                placeholder="ID"
                onChange={(e) => setUserId(e.target.value)}
              />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="pw">
                비밀번호
              </label>
              <input
                className="input"
                id="pw"
                type="password"
                autoComplete="current-password"
                defaultValue={userPw}
                placeholder="PW"
                onChange={(e) => setUserPw(e.target.value)}
              />
            </div>
            <button className="btn-primary btn-block mt-1" type="submit">
              로그인
            </button>
            <button
              className="btn-outline btn-block"
              type="button"
              onClick={() => router.push('/userlogin/join')}
            >
              회원가입
            </button>
          </form>
        ) : (
          <div className="mt-7 flex flex-col gap-3">
            <button className="btn-primary btn-block" onClick={logoutSubmit}>
              로그아웃
            </button>
            <button
              className="btn-outline btn-block"
              onClick={() => router.push('/userlogin/modify')}
            >
              정보수정
            </button>
            <button
              className="btn-ghost btn-block text-rose-600 hover:bg-rose-500/10 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
              onClick={() => router.push('/userlogin/delete')}
            >
              회원탈퇴
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
