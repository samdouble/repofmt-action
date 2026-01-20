import { getOctokit } from '@actions/github';
import { readmeExists, readmeExistsOptionsSchema, type readmeExistsOptions } from './readme-exists';

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
} as Parameters<typeof readmeExists>[1];

describe('readmeExists', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when README file exists', () => {
    it('should return true when README.md exists (default path)', async () => {
      mockGetContent.mockResolvedValue({
        data: [
          { name: 'README.md', type: 'file' },
          { name: 'package.json', type: 'file' },
        ],
      });

      const result = await readmeExists(mockOctokit, mockRepository, {} as readmeExistsOptions);
      expect(result).toEqual({ errors: [] });
    });

    it('should return true with case insensitive match by default', async () => {
      mockGetContent.mockResolvedValue({
        data: [
          { name: 'readme.md', type: 'file' },
          { name: 'package.json', type: 'file' },
        ],
      });

      const result = await readmeExists(mockOctokit, mockRepository, {} as readmeExistsOptions);
      expect(result).toEqual({ errors: [] });
    });

    it('should return true when custom readme path is specified', async () => {
      mockGetContent.mockResolvedValue({
        data: [
          { name: 'README.txt', type: 'file' },
          { name: 'package.json', type: 'file' },
        ],
      });

      const result = await readmeExists(mockOctokit, mockRepository, { path: 'README.txt' } as readmeExistsOptions);
      expect(result).toEqual({ errors: [] });
    });

    it('should return true for README without extension', async () => {
      mockGetContent.mockResolvedValue({
        data: [
          { name: 'README', type: 'file' },
          { name: 'package.json', type: 'file' },
        ],
      });

      const result = await readmeExists(mockOctokit, mockRepository, { path: 'README' } as readmeExistsOptions);
      expect(result).toEqual({ errors: [] });
    });
  });

  describe('when README file does not exist', () => {
    it('should return false when README.md is not found', async () => {
      mockGetContent.mockResolvedValue({
        data: [
          { name: 'LICENSE.md', type: 'file' },
          { name: 'package.json', type: 'file' },
        ],
      });

      const result = await readmeExists(mockOctokit, mockRepository, {} as readmeExistsOptions);
      expect(result).toEqual({ errors: ['README.md not found'] });
    });

    it('should return false when repository is empty', async () => {
      mockGetContent.mockResolvedValue({
        data: [],
      });

      const result = await readmeExists(mockOctokit, mockRepository, {} as readmeExistsOptions);
      expect(result).toEqual({ errors: ['README.md not found'] });
    });

    it('should return false when only directories exist', async () => {
      mockGetContent.mockResolvedValue({
        data: [
          { name: 'src', type: 'dir' },
          { name: 'docs', type: 'dir' },
        ],
      });

      const result = await readmeExists(mockOctokit, mockRepository, {} as readmeExistsOptions);
      expect(result).toEqual({ errors: ['README.md not found'] });
    });
  });

  describe('with caseSensitive option', () => {
    it('should return true when exact case matches with caseSensitive: true', async () => {
      mockGetContent.mockResolvedValue({
        data: [{ name: 'README.md', type: 'file' }],
      });

      const result = await readmeExists(mockOctokit, mockRepository, {
        path: 'README.md',
        caseSensitive: true,
      });
      expect(result).toEqual({ errors: [] });
    });

    it('should return false when case does not match with caseSensitive: true', async () => {
      mockGetContent.mockResolvedValue({
        data: [{ name: 'readme.md', type: 'file' }],
      });

      const result = await readmeExists(mockOctokit, mockRepository, {
        path: 'README.md',
        caseSensitive: true,
      });
      expect(result).toEqual({ errors: ['README.md not found'] });
    });

    it('should return false for Readme.md when looking for README.md with caseSensitive: true', async () => {
      mockGetContent.mockResolvedValue({
        data: [{ name: 'Readme.md', type: 'file' }],
      });

      const result = await readmeExists(mockOctokit, mockRepository, {
        path: 'README.md',
        caseSensitive: true,
      });
      expect(result).toEqual({ errors: ['README.md not found'] });
    });
  });

  describe('invalid options', () => {
    it('should throw an error when caseSensitive is not a boolean', async () => {
      mockGetContent.mockResolvedValue({
        data: [{ name: 'README.md', type: 'file' }],
      });

      await expect(
        readmeExists(mockOctokit, mockRepository, { caseSensitive: 'yes' } as unknown as readmeExistsOptions),
      ).rejects.toThrow('Invalid rule options');
    });

    it('should throw an error when path is not a string', async () => {
      mockGetContent.mockResolvedValue({
        data: [{ name: 'README.md', type: 'file' }],
      });

      await expect(
        readmeExists(mockOctokit, mockRepository, { path: 123 } as unknown as readmeExistsOptions),
      ).rejects.toThrow('Invalid rule options');
    });
  });
});

describe('readmeExistsOptionsSchema', () => {
  it('should parse empty options with defaults', () => {
    const result = readmeExistsOptionsSchema.parse({});
    expect(result).toEqual({ path: 'README.md', caseSensitive: false });
  });

  it('should parse options with custom path', () => {
    const result = readmeExistsOptionsSchema.parse({ path: 'README.rst' });
    expect(result).toEqual({ path: 'README.rst', caseSensitive: false });
  });

  it('should parse options with caseSensitive: true', () => {
    const result = readmeExistsOptionsSchema.parse({ caseSensitive: true });
    expect(result).toEqual({ path: 'README.md', caseSensitive: true });
  });

  it('should parse options with all values specified', () => {
    const result = readmeExistsOptionsSchema.parse({ path: 'README', caseSensitive: true });
    expect(result).toEqual({ path: 'README', caseSensitive: true });
  });

  it('should throw when path is not a string', () => {
    expect(() => readmeExistsOptionsSchema.parse({ path: 123 })).toThrow();
  });

  it('should throw when caseSensitive is not a boolean', () => {
    expect(() => readmeExistsOptionsSchema.parse({ caseSensitive: 'yes' })).toThrow();
  });
});
