import type { getOctokit } from '@actions/github';
import { RuleContext } from '../utils/context';
import { jsonHasKeys } from './json-has-keys';

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

describe('jsonHasKeys', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when file does not exist', () => {
    it('should return an error', async () => {
      mockGetContent.mockRejectedValue(new Error('Not found'));

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await jsonHasKeys(context, {
        path: 'package.json',
        keys: ['name'],
      });

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatch(/^package\.json: /);
    });
  });

  describe('when file contains invalid JSON', () => {
    it('should return a parsing error', async () => {
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from('{ invalid json }').toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await jsonHasKeys(context, {
        path: 'package.json',
        keys: ['name'],
      });

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatch(/^package\.json: failed to parse JSON:/);
    });
  });

  describe('when all keys exist', () => {
    it('should return no errors for top-level keys', async () => {
      const jsonContent = {
        name: 'test-package',
        version: '1.0.0',
        description: 'A test package',
      };
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from(JSON.stringify(jsonContent)).toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await jsonHasKeys(context, {
        path: 'package.json',
        keys: ['name', 'version'],
      });

      expect(result).toEqual({ errors: [] });
    });

    it('should return no errors for nested keys', async () => {
      const jsonContent = {
        scripts: {
          build: 'tsc',
          test: 'jest',
        },
        dependencies: {
          typescript: '^5.0.0',
        },
      };
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from(JSON.stringify(jsonContent)).toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await jsonHasKeys(context, {
        path: 'package.json',
        keys: ['scripts.build', 'scripts.test', 'dependencies.typescript'],
      });

      expect(result).toEqual({ errors: [] });
    });

    it('should return no errors for deeply nested keys', async () => {
      const jsonContent = {
        config: {
          database: {
            connection: {
              host: 'localhost',
              port: 5432,
            },
          },
        },
      };
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from(JSON.stringify(jsonContent)).toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await jsonHasKeys(context, {
        path: 'config.json',
        keys: ['config.database.connection.host', 'config.database.connection.port'],
      });

      expect(result).toEqual({ errors: [] });
    });
  });

  describe('when keys are missing', () => {
    it('should return errors for missing top-level keys', async () => {
      const jsonContent = {
        name: 'test-package',
      };
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from(JSON.stringify(jsonContent)).toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await jsonHasKeys(context, {
        path: 'package.json',
        keys: ['name', 'version', 'description'],
      });

      expect(result.errors).toHaveLength(2);
      expect(result.errors).toContain('package.json: missing key "version"');
      expect(result.errors).toContain('package.json: missing key "description"');
    });

    it('should return errors for missing nested keys', async () => {
      const jsonContent = {
        scripts: {
          build: 'tsc',
        },
      };
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from(JSON.stringify(jsonContent)).toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await jsonHasKeys(context, {
        path: 'package.json',
        keys: ['scripts.build', 'scripts.test', 'scripts.lint'],
      });

      expect(result.errors).toHaveLength(2);
      expect(result.errors).toContain('package.json: missing key "scripts.test"');
      expect(result.errors).toContain('package.json: missing key "scripts.lint"');
    });

    it('should return errors when parent key does not exist', async () => {
      const jsonContent = {
        name: 'test-package',
      };
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from(JSON.stringify(jsonContent)).toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await jsonHasKeys(context, {
        path: 'package.json',
        keys: ['scripts.build'],
      });

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe('package.json: missing key "scripts.build"');
    });
  });

  describe('when using glob patterns', () => {
    it('should check all matching files', async () => {
      mockGetContent.mockImplementation(({ path }) => {
        if (path === 'package.json') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from(JSON.stringify({ name: 'test', version: '1.0.0' })).toString('base64'),
            },
          });
        }
        if (path === 'package-lock.json') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from(JSON.stringify({ name: 'test' })).toString('base64'),
            },
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      const mockGetAllFiles = jest.fn().mockResolvedValue([
        { type: 'file', path: 'package.json' },
        { type: 'file', path: 'package-lock.json' },
      ]);

      const context = new RuleContext(mockOctokit, mockRepository);
      context.getAllFiles = mockGetAllFiles;

      const result = await jsonHasKeys(context, {
        path: '**/*.json',
        keys: ['version'],
      });

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe('package-lock.json: missing key "version"');
    });

    it('should return error when no files match pattern', async () => {
      const mockGetAllFiles = jest.fn().mockResolvedValue([]);

      const context = new RuleContext(mockOctokit, mockRepository);
      context.getAllFiles = mockGetAllFiles;

      const result = await jsonHasKeys(context, {
        path: '**/*.nonexistent',
        keys: ['name'],
      });

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe('**/*.nonexistent: no files match pattern');
    });
  });

  describe('when using array of paths', () => {
    it('should check all specified files', async () => {
      mockGetContent.mockImplementation(({ path }) => {
        if (path === 'package.json') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from(JSON.stringify({ name: 'test', version: '1.0.0' })).toString('base64'),
            },
          });
        }
        if (path === 'tsconfig.json') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from(JSON.stringify({ compilerOptions: {} })).toString('base64'),
            },
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await jsonHasKeys(context, {
        path: ['package.json', 'tsconfig.json'],
        keys: ['version'],
      });

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe('tsconfig.json: missing key "version"');
    });
  });

  describe('when key points to null or undefined value', () => {
    it('should treat null as existing key', async () => {
      const jsonContent = {
        optional: null,
      };
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from(JSON.stringify(jsonContent)).toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await jsonHasKeys(context, {
        path: 'config.json',
        keys: ['optional'],
      });

      expect(result).toEqual({ errors: [] });
    });

    it('should return error when key is undefined', async () => {
      const jsonContent = {
        name: 'test',
      };
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from(JSON.stringify(jsonContent)).toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await jsonHasKeys(context, {
        path: 'config.json',
        keys: ['optional'],
      });

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe('config.json: missing key "optional"');
    });
  });

  describe('when key path contains array', () => {
    it('should not traverse arrays', async () => {
      const jsonContent = {
        items: [
          { name: 'item1' },
          { name: 'item2' },
        ],
      };
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from(JSON.stringify(jsonContent)).toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await jsonHasKeys(context, {
        path: 'config.json',
        keys: ['items.0.name'],
      });

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe('config.json: missing key "items.0.name"');
    });
  });

  describe('caching', () => {
    it('should cache file content', async () => {
      const jsonContent = { name: 'test', version: '1.0.0' };
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from(JSON.stringify(jsonContent)).toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      await jsonHasKeys(context, {
        path: 'package.json',
        keys: ['name'],
      });
      await jsonHasKeys(context, {
        path: 'package.json',
        keys: ['name'],
      });

      expect(mockGetContent).toHaveBeenCalledTimes(1);
    });
  });
});
