import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex justify-center py-10">
      <div className="panel text-center">
        <p className="text-5xl font-black tracking-tight text-brand-500/40">404</p>
        <h1 className="panel-title mt-3">요청한 페이지를 찾을 수 없습니다.</h1>
        <p className="panel-caption">주소가 바뀌었거나 삭제된 페이지일 수 있습니다.</p>
        <Link className="btn-primary btn-block mt-6" href="/">
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  )
}
