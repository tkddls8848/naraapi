'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect } from 'react'
import { signIn, signOut } from '@/app/actions/auth-actions'
import ActionFeedback from '@/app/userlogin/action-feedback'
import SubmitButton from '@/app/userlogin/submit-button'

const GUEST = 'Guest'
const INITIAL_STATE = { ok: null }

const LOGIN_ERRORS = {
  'wrong-password': '로그인 정보가 올바르지 않습니다.',
  'not-registered': '가입한 계정을 찾을 수 없습니다.',
}

export default function LoginPanel({ loginState }) {
  const router = useRouter()
  const [signInState, signInAction] = useActionState(signIn, INITIAL_STATE)
  const [signOutState, signOutAction] = useActionState(signOut, INITIAL_STATE)
  const isGuest = loginState === GUEST || signOutState?.ok === true
  const signedIn = signInState?.ok === true

  useEffect(() => {
    if (signedIn) {
      router.push('/task')
      router.refresh()
    }
  }, [router, signedIn])

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

        {signOutState?.ok === true ? (
          <div className="mt-4">
            <ActionFeedback state={signOutState} successMessage="로그아웃했습니다." />
          </div>
        ) : null}

        {isGuest ? (
          <form className="mt-7 flex flex-col gap-4" action={signInAction}>
            <div className="field">
              <label className="field-label" htmlFor="id">
                아이디
              </label>
              <input
                className="input"
                id="id"
                name="userId"
                autoComplete="username"
                placeholder="ID"
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
                autoComplete="current-password"
                placeholder="PW"
                required
              />
            </div>
            <ActionFeedback state={signInState} errorMessages={LOGIN_ERRORS} />
            <SubmitButton className="btn-primary btn-block mt-1" pendingLabel="로그인 중...">
              로그인
            </SubmitButton>
            <Link className="btn-outline btn-block" href="/userlogin/join">
              회원가입
            </Link>
          </form>
        ) : (
          <div className="mt-7 flex flex-col gap-3">
            <form action={signOutAction}>
              <SubmitButton className="btn-primary btn-block" pendingLabel="로그아웃 중...">
                로그아웃
              </SubmitButton>
            </form>
            <Link className="btn-outline btn-block" href="/userlogin/modify">
              정보수정
            </Link>
            <Link
              className="btn-ghost btn-block text-rose-600 hover:bg-rose-500/10 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
              href="/userlogin/delete"
            >
              회원탈퇴
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
