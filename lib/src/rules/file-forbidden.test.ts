import type { getOctokit } from '@actions/github';
import { fileForbidden, FileForbiddenOptionsSchema, type FileForbiddenOptions } from './file-forbidden';
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

describe('fileForbidden', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when file does not exist', () => {
    it('should return no errors when file is not found', async () => {
      mockGetContent.mockResolvedValue({
        data: [
          { name: 'README.md', type: 'file' },
          { name: 'package.json', type: 'file' },
          { name: 'src', type: 'dir' },
        ],
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await fileForbidden(context, { path: '.DS_Store' });
      expect(result).toEqual({ errors: [] });
      expect(mockGetContent).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        path: '',
      });
    });

    it('should return no errors when repository is empty', async () => {
      mockGetContent.mockResolvedValue({
        data: [],
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await fileForbidden(context, { path: '.DS_Store' });
      expect(result).toEqual({ errors: [] });
    });
  });

  describe('when file exists', () => {
    it('should return error when file is found (case insensitive by default)', async () => {
      mockGetContent.mockResolvedValue({
        data: [
          { name: '.DS_Store', type: 'file' },
          { name: 'package.json', type: 'file' },
          { name: 'src', type: 'dir' },
        ],
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await fileForbidden(context, { path: '.ds_store' });
      expect(result).toEqual({ errors: ['.ds_store should not exist'] });
    });

    it('should return error when file matches exactly with caseSensitive: true', async () => {
      mockGetContent.mockResolvedValue({
        data: [
          { name: '.DS_Store', type: 'file' },
          { name: 'package.json', type: 'file' },
        ],
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await fileForbidden(context, {
        path: '.DS_Store',
        caseSensitive: true,
      });
      expect(result).toEqual({ errors: ['.DS_Store should not exist'] });
    });

    it('should return no errors when file case does not match with caseSensitive: true', async () => {
      mockGetContent.mockResolvedValue({
        data: [
          { name: '.DS_Store', type: 'file' },
          { name: 'package.json', type: 'file' },
        ],
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await fileForbidden(context, {
        path: '.ds_store',
        caseSensitive: true,
      });
      expect(result).toEqual({ errors: [] });
    });
  });

  describe('when contents is not an array', () => {
    it('should return no errors when getContent returns a single file object', async () => {
      mockGetContent.mockResolvedValue({
        data: { name: '.DS_Store', type: 'file' },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await fileForbidden(context, { path: '.DS_Store' });
      expect(result).toEqual({ errors: [] });
    });
  });

  describe('when path matches a directory', () => {
    it('should return no errors when path matches a directory instead of a file', async () => {
      mockGetContent.mockResolvedValue({
        data: [
          { name: 'node_modules', type: 'dir' },
          { name: 'src', type: 'dir' },
        ],
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await fileForbidden(context, { path: 'node_modules' });
      expect(result).toEqual({ errors: [] });
    });
  });

  describe('invalid options', () => {
    it('should throw an error when path is not provided', async () => {
      mockGetContent.mockResolvedValue({
        data: [{ name: '.DS_Store', type: 'file' }],
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      await expect(
        fileForbidden(context, {} as FileForbiddenOptions),
      ).rejects.toThrow('Invalid rule options');
    });

    it('should throw an error when path is not a string', async () => {
      mockGetContent.mockResolvedValue({
        data: [{ name: '.DS_Store', type: 'file' }],
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      await expect(
        fileForbidden(context, { path: 123 } as unknown as FileForbiddenOptions),
      ).rejects.toThrow('Invalid rule options');
    });
  });

  describe('caching', () => {
    it('should only call API once when checking multiple files', async () => {
      mockGetContent.mockResolvedValue({
        data: [
          { name: '.DS_Store', type: 'file' },
          { name: 'package.json', type: 'file' },
        ],
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      await fileForbidden(context, { path: '.DS_Store' });
      await fileForbidden(context, { path: '.env' });
      await fileForbidden(context, { path: 'node_modules' });

      expect(mockGetContent).toHaveBeenCalledTimes(1);
    });
  });

  describe('nested files', () => {
    it('should find a forbidden file in a subdirectory', async () => {
      mockGetContent.mockResolvedValue({
        data: [
          { name: '.env', type: 'file' },
          { name: 'config.ts', type: 'file' },
        ],
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await fileForbidden(context, { path: 'config/.env' });
      expect(result).toEqual({ errors: ['config/.env should not exist'] });
      expect(mockGetContent).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        path: 'config',
      });
    });

    it('should find a forbidden file in a deeply nested subdirectory', async () => {
      mockGetContent.mockResolvedValue({
        data: [
          { name: 'secrets.json', type: 'file' },
        ],
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await fileForbidden(context, { path: 'src/config/secrets.json' });
      expect(result).toEqual({ errors: ['src/config/secrets.json should not exist'] });
      expect(mockGetContent).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        path: 'src/config',
      });
    });

    it('should return no error when nested file is not found', async () => {
      mockGetContent.mockResolvedValue({
        data: [
          { name: 'other.ts', type: 'file' },
        ],
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await fileForbidden(context, { path: 'src/.env' });
      expect(result).toEqual({ errors: [] });
    });

    it('should return no error when directory does not exist', async () => {
      mockGetContent.mockRejectedValue(new Error('Not Found'));

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await fileForbidden(context, { path: 'nonexistent/.env' });
      expect(result).toEqual({ errors: [] });
    });

    it('should cache nested directory contents', async () => {
      mockGetContent.mockResolvedValue({
        data: [
          { name: '.env', type: 'file' },
          { name: 'config.ts', type: 'file' },
        ],
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      await fileForbidden(context, { path: 'src/.env' });
      await fileForbidden(context, { path: 'src/.env.local' });
      await fileForbidden(context, { path: 'src/secrets.json' });

      expect(mockGetContent).toHaveBeenCalledTimes(1);
    });
  });
});

describe('FileForbiddenOptionsSchema', () => {
  it('should parse valid options with path only', () => {
    const result = FileForbiddenOptionsSchema.parse({ path: '.DS_Store' });
    expect(result).toEqual({ path: '.DS_Store', caseSensitive: false });
  });

  it('should parse valid options with caseSensitive: true', () => {
    const result = FileForbiddenOptionsSchema.parse({ path: '.DS_Store', caseSensitive: true });
    expect(result).toEqual({ path: '.DS_Store', caseSensitive: true });
  });

  it('should default caseSensitive to false', () => {
    const result = FileForbiddenOptionsSchema.parse({ path: '.DS_Store' });
    expect(result.caseSensitive).toBe(false);
  });

  it('should throw when path is missing', () => {
    expect(() => FileForbiddenOptionsSchema.parse({})).toThrow();
  });

  it('should throw when path is not a string', () => {
    expect(() => FileForbiddenOptionsSchema.parse({ path: 123 })).toThrow();
  });

  it('should parse valid options with array of paths', () => {
    const result = FileForbiddenOptionsSchema.parse({ path: ['.env', '.env.local'] });
    expect(result).toEqual({ path: ['.env', '.env.local'], caseSensitive: false });
  });

  it('should throw when array is empty', () => {
    expect(() => FileForbiddenOptionsSchema.parse({ path: [] })).toThrow();
  });
});

describe('fileForbidden with multiple paths', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should pass when none of the files exist', async () => {
    mockGetContent.mockResolvedValue({
      data: [
        { name: 'README.md', type: 'file' },
      ],
    });

    const context = new RuleContext(mockOctokit, mockRepository);
    const result = await fileForbidden(context, { path: ['.env', '.env.local'] });
    expect(result).toEqual({ errors: [] });
  });

  it('should fail when first file exists', async () => {
    mockGetContent.mockResolvedValue({
      data: [
        { name: '.env', type: 'file' },
      ],
    });

    const context = new RuleContext(mockOctokit, mockRepository);
    const result = await fileForbidden(context, { path: ['.env', '.env.local'] });
    expect(result).toEqual({ errors: ['.env should not exist'] });
  });

  it('should fail when second file exists', async () => {
    mockGetContent.mockResolvedValue({
      data: [
        { name: '.env.local', type: 'file' },
      ],
    });

    const context = new RuleContext(mockOctokit, mockRepository);
    const result = await fileForbidden(context, { path: ['.env', '.env.local'] });
    expect(result).toEqual({ errors: ['.env.local should not exist'] });
  });

  it('should report all files that exist in a single error', async () => {
    mockGetContent.mockResolvedValue({
      data: [
        { name: '.env', type: 'file' },
        { name: '.env.local', type: 'file' },
      ],
    });

    const context = new RuleContext(mockOctokit, mockRepository);
    const result = await fileForbidden(context, { path: ['.env', '.env.local'] });
    expect(result).toEqual({
      errors: ['[.env, .env.local] should not exist'],
    });
  });

  it('should work with nested paths', async () => {
    mockGetContent.mockResolvedValue({
      data: [
        { name: 'secrets.json', type: 'file' },
      ],
    });

    const context = new RuleContext(mockOctokit, mockRepository);
    const result = await fileForbidden(context, {
      path: ['config/secrets.json', 'config/credentials.json'],
    });
    expect(result).toEqual({ errors: ['config/secrets.json should not exist'] });
  });
});
