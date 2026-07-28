import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'

// 공고 첨부 링크. API 가 URL 을 안 내려주는 건도 있어 그때는 링크 대신 안내만 남긴다.
export default function DownloadLink({ href, label = '다운로드' }) {
  if (!href) {
    return <span className="text-ink-faint">없음</span>
  }

  return (
    <a className="link inline-flex items-center gap-1" href={href} target="_blank" rel="noreferrer">
      <ArrowDownTrayIcon className="size-3.5 shrink-0" aria-hidden="true" />
      {label}
    </a>
  )
}
