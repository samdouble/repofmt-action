import type { getOctokit } from '@actions/github';
import { fileForbidden, FileForbiddenOptionsSchema, type FileForbiddenOptions } from './file-forbidden';

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
} as Parameters<typeof fileForbidden>[1];

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

      const result = await fileForbidden(mockOctokit, mockRepository, { path: '.DS_Store' });
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

      const result = await fileForbidden(mockOctokit, mockRepository, { path: '.DS_Store' });
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

      const result = await fileForbidden(mockOctokit, mockRepository, { path: '.ds_store' });
      expect(result).toEqual({ errors: ['.ds_store should not exist'] });
    });

    it('should return error when file matches exactly with caseSensitive: true', async () => {
      mockGetContent.mockResolvedValue({
        data: [
          { name: '.DS_Store', type: 'file' },
          { name: 'package.json', type: 'file' },
        ],
      });

      const result = await fileForbidden(mockOctokit, mockRepository, {
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

      const result = await fileForbidden(mockOctokit, mockRepository, {
        path: '.ds_store',
        caseSensitive: true,
      });
      expect(result).toEqual({ errors: [] });
    });
  });

  describe('when contents is not an array', () => {
    it('should return error when getContent returns a single file object', async () => {
      mockGetContent.mockResolvedValue({
        data: { name: '.DS_Store', type: 'file' },
      });

      const result = await fileForbidden(mockOctokit, mockRepository, { path: '.DS_Store' });
      expect(result).toEqual({ errors: ['Contents is not an array'] });
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

      const result = await fileForbidden(mockOctokit, mockRepository, { path: 'node_modules' });
      expect(result).toEqual({ errors: [] });
    });
  });

  describe('invalid options', () => {
    it('should throw an error when path is not provided', async () => {
      mockGetContent.mockResolvedValue({
        data: [{ name: '.DS_Store', type: 'file' }],
      });

      await expect(
        fileForbidden(mockOctokit, mockRepository, {} as FileForbiddenOptions),
      ).rejects.toThrow('Invalid rule options');
    });

    it('should throw an error when path is not a string', async () => {
      mockGetContent.mockResolvedValue({
        data: [{ name: '.DS_Store', type: 'file' }],
      });

      await expect(
        fileForbidden(mockOctokit, mockRepository, { path: 123 } as unknown as FileForbiddenOptions),
      ).rejects.toThrow('Invalid rule options');
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
});
