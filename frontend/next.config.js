/** @type {import('next').NextConfig} */
// 구 설정의 env 블록(FRONT_URL/BACK_URL 주입)은 제거했다. API가 같은 오리진의
// Route Handler로 옮겨져 절대 주소가 필요 없어졌고, .env 는 Next 기본 로더가 읽는다.
const nextConfig = {
  reactStrictMode: true,
  // 도커 런타임 스테이지에 필요한 파일만 담기 위한 설정. `node server.js` 로 기동한다.
  output: 'standalone',
}

module.exports = nextConfig
