import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  collectCoverage: true,
  passWithNoTests: true,
  testRegex: 'tests/.*\\.test\\.ts$',
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  verbose: true,
};

export default config;
