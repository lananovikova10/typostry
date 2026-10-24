const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// ESM-only packages (the unified/remark/rehype ecosystem and friends) that must be transformed
const esmPackages = [
  'unified',
  'bail',
  'devlop',
  'is-plain-obj',
  'trough',
  'vfile.*',
  'unist-.*',
  'mdast-.*',
  'micromark.*',
  'remark-.*',
  'rehype-.*',
  'hast-.*',
  'hastscript',
  'property-information',
  'space-separated-tokens',
  'comma-separated-tokens',
  'html-void-elements',
  'web-namespaces',
  'zwitch',
  'stringify-entities',
  'character-entities.*',
  'character-reference-invalid',
  'decode-named-character-reference',
  'is-alphabetical',
  'is-alphanumerical',
  'is-decimal',
  'is-hexadecimal',
  'ccount',
  'escape-string-regexp',
  'markdown-table',
  'longest-streak',
  'trim-lines',
  'parse-entities',
  'katex',
  'shiki',
  '@shikijs',
  'frimousse',
  '@t3-oss',
]

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    // Handle module aliases
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/cypress/'],
}

// next/jest always prepends its own '/node_modules/' ignore pattern, which would
// stop the ESM packages above from being transformed, so replace it afterwards.
// The optional .pnpm segment keeps this working with pnpm's nested layout.
module.exports = async () => {
  const config = await createJestConfig(customJestConfig)()
  config.transformIgnorePatterns = [
    `/node_modules/(?!(\\.pnpm|${esmPackages.join('|')})(@|/))`,
    '^.+\\.module\\.(css|sass|scss)$',
  ]
  return config
}
