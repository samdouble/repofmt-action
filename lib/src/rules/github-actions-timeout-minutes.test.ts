import type { getOctokit } from '@actions/github';
import { githubActionsTimeoutMinutes } from './github-actions-timeout-minutes';
import { RuleContext } from '../utils/context';

const mockGetContent = jest.fn();
const mockOctokit = {
  rest: {
    repos: {
      getContent: mockGetContent,
    },
  },
} as unknown as ReturnType<typeof getOctokit>;

const mockRepository = {
  owner: { login: 'test-owner' },
  name: 'test-repo',
  full_name: 'test-owner/test-repo',
} as ConstructorParameters<typeof RuleContext>[1];

describe('githubActionsTimeoutMinutes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when workflows directory does not exist', () => {
    it('should return no errors', async () => {
      mockGetContent.mockRejectedValue(new Error('Not found'));

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await githubActionsTimeoutMinutes(context, {});
      expect(result).toEqual({ errors: [] });
    });
  });

  describe('when workflows directory is empty', () => {
    it('should return no errors', async () => {
      mockGetContent.mockResolvedValue({ data: [] });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await githubActionsTimeoutMinutes(context, {});
      expect(result).toEqual({ errors: [] });
    });
  });

  describe('when all jobs have timeout-minutes', () => {
    it('should return no errors', async () => {
      mockGetContent.mockImplementation(({ path }) => {
        if (path === '.github/workflows') {
          return Promise.resolve({
            data: [{ name: 'ci.yml', type: 'file' }],
          });
        }
        if (path === '.github/workflows/ci.yml') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from(`
name: CI
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
`).toString('base64'),
            },
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await githubActionsTimeoutMinutes(context, {});
      expect(result).toEqual({ errors: [] });
    });
  });

  describe('when a job is missing timeout-minutes', () => {
    it('should return an error for the job', async () => {
      mockGetContent.mockImplementation(({ path }) => {
        if (path === '.github/workflows') {
          return Promise.resolve({
            data: [{ name: 'ci.yml', type: 'file' }],
          });
        }
        if (path === '.github/workflows/ci.yml') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from(`
name: CI
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
`).toString('base64'),
            },
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await githubActionsTimeoutMinutes(context, {});
      expect(result).toEqual({
        errors: ['.github/workflows/ci.yml: job "build" is missing timeout-minutes'],
      });
    });
  });

  describe('when multiple jobs are missing timeout-minutes', () => {
    it('should return errors for each job', async () => {
      mockGetContent.mockImplementation(({ path }) => {
        if (path === '.github/workflows') {
          return Promise.resolve({
            data: [{ name: 'ci.yml', type: 'file' }],
          });
        }
        if (path === '.github/workflows/ci.yml') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from(`
name: CI
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
  test:
    runs-on: ubuntu-latest
    steps:
      - run: npm test
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - run: npm run deploy
`).toString('base64'),
            },
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await githubActionsTimeoutMinutes(context, {});
      expect(result.errors).toHaveLength(2);
      expect(result.errors).toContain('.github/workflows/ci.yml: job "build" is missing timeout-minutes');
      expect(result.errors).toContain('.github/workflows/ci.yml: job "test" is missing timeout-minutes');
    });
  });

  describe('when there are multiple workflow files', () => {
    it('should check all workflow files', async () => {
      mockGetContent.mockImplementation(({ path }) => {
        if (path === '.github/workflows') {
          return Promise.resolve({
            data: [
              { name: 'ci.yml', type: 'file' },
              { name: 'release.yaml', type: 'file' },
            ],
          });
        }
        if (path === '.github/workflows/ci.yml') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from(`
name: CI
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
`).toString('base64'),
            },
          });
        }
        if (path === '.github/workflows/release.yaml') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from(`
name: Release
on: release
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - run: npm publish
`).toString('base64'),
            },
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await githubActionsTimeoutMinutes(context, {});
      expect(result.errors).toHaveLength(2);
      expect(result.errors).toContain('.github/workflows/ci.yml: job "build" is missing timeout-minutes');
      expect(result.errors).toContain('.github/workflows/release.yaml: job "publish" is missing timeout-minutes');
    });
  });

  describe('when workflow has no jobs', () => {
    it('should return no errors', async () => {
      mockGetContent.mockImplementation(({ path }) => {
        if (path === '.github/workflows') {
          return Promise.resolve({
            data: [{ name: 'ci.yml', type: 'file' }],
          });
        }
        if (path === '.github/workflows/ci.yml') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from(`
name: CI
on: push
`).toString('base64'),
            },
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await githubActionsTimeoutMinutes(context, {});
      expect(result).toEqual({ errors: [] });
    });
  });

  describe('when workflow file contains invalid YAML', () => {
    it('should return a YAML parsing error', async () => {
      mockGetContent.mockImplementation(({ path }) => {
        if (path === '.github/workflows') {
          return Promise.resolve({
            data: [{ name: 'ci.yml', type: 'file' }],
          });
        }
        if (path === '.github/workflows/ci.yml') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from(`
name: CI
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps: [
      invalid yaml here
`).toString('base64'),
            },
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await githubActionsTimeoutMinutes(context, {});
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatch(/\.github\/workflows\/ci\.yml: failed to parse YAML:/);
    });
  });

  describe('caching', () => {
    it('should cache workflow directory contents', async () => {
      mockGetContent.mockImplementation(({ path }) => {
        if (path === '.github/workflows') {
          return Promise.resolve({
            data: [{ name: 'ci.yml', type: 'file' }],
          });
        }
        if (path === '.github/workflows/ci.yml') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from(`
name: CI
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
`).toString('base64'),
            },
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      await githubActionsTimeoutMinutes(context, {});
      await githubActionsTimeoutMinutes(context, {});

      // once for workflows directory, once for ci.yml file
      expect(mockGetContent).toHaveBeenCalledTimes(2);
    });
  });

  describe('when workflows directory contains non-yaml files', () => {
    it('should ignore non-yaml files', async () => {
      mockGetContent.mockImplementation(({ path }) => {
        if (path === '.github/workflows') {
          return Promise.resolve({
            data: [
              { name: 'ci.yml', type: 'file' },
              { name: 'README.md', type: 'file' },
              { name: 'scripts', type: 'dir' },
            ],
          });
        }
        if (path === '.github/workflows/ci.yml') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from(`
name: CI
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
`).toString('base64'),
            },
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await githubActionsTimeoutMinutes(context, {});
      expect(result).toEqual({ errors: [] });
      // once for workflows directory, once for ci.yml file
      expect(mockGetContent).toHaveBeenCalledTimes(2);
    });
  });

  describe('when maximum option is provided', () => {
    it('should pass when timeout is lower than max', async () => {
      mockGetContent.mockImplementation(({ path }) => {
        if (path === '.github/workflows') {
          return Promise.resolve({
            data: [{ name: 'ci.yml', type: 'file' }],
          });
        }
        if (path === '.github/workflows/ci.yml') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from(`
name: CI
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
`).toString('base64'),
            },
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await githubActionsTimeoutMinutes(context, {
        maximum: 30,
      });
      expect(result).toEqual({ errors: [] });
    });

    it('should pass when timeout equals max', async () => {
      mockGetContent.mockImplementation(({ path }) => {
        if (path === '.github/workflows') {
          return Promise.resolve({
            data: [{ name: 'ci.yml', type: 'file' }],
          });
        }
        if (path === '.github/workflows/ci.yml') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from(`
name: CI
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
`).toString('base64'),
            },
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await githubActionsTimeoutMinutes(context, {
        maximum: 30,
      });
      expect(result).toEqual({ errors: [] });
    });

    it('should fail when timeout is greater than max', async () => {
      mockGetContent.mockImplementation(({ path }) => {
        if (path === '.github/workflows') {
          return Promise.resolve({
            data: [{ name: 'ci.yml', type: 'file' }],
          });
        }
        if (path === '.github/workflows/ci.yml') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from(`
name: CI
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 60
    steps:
      - uses: actions/checkout@v4
`).toString('base64'),
            },
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await githubActionsTimeoutMinutes(context, {
        maximum: 30,
      });
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe(
        '.github/workflows/ci.yml: job "build" has timeout-minutes (60) that is higher than 30',
      );
    });

    it('should check multiple jobs against max', async () => {
      mockGetContent.mockImplementation(({ path }) => {
        if (path === '.github/workflows') {
          return Promise.resolve({
            data: [{ name: 'ci.yml', type: 'file' }],
          });
        }
        if (path === '.github/workflows/ci.yml') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from(`
name: CI
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 45
    steps:
      - run: npm test
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - run: npm run deploy
`).toString('base64'),
            },
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await githubActionsTimeoutMinutes(context, {
        maximum: 30,
      });
      expect(result.errors).toHaveLength(1);
      expect(result.errors).toContain(
        '.github/workflows/ci.yml: job "test" has timeout-minutes (45) that is higher than 30',
      );
    });

    it('should still check for missing timeout-minutes when maxTimeoutMinutes is provided', async () => {
      mockGetContent.mockImplementation(({ path }) => {
        if (path === '.github/workflows') {
          return Promise.resolve({
            data: [{ name: 'ci.yml', type: 'file' }],
          });
        }
        if (path === '.github/workflows/ci.yml') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from(`
name: CI
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 60
    steps:
      - run: npm test
`).toString('base64'),
            },
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await githubActionsTimeoutMinutes(context, {
        maximum: 30,
      });
      expect(result.errors).toHaveLength(2);
      expect(result.errors).toContain(
        '.github/workflows/ci.yml: job "build" is missing timeout-minutes',
      );
      expect(result.errors).toContain(
        '.github/workflows/ci.yml: job "test" has timeout-minutes (60) that is higher than 30',
      );
    });
  });
});
