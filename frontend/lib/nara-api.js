import { format, subDays, subYears } from 'date-fns'

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

// FIXME: 기관 목록 조회가 요청의 쿼리 파라미터를 무시하고 이 기관명으로만 조회한다.
// 원작자의 의도가 불명확해 동작은 그대로 두고 상수로만 끌어올렸다.
const DMINSTT_LIST_FIXED_NAME = '사회보장정보원'
const DMINSTT_LIST_YEARS_BACK = 100

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

function sortByRcptDtDesc(notices) {
  return notices.sort((a, b) => (a.rcptDt > b.rcptDt ? -1 : a.rcptDt < b.rcptDt ? 1 : 0))
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
      dataSet.push({ ...item, type: kind, isNew })
    }
  }

  return sortByRcptDtDesc(dataSet)
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
 * @returns {Promise<Array<object>>} rcptDt 내림차순 공고 배열 (isNew:false)
 */
export async function fetchNoticesByDepart({ kind, departName, beginDate, endDate }) {
  const urls = buildNoticeUrls({ kind, departName, beginDate, endDate })
  return collectNotices({ kind, urls, isNew: false })
}

/**
 * 기관 목록을 어제~오늘 범위로 한꺼번에 조회한다 (기존 POST /task/:kind).
 * @param {{kind: 'sajeon'|'bone', departList: string[]}} args
 * @returns {Promise<Array<object>>} rcptDt 내림차순 공고 배열 (isNew:true)
 */
export async function fetchNoticesForDepartList({ kind, departList }) {
  const { beginDate, endDate } = defaultDateRange()
  const urls = (departList ?? []).flatMap((departName) =>
    buildNoticeUrls({ kind, departName, beginDate, endDate })
  )
  return collectNotices({ kind, urls, isNew: true })
}

/**
 * 수요기관 목록 조회 (기존 GET /list).
 * @returns {Promise<string[]>} `기관명||기관코드` 문자열 배열. 실패하면 빈 배열.
 */
export async function fetchDminsttList() {
  const now = new Date()
  const url = buildUrl(DMINSTT_INFO_URL, {
    numOfRows: NUM_OF_ROWS,
    pageNo: PAGE_NO,
    dminsttNm: DMINSTT_LIST_FIXED_NAME,
    inqryBgnDt: `${format(subYears(now, DMINSTT_LIST_YEARS_BACK), 'yyyyMMdd')}0000`,
    inqryEndDt: `${format(now, 'yyyyMMdd')}0000`,
    inqryDiv: '1',
    type: RESPONSE_TYPE,
  })

  try {
    const payload = await fetchNaraJson(url)
    const items = payload?.response?.body?.items
    if (!Array.isArray(items)) return []
    return items.map((item) => `${item.dminsttNm}||${item.dminsttCd}`)
  } catch (err) {
    // 원본도 실패 시 빈 배열을 반환했다.
    console.error('나라장터 수요기관 목록 조회 실패', err)
    return []
  }
}

/**
 * 공고번호 필드가 종류마다 다르다. 본공고는 같은 번호가 차수별로 반복되므로 차수까지 묶는다.
 * @param {object} notice 공고 항목
 * @param {string|number} index 위 필드가 모두 없을 때 쓰는 폴백 식별자
 * @returns {string} React key
 */
export function noticeKey(notice, index) {
  if (notice.bidNtceNo != null) {
    return `bone-${notice.bidNtceNo}-${notice.bidNtceOrd ?? ''}`
  }
  if (notice.bfSpecRgstNo != null) {
    return `sajeon-${notice.bfSpecRgstNo}`
  }
  if (notice.refNo != null) {
    return `ref-${notice.refNo}`
  }
  return `notice-${index}`
}
