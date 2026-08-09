'use client'

import { useFormStatus } from 'react-dom'

export function ActionFeedback({ state, successMessage, errorMessages = {} }) {
  const isError = state?.ok === false
  const message = isError
    ? (errorMessages[state.reason] ?? '요청을 처리하지 못했습니다. 다시 시도해 주세요.')
    : state?.ok
      ? successMessage
      : null

  if (!message) return null

  return (
    <p
      className={isError ? 'form-hint-error' : 'form-hint-ok'}
      role={isError ? 'alert' : 'status'}
      aria-live="polite"
    >
      {message}
    </p>
  )
}

export function SubmitButton({ children, className, pendingLabel, disabled = false }) {
  const { pending } = useFormStatus()

  return (
    <button className={className} type="submit" disabled={disabled || pending}>
      {pending ? pendingLabel : children}
    </button>
  )
}
