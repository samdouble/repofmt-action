import type { getOctokit } from '@actions/github';
import { RuleContext } from '../utils/context';
import { yamlHasKeys } from './yaml-has-keys';

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

describe('yamlHasKeys', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when file does not exist', () => {
    it('should return an error', async () => {
      mockGetContent.mockRejectedValue(new Error('Not found'));

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await yamlHasKeys(context, {
        path: 'config.yml',
        keys: ['name'],
      });

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatch(/^config\.yml: /);
    });
  });

  describe('when file contains invalid YAML', () => {
    it('should return a parsing error', async () => {
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from('invalid: yaml: content: [unclosed').toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await yamlHasKeys(context, {
        path: 'config.yml',
        keys: ['name'],
      });

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatch(/^config\.yml: failed to parse YAML:/);
    });
  });

  describe('when all keys exist', () => {
    it('should return no errors for top-level keys', async () => {
      const yamlContent = `name: test-app
version: 1.0.0
description: A test application
`;
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from(yamlContent).toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await yamlHasKeys(context, {
        path: 'config.yml',
        keys: ['name', 'version'],
      });

      expect(result).toEqual({ errors: [] });
    });

    it('should return no errors for nested keys', async () => {
      const yamlContent = `scripts:
  build: tsc
  test: jest
dependencies:
  typescript: ^5.0.0
`;
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from(yamlContent).toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await yamlHasKeys(context, {
        path: 'config.yml',
        keys: ['scripts.build', 'scripts.test', 'dependencies.typescript'],
      });

      expect(result).toEqual({ errors: [] });
    });

    it('should return no errors for deeply nested keys', async () => {
      const yamlContent = `config:
  database:
    connection:
      host: localhost
      port: 5432
`;
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from(yamlContent).toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await yamlHasKeys(context, {
        path: 'config.yml',
        keys: ['config.database.connection.host', 'config.database.connection.port'],
      });

      expect(result).toEqual({ errors: [] });
    });
  });

  describe('when keys are missing', () => {
    it('should return errors for missing top-level keys', async () => {
      const yamlContent = `name: test-app
`;
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from(yamlContent).toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await yamlHasKeys(context, {
        path: 'config.yml',
        keys: ['name', 'version', 'description'],
      });

      expect(result.errors).toHaveLength(2);
      expect(result.errors).toContain('config.yml: missing key "version"');
      expect(result.errors).toContain('config.yml: missing key "description"');
    });

    it('should return errors for missing nested keys', async () => {
      const yamlContent = `scripts:
  build: tsc
`;
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from(yamlContent).toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await yamlHasKeys(context, {
        path: 'config.yml',
        keys: ['scripts.build', 'scripts.test', 'scripts.lint'],
      });

      expect(result.errors).toHaveLength(2);
      expect(result.errors).toContain('config.yml: missing key "scripts.test"');
      expect(result.errors).toContain('config.yml: missing key "scripts.lint"');
    });

    it('should return errors when parent key does not exist', async () => {
      const yamlContent = `name: test-app
`;
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from(yamlContent).toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await yamlHasKeys(context, {
        path: 'config.yml',
        keys: ['scripts.build'],
      });

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe('config.yml: missing key "scripts.build"');
    });
  });

  describe('when using glob patterns', () => {
    it('should check all matching files', async () => {
      mockGetContent.mockImplementation(({ path }) => {
        if (path === 'config.yml') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from('name: test\nversion: 1.0.0').toString('base64'),
            },
          });
        }
        if (path === 'app.yaml') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from('name: test').toString('base64'),
            },
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      const mockGetAllFiles = jest.fn().mockResolvedValue([
        { type: 'file', path: 'config.yml' },
        { type: 'file', path: 'app.yaml' },
      ]);

      const context = new RuleContext(mockOctokit, mockRepository);
      context.getAllFiles = mockGetAllFiles;

      const result = await yamlHasKeys(context, {
        path: '**/*.{yml,yaml}',
        keys: ['version'],
      });

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe('app.yaml: missing key "version"');
    });

    it('should return error when no files match pattern', async () => {
      const mockGetAllFiles = jest.fn().mockResolvedValue([]);

      const context = new RuleContext(mockOctokit, mockRepository);
      context.getAllFiles = mockGetAllFiles;

      const result = await yamlHasKeys(context, {
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
        if (path === 'config.yml') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from('name: test\nversion: 1.0.0').toString('base64'),
            },
          });
        }
        if (path === 'app.yaml') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from('name: test').toString('base64'),
            },
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await yamlHasKeys(context, {
        path: ['config.yml', 'app.yaml'],
        keys: ['version'],
      });

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe('app.yaml: missing key "version"');
    });
  });

  describe('when key points to null or undefined value', () => {
    it('should treat null as existing key', async () => {
      const yamlContent = `optional: null
`;
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from(yamlContent).toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await yamlHasKeys(context, {
        path: 'config.yml',
        keys: ['optional'],
      });

      expect(result).toEqual({ errors: [] });
    });

    it('should return error when key is undefined', async () => {
      const yamlContent = `name: test
`;
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from(yamlContent).toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await yamlHasKeys(context, {
        path: 'config.yml',
        keys: ['optional'],
      });

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe('config.yml: missing key "optional"');
    });
  });

  describe('caching', () => {
    it('should cache file content', async () => {
      const yamlContent = 'name: test\nversion: 1.0.0';
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from(yamlContent).toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      await yamlHasKeys(context, {
        path: 'config.yml',
        keys: ['name'],
      });
      await yamlHasKeys(context, {
        path: 'config.yml',
        keys: ['name'],
      });

      expect(mockGetContent).toHaveBeenCalledTimes(1);
    });
  });
});
