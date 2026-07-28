// Tailwind v4 는 전용 PostCSS 플러그인 하나로 동작한다. 벤더 프리픽스도 내부에서
// 처리하므로 autoprefixer 를 따로 물릴 필요가 없다.
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}

export default config
