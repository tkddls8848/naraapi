'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { updateAccount } from '@/app/actions/auth-actions'
import { ActionFeedback, SubmitButton } from '@/app/userlogin/form-controls'

export default function ModifyForm({ userId }) {
  const [state, formAction] = useActionState(updateAccount, null)
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
        <h1 className="panel-title">회원정보 수정</h1>
        <p className="panel-caption">비밀번호와 이메일을 바꿀 수 있습니다.</p>
        <div className="mt-7 flex flex-col gap-4">
          <div className="field">
            <label className="field-label" htmlFor="id">
              아이디
            </label>
            <input className="input" id="id" defaultValue={userId} disabled />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="pw">
              새 비밀번호
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
              새 비밀번호 확인
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
          <ActionFeedback state={state} successMessage="회원정보를 수정했습니다." />
          <SubmitButton
            className="btn-primary btn-block mt-1"
            pendingLabel="수정 중..."
            disabled={hasPasswordInput && !passwordsMatch}
          >
            정보수정
          </SubmitButton>
          <Link className="btn-ghost btn-block" href="/">
            돌아가기
          </Link>
        </div>
      </form>
    </div>
  )
}
