import { format, subDays } from 'date-fns'

const SAJEON_BASE = 'http://apis.data.go.kr/1230000/HrcspSsstndrdInfoService'
const BONE_BASE = 'http://apis.data.go.kr/1230000/BidPublicInfoService03'
const DMINSTT_INFO_URL = 'http://apis.data.go.kr/1230000/UsrInfoService/getDminsttInfo'

const SAJEON_ENDPOINTS = [
  `${SAJEON_BASE}/getInsttAcctoThngListInfoThng`,
  `${SAJEON_BASE}/getInsttAcctoThngListInfoCnstwk`,
  `${SAJEON_BASE}/getInsttAcctoThngListInfoServc`,
]

// 원본 POST /bone 은 Cnstwk 가 두 번 들어가고 Thng 이 빠져 있었다(물품 공고 누락).
// 3종이 올바르게 들어있던 GET /bone/:departname 을 기준으로 맞춘다.
const BONE_ENDPOINTS = [
  `${BONE_BASE}/getBidPblancListInfoCnstwkPPSSrch`,
  `${BONE_BASE}/getBidPblancListInfoServcPPSSrch`,
  `${BONE_BASE}/getBidPblancListInfoThngPPSSrch`,
]

// 사전공고와 본공고는 기관명 파라미터 이름과 추가 파라미터가 다르다.
const NARA_KINDS = {
  sajeon: {
    endpoints: SAJEON_ENDPOINTS,
    departParam: 'rlDminsttNm',
    extraParams: {},
  },
  bone: {
    endpoints: BONE_ENDPOINTS,
    departParam: 'dminsttNm',
    extraParams: { inqryDiv: '1' },
  },
}

const NUM_OF_ROWS = '999'
const PAGE_NO = '1'
const RESPONSE_TYPE = 'json'

/**
 * @typedef {'sajeon'|'bone'} NoticeKind
 */

/**
 * @typedef {object} NormalizedNotice
 * @property {string} id 화면과 저장 계층에서 함께 쓸 수 있는 안정적인 공고 식별자
 * @property {string|null} title 공고명 또는 사전규격 품명·사업명
 * @property {string|null} departName 수요기관명
 * @property {string|null} registeredAt 공고 등록일시
 * @property {string|null} closesAt 마감일시
 * @property {string|null} fileUrl 첫 번째 첨부파일 URL
 * @property {NoticeKind} kind 사전공고 또는 본공고 구분
 * @property {boolean} isNew 어제부터 오늘까지 조회한 새 공고 여부
 * @property {object} raw 나라장터 원본 항목
 */

/**
 * @typedef {object} Dminstt
 * @property {string} name 수요기관명
 * @property {string} code 수요기관코드
 */

/**
 * SERVICE_KEY 환경변수에는 `serviceKey=...` 처럼 **`key=value` 문자열 통째로** 들어있고,
 * 그 값은 이미 URL 인코딩된 상태다. 값만 떼어내 URLSearchParams 로 재인코딩하면
 * 이중 인코딩되어 배포된 .env 가 깨지므로 쿼리스트링 앞에 원문 그대로 붙인다.
 */
function serviceKeyQuery() {
  return process.env.SERVICE_KEY ?? ''
}

function buildUrl(endpoint, params) {
  // URLSearchParams 는 공백을 '+' 로 인코딩한다. 기존 encodeURIComponent 동작(%20)을 유지한다.
  const query = new URLSearchParams(params).toString().replace(/\+/g, '%20')
  return `${endpoint}?${serviceKeyQuery()}&${query}`
}

async function fetchNaraJson(url) {
  // 외부 공고 데이터라 캐싱되면 오래된 결과가 나간다.
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) {
    throw new Error(`나라장터 API 응답 오류 ${response.status}: ${url}`)
  }
  return response.json()
}

/**
 * 원본의 `totalCount != 0 && !null` 은 `!null` 이 항상 true 라 의미가 없었다.
 * 건수가 0보다 크고 items 가 실제 배열일 때만 꺼낸다.
 */
function extractItems(payload) {
  const body = payload?.response?.body
  if (body == null) return []
  if (!(Number(body.totalCount) > 0)) return []
  return Array.isArray(body.items) ? body.items : []
}

function firstValue(item, fieldNames) {
  for (const fieldName of fieldNames) {
    const value = item[fieldName]
    if (value != null && value !== '') return String(value)
  }
  return null
}

