'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const MENUS = [
  { label: '홈', href: '/' },
  { label: '검색', href: '/task' },
  { label: '저장된 공고', href: '/usertask' },
  { label: '오늘의 공고', href: '/todaytask' },
]

// 현재 경로가 그 메뉴에 속하는지 확인한다. '/'는 완전히 일치할 때만 홈으로 본다.
function isActive(pathname, href) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href)
}

export default function Header() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/75 backdrop-blur-lg">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 sm:gap-6 sm:px-6 lg:px-8">
        <Link className="flex shrink-0 items-center gap-2.5" href="/" aria-label="NARA-P 홈">
          <span className="grid size-9 place-items-center rounded-xl bg-linear-to-br from-brand-500 to-brand-700 text-sm font-black text-white shadow-sm">
            N
          </span>
          <span className="flex flex-col items-start leading-none">
            <span className="text-base font-bold tracking-tight">NARA-P</span>
            <span className="hidden text-[0.65rem] font-medium text-ink-faint sm:block">
              나라장터 공고 검색
            </span>
          </span>
        </Link>
        <nav className="no-scrollbar -mx-1 flex flex-1 items-center gap-1 overflow-x-auto px-1">
          {MENUS.map(({ label, href }) => {
            const active = isActive(pathname, href)
            return (
              <Link
                className={active ? 'nav-pill nav-pill-active' : 'nav-pill'}
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
              >
                {label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
