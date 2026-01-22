import type { getOctokit } from '@actions/github';
import { fileExists, FileExistsOptionsSchema, type FileExistsOptions } from './file-exists';
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

describe('fileExists', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when file exists', () => {
    it('should return true when file is found (case insensitive by default)', async () => {
      mockGetContent.mockResolvedValue({
        data: [
          { name: 'README.md', type: 'file' },
          { name: 'package.json', type: 'file' },
          { name: 'src', type: 'dir' },
        ],
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await fileExists(context, { path: 'readme.md' });
      expect(result).toEqual({ errors: [] });
      expect(mockGetContent).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        path: '',
      });
    });

    it('should return true when file matches exactly with caseSensitive: true', async () => {
      mockGetContent.mockResolvedValue({
        data: [
          { name: 'README.md', type: 'file' },
          { name: 'package.json', type: 'file' },
        ],
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await fileExists(context, {
        path: 'README.md',
        caseSensitive: true,
      });
      expect(result).toEqual({ errors: [] });
    });

    it('should return false when file case does not match with caseSensitive: true', async () => {
      mockGetContent.mockResolvedValue({
        data: [
          { name: 'README.md', type: 'file' },
          { name: 'package.json', type: 'file' },
        ],
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await fileExists(context, {
        path: 'readme.md',
        caseSensitive: true,
      });
      expect(result).toEqual({ errors: ['readme.md not found'] });
    });
  });

  describe('when file does not exist', () => {
    it('should return false when file is not found', async () => {
      mockGetContent.mockResolvedValue({
        data: [
          { name: 'package.json', type: 'file' },
          { name: 'src', type: 'dir' },
        ],
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await fileExists(context, { path: 'README.md' });
      expect(result).toEqual({ errors: ['README.md not found'] });
    });

    it('should return false when repository is empty', async () => {
      mockGetContent.mockResolvedValue({
        data: [],
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await fileExists(context, { path: 'README.md' });
      expect(result).toEqual({ errors: ['README.md not found'] });
    });
  });

  describe('when contents is not an array', () => {
    it('should return false when getContent returns a single file object', async () => {
      mockGetContent.mockResolvedValue({
        data: { name: 'README.md', type: 'file' },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await fileExists(context, { path: 'README.md' });
      expect(result).toEqual({ errors: ['Contents is not an array'] });
    });
  });

  describe('when path matches a directory', () => {
    it('should return false when path matches a directory instead of a file', async () => {
      mockGetContent.mockResolvedValue({
        data: [
          { name: 'src', type: 'dir' },
          { name: 'docs', type: 'dir' },
        ],
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await fileExists(context, { path: 'src' });
      expect(result).toEqual({ errors: ['src not found'] });
    });
  });

  describe('invalid options', () => {
    it('should throw an error when path is not provided', async () => {
      mockGetContent.mockResolvedValue({
        data: [{ name: 'README.md', type: 'file' }],
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      await expect(
        fileExists(context, {} as FileExistsOptions),
      ).rejects.toThrow('Invalid rule options');
    });

    it('should throw an error when path is not a string', async () => {
      mockGetContent.mockResolvedValue({
        data: [{ name: 'README.md', type: 'file' }],
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      await expect(
        fileExists(context, { path: 123 } as unknown as FileExistsOptions),
      ).rejects.toThrow('Invalid rule options');
    });
  });

  describe('caching', () => {
    it('should only call API once when checking multiple files', async () => {
      mockGetContent.mockResolvedValue({
        data: [
          { name: 'README.md', type: 'file' },
          { name: 'LICENSE.md', type: 'file' },
        ],
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      await fileExists(context, { path: 'README.md' });
      await fileExists(context, { path: 'LICENSE.md' });
      await fileExists(context, { path: 'MISSING.md' });

      expect(mockGetContent).toHaveBeenCalledTimes(1);
    });
  });
});

describe('FileExistsOptionsSchema', () => {
  it('should parse valid options with path only', () => {
    const result = FileExistsOptionsSchema.parse({ path: 'README.md' });
    expect(result).toEqual({ path: 'README.md', caseSensitive: false });
  });

  it('should parse valid options with caseSensitive: true', () => {
    const result = FileExistsOptionsSchema.parse({ path: 'README.md', caseSensitive: true });
    expect(result).toEqual({ path: 'README.md', caseSensitive: true });
  });

  it('should default caseSensitive to false', () => {
    const result = FileExistsOptionsSchema.parse({ path: 'README.md' });
    expect(result.caseSensitive).toBe(false);
  });

  it('should throw when path is missing', () => {
    expect(() => FileExistsOptionsSchema.parse({})).toThrow();
  });

  it('should throw when path is not a string', () => {
    expect(() => FileExistsOptionsSchema.parse({ path: 123 })).toThrow();
  });
});
