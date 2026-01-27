import type { getOctokit } from '@actions/github';
import { fileContains } from './file-contains';
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

describe('fileContains', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when file exists and contains the string', () => {
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
      const result = await fileContains(context, {
        path: 'README.md',
        contains: 'README',
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
      const result = await fileContains(context, {
        path: 'README.md',
        contains: 'README',
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
      const result = await fileContains(context, {
        path: 'README.md',
        contains: 'README',
        caseSensitive: true,
      });

      expect(result).toEqual({ errors: [] });
    });
  });

  describe('when file exists but does not contain the string', () => {
    it('should return an error', async () => {
      mockGetContent.mockImplementation(({ path }) => {
        if (path === 'README.md') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from('This is a file').toString('base64'),
            },
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await fileContains(context, {
        path: 'README.md',
        contains: 'LICENSE',
      });

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe('README.md: file does not contain "LICENSE"');
    });

    it('should respect case-sensitive matching', async () => {
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
      const result = await fileContains(context, {
        path: 'README.md',
        contains: 'README',
        caseSensitive: true,
      });

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe('README.md: file does not contain "README"');
    });
  });

  describe('when file does not exist', () => {
    it('should return an error', async () => {
      mockGetContent.mockRejectedValue(new Error('Not found'));

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await fileContains(context, {
        path: 'missing.md',
        contains: 'something',
      });

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatch(/^missing\.md: /);
    });
  });

  describe('when path is a directory', () => {
    it('should return an error', async () => {
      mockGetContent.mockResolvedValue({
        data: [{ name: 'file.md', type: 'file' }],
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await fileContains(context, {
        path: 'directory',
        contains: 'something',
      });

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatch(/^directory: .*is a directory/);
    });
  });

  describe('caching', () => {
    it('should cache file content', async () => {
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
      await fileContains(context, {
        path: 'README.md',
        contains: 'README',
      });
      await fileContains(context, {
        path: 'README.md',
        contains: 'file',
      });

      expect(mockGetContent).toHaveBeenCalledTimes(1);
    });
  });

  describe('when path is an array', () => {
    it('should check all files in the array', async () => {
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
      const result = await fileContains(context, {
        path: ['README.md', 'LICENSE'],
        contains: 'MIT',
      });

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe('README.md: file does not contain "MIT"');
    });

    it('should pass when all files contain the string', async () => {
      mockGetContent.mockImplementation(({ path }) => {
        if (path === 'README.md') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from('MIT License').toString('base64'),
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
      const result = await fileContains(context, {
        path: ['README.md', 'LICENSE'],
        contains: 'MIT',
      });

      expect(result).toEqual({ errors: [] });
    });
  });

  describe('when path is a glob pattern', () => {
    beforeEach(() => {
      // Mock getAllFiles to return multiple files
      jest.spyOn(RuleContext.prototype, 'getAllFiles').mockResolvedValue([
        { path: 'README.md', name: 'README.md', type: 'file' },
        { path: 'docs/README.md', name: 'README.md', type: 'file' },
        { path: 'src/index.ts', name: 'index.ts', type: 'file' },
      ]);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should check all files matching the glob pattern', async () => {
      mockGetContent.mockImplementation(({ path }) => {
        if (path === 'README.md') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from('MIT License').toString('base64'),
            },
          });
        }
        if (path === 'docs/README.md') {
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
      const result = await fileContains(context, {
        path: '**/*.md',
        contains: 'MIT',
      });

      expect(result).toEqual({ errors: [] });
    });

    it('should report errors for files that do not contain the string', async () => {
      mockGetContent.mockImplementation(({ path }) => {
        if (path === 'README.md') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from('MIT License').toString('base64'),
            },
          });
        }
        if (path === 'docs/README.md') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from('No license here').toString('base64'),
            },
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await fileContains(context, {
        path: '**/*.md',
        contains: 'MIT',
      });

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe('docs/README.md: file does not contain "MIT"');
    });

    it('should report error when no files match the pattern', async () => {
      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await fileContains(context, {
        path: '**/*.json',
        contains: 'something',
      });

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe('**/*.json: no files match pattern');
    });

    it('should work with array of glob patterns', async () => {
      mockGetContent.mockImplementation(({ path }) => {
        if (path === 'README.md') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from('MIT License').toString('base64'),
            },
          });
        }
        if (path === 'docs/README.md') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from('MIT License').toString('base64'),
            },
          });
        }
        if (path === 'src/index.ts') {
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
      const result = await fileContains(context, {
        path: ['**/*.md', '**/*.ts'],
        contains: 'MIT',
      });

      expect(result).toEqual({ errors: [] });
    });
  });
});
