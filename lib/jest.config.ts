import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.test.ts'],
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 30,
      lines: 20,
      statements: 20,
    },
  },
  passWithNoTests: true,
  testRegex: '(tests|src)/.*\\.test\\.ts$',
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  verbose: true,
};

export default config;
