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
