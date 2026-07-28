import next from 'eslint-config-next/core-web-vitals'
import prettier from 'eslint-config-prettier'

const eslintConfig = [
  {
    ignores: ['.next/**', 'node_modules/**', 'public/**'],
  },
  ...next,
  prettier,
  {
    files: ['**/*.{js,jsx,mjs}'],
    rules: {
      'no-implicit-globals': 'error',
      eqeqeq: ['error', 'smart'],
      'no-var': 'error',
      'prefer-const': 'error',
      semi: ['error', 'never'],
      quotes: ['error', 'single', { avoidEscape: true }],
    },
  },
]

export default eslintConfig
