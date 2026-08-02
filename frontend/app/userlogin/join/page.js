'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { signUp } from '@/app/actions/auth-actions'
import ActionFeedback from '@/app/userlogin/action-feedback'
import SubmitButton from '@/app/userlogin/submit-button'

const INITIAL_STATE = { ok: null }
const SIGN_UP_ERRORS = {
  'already-registered': '이미 가입된 아이디입니다.',
}

export default function JoinPage() {
  const [state, formAction] = useActionState(signUp, INITIAL_STATE)
  const [userPw, setUserPw] = useState('')
  const [userRePw, setUserRePw] = useState('')
  const hasPasswordInput = userPw !== '' || userRePw !== ''
  const passwordsMatch = userPw === userRePw

  const preventPasswordMismatch = (event) => {
    if (!passwordsMatch) {
      event.preventDefault()
    }
  }

  return (
    <div className="flex justify-center py-6 sm:py-10">
      <form className="panel" action={formAction} onSubmit={preventPasswordMismatch}>
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
              name="userId"
              autoComplete="username"
              placeholder="Enter Your ID"
              required
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="pw">
              비밀번호
            </label>
            <input
              className="input"
              id="pw"
              name="userPw"
              type="password"
              autoComplete="new-password"
              placeholder="Enter Your Password"
              value={userPw}
              onChange={(event) => setUserPw(event.target.value)}
              required
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="repw">
              비밀번호 확인
            </label>
            <input
              className="input"
              id="repw"
              name="userPwConfirm"
              type="password"
              autoComplete="new-password"
              placeholder="Re Enter New Password"
              value={userRePw}
              onChange={(event) => setUserRePw(event.target.value)}
              required
            />
            {hasPasswordInput ? (
              <p className={passwordsMatch ? 'form-hint-ok' : 'form-hint-error'}>
                {passwordsMatch ? '비밀번호가 일치합니다.' : '비밀번호가 일치하지 않습니다.'}
              </p>
            ) : null}
          </div>
          <div className="field">
            <label className="field-label" htmlFor="email">
              이메일
            </label>
            <input
              className="input"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Enter Your E-Mail"
            />
          </div>
          <ActionFeedback
            state={state}
            successMessage="회원가입이 완료되었습니다."
            errorMessages={SIGN_UP_ERRORS}
          />
          <SubmitButton
            className="btn-success btn-block mt-1"
            pendingLabel="가입 중..."
            disabled={hasPasswordInput && !passwordsMatch}
          >
            회원가입
          </SubmitButton>
          <Link className="btn-ghost btn-block" href="/">
            돌아가기
          </Link>
        </div>
      </form>
    </div>
  )
}
