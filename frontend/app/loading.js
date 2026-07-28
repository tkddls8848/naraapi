// 구 _app.js 의 nprogress 진행바 대체. App Router 의 useRouter 에는 router.events 가 없어
// 라우트 전환 시작을 감지할 수 없으므로, Next 가 서버 렌더를 기다리는 동안 띄워 주는
// loading 바운더리로 같은 역할(상단 얇은 진행바)을 대신한다.
export default function Loading() {
  return (
    <div
      className="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-brand-500/15"
      role="progressbar"
      aria-label="페이지를 불러오는 중"
    >
      <div className="h-full w-1/3 animate-progress rounded-full bg-linear-to-r from-brand-400 to-brand-600" />
    </div>
  )
}