function hashItem(item) {
  const serialized = JSON.stringify(item)
  let hash = 2166136261

  for (let index = 0; index < serialized.length; index += 1) {
    hash ^= serialized.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return (hash >>> 0).toString(36)
}

function normalizeNoticeId(item, kind) {
  if (item.bidNtceNo != null) {
    return `bone-${item.bidNtceNo}-${item.bidNtceOrd ?? ''}`
  }
  if (item.bfSpecRgstNo != null) {
    return `sajeon-${item.bfSpecRgstNo}`
  }
  if (item.refNo != null) {
    return `${kind}-ref-${item.refNo}`
  }
  return `${kind}-item-${hashItem(item)}`
}

/**
 * 업무별 원본 필드 차이는 API 경계에서 끝내 화면이 나라장터 스키마를 알지 않게 한다.
 * @param {object} item 나라장터 원본 공고
 * @param {{kind: NoticeKind, isNew: boolean}} context 조회 문맥
 * @returns {NormalizedNotice}
 */
function normalizeNotice(item, { kind, isNew }) {
  return {
    id: normalizeNoticeId(item, kind),
    title: firstValue(item, ['prdctClsfcNoNm', 'bidNtceNm', 'bsnsNm', 'bizNm']),
    departName: firstValue(item, ['rlDminsttNm', 'dminsttNm']),
    registeredAt: firstValue(item, ['rcptDt', 'bidNtceDt']),
    closesAt: firstValue(item, ['opninRgstClseDt', 'bidClseDt']),
    fileUrl: firstValue(item, ['specDocFileUrl1', 'ntceSpecDocUrl1']),
    kind,
    isNew,
    raw: item,
  }
}

function sortByRegisteredAtDesc(notices) {
  return notices.sort((a, b) => {
    if (a.registeredAt === b.registeredAt) return 0
    if (a.registeredAt == null) return 1
    if (b.registeredAt == null) return -1
    return a.registeredAt > b.registeredAt ? -1 : 1
  })
}

/**
 * 조달청이 일부 요청만 거절하는 일이 잦아 Promise.all 로는 전체가 실패했다.
 * allSettled 로 부분 실패를 허용하고 실패한 응답만 건너뛴다.
 */
async function collectNotices({ kind, urls, isNew }) {
  const results = await Promise.allSettled(urls.map((url) => fetchNaraJson(url)))
  const dataSet = []

  for (const result of results) {
    if (result.status === 'rejected') {
      console.error('나라장터 API 요청 실패 — 해당 응답은 건너뛴다.', result.reason)
      continue
    }
    for (const item of extractItems(result.value)) {
      dataSet.push(normalizeNotice(item, { kind, isNew }))
    }
  }

  return sortByRegisteredAtDesc(dataSet)
}

/**
 * 모듈 로드 시점에 한 번만 계산하면 장시간 구동 시 날짜가 갱신되지 않으므로
 * 호출(=요청 처리) 시점마다 계산한다.
 */
function defaultDateRange() {
  const now = new Date()
  return {
    beginDate: `${format(subDays(now, 1), 'yyyyMMdd')}0000`,
    endDate: `${format(now, 'yyyyMMdd')}2359`,
  }
}

function buildNoticeUrls({ kind, departName, beginDate, endDate }) {
  const { endpoints, departParam, extraParams } = NARA_KINDS[kind]
  return endpoints.map((endpoint) =>
    buildUrl(endpoint, {
      numOfRows: NUM_OF_ROWS,
      pageNo: PAGE_NO,
      ...extraParams,
      inqryBgnDt: beginDate ?? '',
      inqryEndDt: endDate ?? '',
      [departParam]: departName ?? '',
      type: RESPONSE_TYPE,
    })
  )
}

/**
 * 기관 하나를 기간으로 조회한다 (기존 GET /task/:kind/:departname).
 * @param {{kind: 'sajeon'|'bone', departName: string, beginDate: string, endDate: string}} args
 * @returns {Promise<NormalizedNotice[]>} registeredAt 내림차순 공고 배열 (isNew:false)
 */
export async function fetchNoticesByDepart({ kind, departName, beginDate, endDate }) {
  const urls = buildNoticeUrls({ kind, departName, beginDate, endDate })
  return collectNotices({ kind, urls, isNew: false })
}

/**
 * 기관 목록을 어제~오늘 범위로 한꺼번에 조회한다 (기존 POST /task/:kind).
 * @param {{kind: 'sajeon'|'bone', departList: string[]}} args
 * @returns {Promise<NormalizedNotice[]>} registeredAt 내림차순 공고 배열 (isNew:true)
 */
export async function fetchNoticesForDepartList({ kind, departList }) {
  const { beginDate, endDate } = defaultDateRange()
  const urls = (departList ?? []).flatMap((departName) =>
    buildNoticeUrls({ kind, departName, beginDate, endDate })
  )
  return collectNotices({ kind, urls, isNew: true })
}

/**
 * 이름으로 수요기관 목록을 조회한다.
 * @param {string} searchTerm 수요기관명 검색어
 * @returns {Promise<Dminstt[]>} 구조화된 수요기관 배열. 검색어가 없거나 실패하면 빈 배열.
 */
export async function fetchDminsttList(searchTerm) {
  const dminsttNm = String(searchTerm ?? '').trim()
  if (dminsttNm === '') return []

  const url = buildUrl(DMINSTT_INFO_URL, {
    numOfRows: NUM_OF_ROWS,
    pageNo: PAGE_NO,
    dminsttNm,
    inqryDiv: '1',
    type: RESPONSE_TYPE,
  })

  try {
    const payload = await fetchNaraJson(url)
    const items = payload?.response?.body?.items
    if (!Array.isArray(items)) return []
    return items
      .map((item) => ({
        name: String(item.dminsttNm ?? '').trim(),
        code: String(item.dminsttCd ?? '').trim(),
      }))
      .filter(({ name, code }) => name !== '' && code !== '')
  } catch (err) {
    // 원본도 실패 시 빈 배열을 반환했다.
    console.error('나라장터 수요기관 목록 조회 실패', err)
    return []
  }
}
