'use client'

import { useRouter } from 'next/navigation'
import { hasCookie } from 'cookies-next/client'

const MENUS = [
  { label: '홈', href: '/' },
  { label: '검색', href: '/task' },
  { label: '저장된 공고', href: '/usertask' },
  { label: '오늘의 공고', href: '/todaytask' },
]

export default function Header() {
  const router = useRouter()

  // NOTE: 보안 강화는 사용자 결정에 따라 범위 밖 — 쿠키 존재 여부만 확인한다.
  const clickMenu = (href) => {
    if (hasCookie('userCookie')) {
      router.push(href)
    } else {
      alert('로그인 되어 있지 않습니다.')
    }
  }

  return (
    <div className="flex space-x-6 items-center flex-wrap bg-slate-600 px-10 py-6">
      <span className="flex items-center">
        <h1 className="text-2xl font-bold text-white mr-10">NARA-P</h1>
        {MENUS.map(({ label, href }) => (
          <button className="text-xs text-white p-2" key={href} onClick={() => clickMenu(href)}>
            {label}
          </button>
        ))}
      </span>
    </div>
  )
}
