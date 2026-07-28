'use client'

import { usePathname, useRouter } from 'next/navigation'
import { hasCookie } from 'cookies-next/client'

const MENUS = [
  { label: '홈', href: '/' },
  { label: '검색', href: '/task' },
  { label: '저장된 공고', href: '/usertask' },
  { label: '오늘의 공고', href: '/todaytask' },
]

// 현재 경로가 그 메뉴에 속하는지. '/' 는 완전 일치만 홈으로 본다.
function isActive(pathname, href) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href)
}

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()

  // NOTE: 보안 강화는 사용자 결정에 따라 범위 밖 — 쿠키 존재 여부만 확인한다.
  const clickMenu = (href) => {
    if (hasCookie('userCookie')) {
      router.push(href)
    } else {
      alert('로그인 되어 있지 않습니다.')
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/75 backdrop-blur-lg">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 sm:gap-6 sm:px-6 lg:px-8">
        <button
          className="flex shrink-0 cursor-pointer items-center gap-2.5"
          onClick={() => clickMenu('/')}
        >
          <span className="grid size-9 place-items-center rounded-xl bg-linear-to-br from-brand-500 to-brand-700 text-sm font-black text-white shadow-sm">
            N
          </span>
          <span className="flex flex-col items-start leading-none">
            <span className="text-base font-bold tracking-tight">NARA-P</span>
            <span className="hidden text-[0.65rem] font-medium text-ink-faint sm:block">
              나라장터 공고 검색
            </span>
          </span>
        </button>
        <nav className="no-scrollbar -mx-1 flex flex-1 items-center gap-1 overflow-x-auto px-1">
          {MENUS.map(({ label, href }) => {
            const active = isActive(pathname, href)
            return (
              <button
                className={active ? 'nav-pill nav-pill-active' : 'nav-pill'}
                key={href}
                aria-current={active ? 'page' : undefined}
                onClick={() => clickMenu(href)}
              >
                {label}
              </button>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
