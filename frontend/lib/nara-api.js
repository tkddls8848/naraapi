import { format, subDays } from 'date-fns'

const DMINSTT_INFO_URL = 'http://apis.data.go.kr/1230000/UsrInfoService/getDminsttInfo'

const NARA_KINDS = {
  sajeon: {
    endpoints: [
      'http://apis.data.go.kr/1230000/HrcspSsstndrdInfoService/getInsttAcctoThngListInfoThng',
      'http://apis.data.go.kr/1230000/HrcspSsstndrdInfoService/getInsttAcctoThngListInfoCnstwk',
      'http://apis.data.go.kr/1230000/HrcspSsstndrdInfoService/getInsttAcctoThngListInfoServc',
    ],
    departParam: 'rlDminsttNm',
    extraParams: {},
  },
  bone: {
    endpoints: [
      'http://apis.data.go.kr/1230000/BidPublicInfoService03/getBidPblancListInfoCnstwkPPSSrch',
      'http://apis.data.go.kr/1230000/BidPublicInfoService03/getBidPblancListInfoServcPPSSrch',
      'http://apis.data.go.kr/1230000/BidPublicInfoService03/getBidPblancListInfoThngPPSSrch',
    ],
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
 */

/**
 * @typedef {object} Dminstt
 * @property {string} name 수요기관명
 * @property {string} code 수요기관코드
 */

function buildUrl(endpoint, params) {
  const query = new URLSearchParams(params).toString().replace(/\+/g, '%20')
  return `${endpoint}?${process.env.SERVICE_KEY}&${query}`
}

async function fetchNaraJson(url) {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) {
    throw new Error(`나라장터 API 응답 오류 ${response.status}: ${url}`)
  }
  return response.json()
}

function extractItems(payload) {
  const items = payload?.response?.body?.items
  return Array.isArray(items) ? items : []
}

function firstValue(item, fieldNames) {
  for (const fieldName of fieldNames) {
    const value = item[fieldName]
    if (value != null && value !== '') return String(value)
  }
  return null
}

function normalizeNoticeId(item, kind) {
  return kind === 'bone'
    ? `bone-${item.bidNtceNo}-${item.bidNtceOrd}`
    : `sajeon-${item.bfSpecRgstNo}`
}

/**
 * 업무별 원본 필드 차이는 API 경계에서 끝내 화면이 나라장터 스키마를 알지 않게 한다.
 * @param {object} item 나라장터 원본 공고
 * @param {NoticeKind} kind 공고 구분
 * @returns {NormalizedNotice}
 */
function normalizeNotice(item, kind) {
  return {
    id: normalizeNoticeId(item, kind),
    title: firstValue(item, ['prdctClsfcNoNm', 'bidNtceNm', 'bsnsNm', 'bizNm']),
    departName: firstValue(item, ['rlDminsttNm', 'dminsttNm']),
    registeredAt: firstValue(item, ['rcptDt', 'bidNtceDt']),
    closesAt: firstValue(item, ['opninRgstClseDt', 'bidClseDt']),
    fileUrl: firstValue(item, ['specDocFileUrl1', 'ntceSpecDocUrl1']),
    kind,
  }
}

function sortByRegisteredAtDesc(notices) {
  return notices.sort((a, b) => b.registeredAt.localeCompare(a.registeredAt))
}

async function collectNotices({ kind, urls }) {
  const responses = await Promise.all(urls.map((url) => fetchNaraJson(url)))
  const notices = responses.flatMap((payload) =>
    extractItems(payload).map((item) => normalizeNotice(item, kind))
  )
  return sortByRegisteredAtDesc(notices)
}

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
      inqryBgnDt: beginDate,
      inqryEndDt: endDate,
      [departParam]: departName,
      type: RESPONSE_TYPE,
    })
  )
}

/**
 * 기관 하나를 기간으로 조회한다.
 * @param {{kind: 'sajeon'|'bone', departName: string, beginDate: string, endDate: string}} args
 * @returns {Promise<NormalizedNotice[]>} registeredAt 내림차순 공고 배열
 */
export async function fetchNoticesByDepart({ kind, departName, beginDate, endDate }) {
  const urls = buildNoticeUrls({ kind, departName, beginDate, endDate })
  return collectNotices({ kind, urls })
}

/**
 * 기관 목록을 어제~오늘 범위로 한꺼번에 조회한다.
 * @param {{kind: 'sajeon'|'bone', departList: string[]}} args
 * @returns {Promise<NormalizedNotice[]>} registeredAt 내림차순 공고 배열
 */
export async function fetchNoticesForDepartList({ kind, departList }) {
  const { beginDate, endDate } = defaultDateRange()
  const urls = departList.flatMap((departName) =>
    buildNoticeUrls({ kind, departName, beginDate, endDate })
  )
  return collectNotices({ kind, urls })
}

/**
 * 이름으로 수요기관 목록을 조회한다.
 * @param {string} searchTerm 수요기관명 검색어
 * @returns {Promise<Dminstt[]>} 구조화된 수요기관 배열
 */
export async function fetchDminsttList(searchTerm) {
  const url = buildUrl(DMINSTT_INFO_URL, {
    numOfRows: NUM_OF_ROWS,
    pageNo: PAGE_NO,
    dminsttNm: searchTerm,
    inqryDiv: '1',
    type: RESPONSE_TYPE,
  })

  const payload = await fetchNaraJson(url)
  return extractItems(payload).map((item) => ({
    name: item.dminsttNm,
    code: item.dminsttCd,
  }))
}
