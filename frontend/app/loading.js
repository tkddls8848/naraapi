// 구 _app.js 의 nprogress 진행바 대체. App Router 의 useRouter 에는 router.events 가 없어
// 라우트 전환 시작을 감지할 수 없으므로, Next 가 서버 렌더를 기다리는 동안 띄워 주는
// loading 바운더리로 같은 역할(상단 얇은 진행바)을 대신한다.
export default function Loading() {
  return <div className="fixed top-0 left-0 z-50 h-0.5 w-full animate-pulse bg-blue-500" />
}
