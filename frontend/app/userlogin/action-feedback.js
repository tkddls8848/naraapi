export default function ActionFeedback({ state, successMessage, errorMessages = {} }) {
  let message = null
  let isError = false

  if (state?.ok === true) {
    message = successMessage
  } else if (state?.ok === false) {
    message = errorMessages[state.reason] ?? '요청을 처리하지 못했습니다. 다시 시도해 주세요.'
    isError = true
  }

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
