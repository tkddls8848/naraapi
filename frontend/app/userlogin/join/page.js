'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// 서버가 process.env.STATUS_* 값을 그대로 내려주므로 기존 문자열을 그대로 유지한다.
const STATUS_ALREADY_JOIN = 'already join user'
const STATUS_JOIN = 'join user'
const STATUS_NULL_DATA = 'null data'

const PW_MATCH_MESSAGE = '확인되었습니다.'
const PW_MISMATCH_MESSAGE = '비밀번호 입력이 잘못되었습니다.'

export default function Join() {
  const [userId, setUserId] = useState('')
  const [userPw, setUserPw] = useState('')
  // 최초 렌더에서 '' !== undefined 라 안내문이 뜨던 기존 동작을 그대로 유지한다.
  const [userRePw, setUserRePw] = useState()
  const [userEmail, setUserEmail] = useState('')
  const router = useRouter()

  const pwInputCheck = userPw === userRePw
  const pwAlarm = pwInputCheck ? PW_MATCH_MESSAGE : PW_MISMATCH_MESSAGE

  const joinSubmit = async (e) => {
    e.preventDefault()
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
    <div className="flex justify-center py-6 sm:py-10">
      <form className="panel" onSubmit={joinSubmit}>
        <h1 className="panel-title">회원가입</h1>
        <p className="panel-caption">공고 저장 기능을 쓰려면 계정이 필요합니다.</p>
        <div className="mt-7 flex flex-col gap-4">
          <div className="field">
            <label className="field-label" htmlFor="id">
              아이디
            </label>
            <input
              className="input"
              id="id"
              autoComplete="username"
              placeholder="Enter Your ID"
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
              autoComplete="new-password"
              placeholder="Enter Your Password"
              onChange={(e) => setUserPw(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="repw">
              비밀번호 확인
            </label>
            <input
              className="input"
              id="repw"
              type="password"
              autoComplete="new-password"
              placeholder="Re Enter New Password"
              onChange={(e) => setUserRePw(e.target.value)}
            />
            <div className={pwInputCheck ? 'form-hint-ok' : 'form-hint-error'} id="pwAlarm">
              {pwAlarm}
            </div>
          </div>
          <div className="field">
            <label className="field-label" htmlFor="email">
              이메일
            </label>
            <input
              className="input"
              id="email"
              type="email"
              autoComplete="email"
              placeholder="Enter Your E-Mail"
              onChange={(e) => setUserEmail(e.target.value)}
            />
          </div>
          <button className="btn-success btn-block mt-1" type="submit">
            회원가입
          </button>
          <button className="btn-ghost btn-block" type="button" onClick={() => router.push('/')}>
            돌아가기
          </button>
        </div>
      </form>
    </div>
  )
}
