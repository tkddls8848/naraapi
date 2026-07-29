import './globals.css'
import Header from '@/app/components/layout/header'
import Footer from '@/app/components/layout/footer'

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
      <head>
        {/* TLS 종단이 앞단(프로바이더)에 있어 앱은 http 로 듣는다. 혼합 콘텐츠 방지용으로 유지한다. */}
        <meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests" />
      </head>
      <body>
        <Header />
        <main className="app-main">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
