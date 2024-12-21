/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transform: {
    '^.+\\.m?[tj]sx?$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        moduleResolution: "NodeNext"
      }
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@modelcontextprotocol|chess.js)/)',
  ],
  extensionsToTreatAsEsm: ['.ts', '.tsx', '.mts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^(\\.{1,2}/.*)\\.mjs$': '$1',
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '\\.d\\.ts$'
  ],
}; 