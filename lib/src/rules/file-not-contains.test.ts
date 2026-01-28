import type { getOctokit } from '@actions/github';
import { RuleContext } from '../utils/context';
import { fileNotContains } from './file-not-contains';

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

describe('fileNotContains', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when file exists and does not contain the string', () => {
    it('should return no errors', async () => {
      mockGetContent.mockImplementation(({ path }) => {
        if (path === 'README.md') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from('This is a README file').toString('base64'),
            },
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await fileNotContains(context, {
        path: 'README.md',
        contains: 'SECRET',
      });

      expect(result).toEqual({ errors: [] });
    });

    it('should work with case-insensitive matching by default', async () => {
      mockGetContent.mockImplementation(({ path }) => {
        if (path === 'README.md') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from('This is a readme file').toString('base64'),
            },
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await fileNotContains(context, {
        path: 'README.md',
        contains: 'SECRET',
      });

      expect(result).toEqual({ errors: [] });
    });

    it('should work with case-sensitive matching when specified', async () => {
      mockGetContent.mockImplementation(({ path }) => {
        if (path === 'README.md') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from('This is a README file').toString('base64'),
            },
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await fileNotContains(context, {
        path: 'README.md',
        contains: 'readme',
        caseSensitive: true,
      });

      expect(result).toEqual({ errors: [] });
    });
  });

  describe('when file exists and contains the string', () => {
    it('should return an error', async () => {
      mockGetContent.mockImplementation(({ path }) => {
        if (path === 'README.md') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from('This is a README file with SECRET').toString('base64'),
            },
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await fileNotContains(context, {
        path: 'README.md',
        contains: 'SECRET',
      });

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe('README.md: file contains "SECRET"');
    });

    it('should work with case-insensitive matching by default', async () => {
      mockGetContent.mockImplementation(({ path }) => {
        if (path === 'README.md') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from('This is a readme file with secret').toString('base64'),
            },
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await fileNotContains(context, {
        path: 'README.md',
        contains: 'SECRET',
      });

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe('README.md: file contains "SECRET"');
    });

    it('should work with case-sensitive matching when specified', async () => {
      mockGetContent.mockImplementation(({ path }) => {
        if (path === 'README.md') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from('This is a README file with SECRET').toString('base64'),
            },
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await fileNotContains(context, {
        path: 'README.md',
        contains: 'SECRET',
        caseSensitive: true,
      });

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe('README.md: file contains "SECRET"');
    });

    it('should not match when case-sensitive and case does not match', async () => {
      mockGetContent.mockImplementation(({ path }) => {
        if (path === 'README.md') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from('This is a README file with secret').toString('base64'),
            },
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await fileNotContains(context, {
        path: 'README.md',
        contains: 'SECRET',
        caseSensitive: true,
      });

      expect(result).toEqual({ errors: [] });
    });
  });

  describe('when file does not exist', () => {
    it('should return no errors', async () => {
      mockGetContent.mockRejectedValue(new Error('Not found'));

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await fileNotContains(context, {
        path: 'README.md',
        contains: 'SECRET',
      });

      expect(result).toEqual({ errors: [] });
    });
  });

  describe('when using glob patterns', () => {
    it('should check all matching files', async () => {
      mockGetContent.mockImplementation(({ path }) => {
        if (path === 'README.md') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from('This is a README file').toString('base64'),
            },
          });
        }
        if (path === 'src/index.ts') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from('export const SECRET = "value"').toString('base64'),
            },
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      const mockGetAllFiles = jest.fn().mockResolvedValue([
        { type: 'file', path: 'README.md' },
        { type: 'file', path: 'src/index.ts' },
      ]);

      const context = new RuleContext(mockOctokit, mockRepository);
      context.getAllFiles = mockGetAllFiles;

      const result = await fileNotContains(context, {
        path: '**/*.{md,ts}',
        contains: 'SECRET',
      });

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe('src/index.ts: file contains "SECRET"');
    });

    it('should return no errors when no files match pattern', async () => {
      const mockGetAllFiles = jest.fn().mockResolvedValue([]);

      const context = new RuleContext(mockOctokit, mockRepository);
      context.getAllFiles = mockGetAllFiles;

      const result = await fileNotContains(context, {
        path: '**/*.nonexistent',
        contains: 'SECRET',
      });

      expect(result).toEqual({ errors: [] });
    });
  });

  describe('when using array of paths', () => {
    it('should check all specified files', async () => {
      mockGetContent.mockImplementation(({ path }) => {
        if (path === 'README.md') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from('This is a README file').toString('base64'),
            },
          });
        }
        if (path === 'LICENSE') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from('MIT License with SECRET').toString('base64'),
            },
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await fileNotContains(context, {
        path: ['README.md', 'LICENSE'],
        contains: 'SECRET',
      });

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe('LICENSE: file contains "SECRET"');
    });

    it('should return no errors when none of the files contain the string', async () => {
      mockGetContent.mockImplementation(({ path }) => {
        if (path === 'README.md') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from('This is a README file').toString('base64'),
            },
          });
        }
        if (path === 'LICENSE') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from('MIT License').toString('base64'),
            },
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await fileNotContains(context, {
        path: ['README.md', 'LICENSE'],
        contains: 'SECRET',
      });

      expect(result).toEqual({ errors: [] });
    });
  });

  describe('caching', () => {
    it('should cache file content', async () => {
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from('This is a README file').toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      await fileNotContains(context, {
        path: 'README.md',
        contains: 'SECRET',
      });
      await fileNotContains(context, {
        path: 'README.md',
        contains: 'SECRET',
      });

      expect(mockGetContent).toHaveBeenCalledTimes(1);
    });
  });
});
