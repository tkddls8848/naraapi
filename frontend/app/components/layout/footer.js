export default function Footer() {
  return (
    <footer className="border-t border-line/70">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-1 px-4 py-6 text-sm text-ink-faint sm:flex-row sm:justify-between sm:px-6 lg:px-8">
        <p>나라장터 공개 API 기반 사업 검색 서비스</p>
        <p className="flex items-center gap-1.5">
          <span>Developed by</span>
          <a className="link" href="https://www.github.com/tkddls8848">
            PSI
          </a>
        </p>
      </div>
    </footer>
  )
}
