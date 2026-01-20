import type { getOctokit } from '@actions/github';
import { fileExists, fileExistsOptionsSchema, type fileExistsOptions } from './file-exists';

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
} as Parameters<typeof fileExists>[1];

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

      const result = await fileExists(mockOctokit, mockRepository, { path: 'readme.md' });
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

      const result = await fileExists(mockOctokit, mockRepository, {
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

      const result = await fileExists(mockOctokit, mockRepository, {
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

      const result = await fileExists(mockOctokit, mockRepository, { path: 'README.md' });
      expect(result).toEqual({ errors: ['README.md not found'] });
    });

    it('should return false when repository is empty', async () => {
      mockGetContent.mockResolvedValue({
        data: [],
      });

      const result = await fileExists(mockOctokit, mockRepository, { path: 'README.md' });
      expect(result).toEqual({ errors: ['README.md not found'] });
    });
  });

  describe('when contents is not an array', () => {
    it('should return false when getContent returns a single file object', async () => {
      mockGetContent.mockResolvedValue({
        data: { name: 'README.md', type: 'file' },
      });

      const result = await fileExists(mockOctokit, mockRepository, { path: 'README.md' });
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

      const result = await fileExists(mockOctokit, mockRepository, { path: 'src' });
      expect(result).toEqual({ errors: ['src not found'] });
    });
  });

  describe('invalid options', () => {
    it('should throw an error when path is not provided', async () => {
      mockGetContent.mockResolvedValue({
        data: [{ name: 'README.md', type: 'file' }],
      });

      await expect(
        fileExists(mockOctokit, mockRepository, {} as fileExistsOptions),
      ).rejects.toThrow('Invalid rule options');
    });

    it('should throw an error when path is not a string', async () => {
      mockGetContent.mockResolvedValue({
        data: [{ name: 'README.md', type: 'file' }],
      });

      await expect(
        fileExists(mockOctokit, mockRepository, { path: 123 } as unknown as fileExistsOptions),
      ).rejects.toThrow('Invalid rule options');
    });
  });
});

describe('fileExistsOptionsSchema', () => {
  it('should parse valid options with path only', () => {
    const result = fileExistsOptionsSchema.parse({ path: 'README.md' });
    expect(result).toEqual({ path: 'README.md', caseSensitive: false });
  });

  it('should parse valid options with caseSensitive: true', () => {
    const result = fileExistsOptionsSchema.parse({ path: 'README.md', caseSensitive: true });
    expect(result).toEqual({ path: 'README.md', caseSensitive: true });
  });

  it('should default caseSensitive to false', () => {
    const result = fileExistsOptionsSchema.parse({ path: 'README.md' });
    expect(result.caseSensitive).toBe(false);
  });

  it('should throw when path is missing', () => {
    expect(() => fileExistsOptionsSchema.parse({})).toThrow();
  });

  it('should throw when path is not a string', () => {
    expect(() => fileExistsOptionsSchema.parse({ path: 123 })).toThrow();
  });
});
