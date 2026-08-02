import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import NoData from '@/app/components/common/no-data'
import { fetchDminsttList } from '@/lib/nara-api'

export const dynamic = 'force-dynamic'

function searchText(value) {
  const firstValue = Array.isArray(value) ? value[0] : value
  return String(firstValue ?? '').trim()
}

export default async function ListPage({ searchParams }) {
  const { query } = await searchParams
  const searchTerm = searchText(query)
  const lists = searchTerm === '' ? [] : await fetchDminsttList(searchTerm)

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">수요기관 검색</h1>
        <p className="page-subtitle">나라장터에 등록된 수요기관 이름과 코드를 조회합니다.</p>
      </div>

      <form className="toolbar" action="/list" method="get">
        <div className="toolbar-row">
          <div className="field flex-1">
            <label className="field-label" htmlFor="dminstt-query">
              기관명
            </label>
            <input
              className="input"
              id="dminstt-query"
              name="query"
              defaultValue={searchTerm}
              placeholder="예) 사회보장정보원"
            />
          </div>
          <button className="btn-primary" type="submit">
            <MagnifyingGlassIcon className="size-4" aria-hidden="true" />
            검색
          </button>
        </div>
      </form>

      {searchTerm === '' ? (
        <NoData
          message="검색할 기관명을 입력해 주세요."
          hint="기관명의 일부만 입력해도 검색할 수 있습니다."
        />
      ) : lists.length > 0 ? (
        <section aria-labelledby="dminstt-result-heading">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold tracking-tight" id="dminstt-result-heading">
              검색 결과
            </h2>
            <span className="badge-brand">{lists.length}곳</span>
          </div>
          <ul className="surface-card divide-y divide-line overflow-hidden rounded-2xl px-5">
            {lists.map((list) => (
              <li
                className="flex flex-wrap items-center justify-between gap-2 py-3"
                key={list.code}
              >
                <span className="font-medium text-ink">{list.name}</span>
                <span className="text-sm text-ink-soft">기관코드 {list.code}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <NoData
          message={`“${searchTerm}” 검색 결과가 없습니다.`}
          hint="기관명을 확인한 뒤 다시 검색해 주세요."
        />
      )}
    </div>
  )
}
