import './globals.css'
import Header from '@/app/components/layout/header'
import Footer from '@/app/components/layout/footer'

export const metadata = {
  title: '나라장터 검색 웹 페이지',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        {/* 구 pages/_document.js 에서 이관 — nginx 뒤 혼합 콘텐츠 방지 */}
        <meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests" />
      </head>
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  )
}
