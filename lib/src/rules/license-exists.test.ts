import { getOctokit } from '@actions/github';
import { licenseExists, licenseExistsOptionsSchema, type licenseExistsOptions } from './license-exists';

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
} as Parameters<typeof licenseExists>[1];

describe('licenseExists', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when LICENSE file exists', () => {
    it('should return true when LICENSE.md exists (default path)', async () => {
      mockGetContent.mockResolvedValue({
        data: [
          { name: 'LICENSE.md', type: 'file' },
          { name: 'README.md', type: 'file' },
        ],
      });

      const result = await licenseExists(mockOctokit, mockRepository, {} as licenseExistsOptions);
      expect(result).toEqual({ errors: [] });
    });

    it('should return true with case insensitive match by default', async () => {
      mockGetContent.mockResolvedValue({
        data: [
          { name: 'license.md', type: 'file' },
          { name: 'README.md', type: 'file' },
        ],
      });

      const result = await licenseExists(mockOctokit, mockRepository, {} as licenseExistsOptions);
      expect(result).toEqual({ errors: [] });
    });

    it('should return true when custom license path is specified', async () => {
      mockGetContent.mockResolvedValue({
        data: [
          { name: 'LICENSE.txt', type: 'file' },
          { name: 'README.md', type: 'file' },
        ],
      });

      const result = await licenseExists(mockOctokit, mockRepository, { path: 'LICENSE.txt' } as licenseExistsOptions);
      expect(result).toEqual({ errors: [] });
    });
  });

  describe('when LICENSE file does not exist', () => {
    it('should return false when LICENSE.md is not found', async () => {
      mockGetContent.mockResolvedValue({
        data: [
          { name: 'README.md', type: 'file' },
          { name: 'package.json', type: 'file' },
        ],
      });

      const result = await licenseExists(mockOctokit, mockRepository, {} as licenseExistsOptions);
      expect(result).toEqual({ errors: ['LICENSE.md not found'] });
    });

    it('should return false when repository is empty', async () => {
      mockGetContent.mockResolvedValue({
        data: [],
      });

      const result = await licenseExists(mockOctokit, mockRepository, {} as licenseExistsOptions);
      expect(result).toEqual({ errors: ['LICENSE.md not found'] });
    });
  });

  describe('with caseSensitive option', () => {
    it('should return true when exact case matches with caseSensitive: true', async () => {
      mockGetContent.mockResolvedValue({
        data: [{ name: 'LICENSE.md', type: 'file' }],
      });

      const result = await licenseExists(mockOctokit, mockRepository, {
        path: 'LICENSE.md',
        caseSensitive: true,
      });
      expect(result).toEqual({ errors: [] });
    });

    it('should return false when case does not match with caseSensitive: true', async () => {
      mockGetContent.mockResolvedValue({
        data: [{ name: 'license.md', type: 'file' }],
      });

      const result = await licenseExists(mockOctokit, mockRepository, {
        path: 'LICENSE.md',
        caseSensitive: true,
      });
      expect(result).toEqual({ errors: ['LICENSE.md not found'] });
    });
  });

  describe('invalid options', () => {
    it('should throw an error when caseSensitive is not a boolean', async () => {
      mockGetContent.mockResolvedValue({
        data: [{ name: 'LICENSE.md', type: 'file' }],
      });

      await expect(
        licenseExists(mockOctokit, mockRepository, { caseSensitive: 'yes' } as unknown as licenseExistsOptions),
      ).rejects.toThrow('Invalid rule options');
    });

    it('should throw an error when path is not a string', async () => {
      mockGetContent.mockResolvedValue({
        data: [{ name: 'LICENSE.md', type: 'file' }],
      });

      await expect(
        licenseExists(mockOctokit, mockRepository, { path: 123 } as unknown as licenseExistsOptions),
      ).rejects.toThrow('Invalid rule options');
    });
  });
});

describe('licenseExistsOptionsSchema', () => {
  it('should parse empty options with defaults', () => {
    const result = licenseExistsOptionsSchema.parse({});
    expect(result).toEqual({ path: 'LICENSE.md', caseSensitive: false });
  });

  it('should parse options with custom path', () => {
    const result = licenseExistsOptionsSchema.parse({ path: 'LICENSE.txt' });
    expect(result).toEqual({ path: 'LICENSE.txt', caseSensitive: false });
  });

  it('should parse options with caseSensitive: true', () => {
    const result = licenseExistsOptionsSchema.parse({ caseSensitive: true });
    expect(result).toEqual({ path: 'LICENSE.md', caseSensitive: true });
  });

  it('should parse options with all values specified', () => {
    const result = licenseExistsOptionsSchema.parse({ path: 'COPYING', caseSensitive: true });
    expect(result).toEqual({ path: 'COPYING', caseSensitive: true });
  });

  it('should throw when path is not a string', () => {
    expect(() => licenseExistsOptionsSchema.parse({ path: 123 })).toThrow();
  });

  it('should throw when caseSensitive is not a boolean', () => {
    expect(() => licenseExistsOptionsSchema.parse({ caseSensitive: 'yes' })).toThrow();
  });
});
