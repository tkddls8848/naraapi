import './globals.css'
import Header from '@/app/components/layout/header'

export const metadata = {
  title: '나라장터 검색 웹 페이지',
  description: '나라장터 사전공고·본공고를 기관별로 모아 보는 검색 서비스입니다.',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  // 라이트/다크에서 모바일 브라우저 상단바 색을 배경과 맞춘다.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f8fb' },
    { media: '(prefers-color-scheme: dark)', color: '#181b22' },
  ],
}

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <Header />
        <main className="app-main">{children}</main>
        <footer className="border-t border-line/70">
          <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-1 px-4 py-6 text-sm text-ink-faint sm:flex-row sm:justify-between sm:px-6 lg:px-8">
            <p>나라장터 공개 API 기반 사업 검색 서비스</p>
            <a className="link" href="https://www.github.com/tkddls8848">
              Developed by PSI
            </a>
          </div>
        </footer>
      </body>
    </html>
  )
}
