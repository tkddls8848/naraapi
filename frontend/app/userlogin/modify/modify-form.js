'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const PW_MATCH_MESSAGE = '확인되었습니다.'
const PW_MISMATCH_MESSAGE = '비밀번호 입력이 잘못되었습니다.'

export default function ModifyForm({ userId }) {
  const [userPw, setUserPw] = useState('')
  // 최초 렌더에서 '' !== undefined 라 안내문이 뜨던 기존 동작을 그대로 유지한다.
  const [userRePw, setUserRePw] = useState()
  const [userEmail, setUserEmail] = useState('')
  const router = useRouter()

  const pwInputCheck = userPw === userRePw
  const pwAlarm = pwInputCheck ? PW_MATCH_MESSAGE : PW_MISMATCH_MESSAGE

  const modifySubmit = async (e) => {
    e.preventDefault()
    if (!pwInputCheck) {
      alert(PW_MISMATCH_MESSAGE)
      return
    }
    // NOTE: 보안 강화는 사용자 결정에 따라 범위 밖 — 비밀번호는 기존과 동일하게 평문 전송한다.
    await fetch('/api/v1/login', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, user_pw: userPw, e_mail: userEmail }),
    })
    router.push('/')
    router.refresh()
  }

  return (
    <div className="flex justify-center py-6 sm:py-10">
      <form className="panel" onSubmit={modifySubmit}>
        <h1 className="panel-title">회원정보 수정</h1>
        <p className="panel-caption">비밀번호와 이메일을 바꿀 수 있습니다.</p>
        <div className="mt-7 flex flex-col gap-4">
          <div className="field">
            <label className="field-label" htmlFor="id">
              아이디
            </label>
            <input
              className="input"
              id="id"
              defaultValue={userId}
              placeholder="Enter Your ID"
              disabled
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="pw">
              새 비밀번호
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
              새 비밀번호 확인
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
          <button className="btn-primary btn-block mt-1" type="submit">
            정보수정
          </button>
          <button className="btn-ghost btn-block" type="button" onClick={() => router.push('/')}>
            돌아가기
          </button>
        </div>
      </form>
    </div>
  )
}
