import type { getOctokit } from '@actions/github';
import { licenseExists, LicenseExistsOptionsSchema, type LicenseExistsOptions } from './license-exists';
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

describe('licenseExists', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when LICENSE file exists', () => {
    it('should return true when LICENSE.md exists (default path)', async () => {
      mockGetContent.mockResolvedValue({
        data: [
          { name: 'LICENSE.md', type: 'file' },
          { name: 'package.json', type: 'file' },
        ],
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await licenseExists(context, {});
      expect(result).toEqual({ errors: [] });
      expect(mockGetContent).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        path: '',
      });
    });

    it('should return true with case insensitive match by default', async () => {
      mockGetContent.mockResolvedValue({
        data: [
          { name: 'license.md', type: 'file' },
          { name: 'package.json', type: 'file' },
        ],
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await licenseExists(context, {});
      expect(result).toEqual({ errors: [] });
    });

    it('should return true when custom license path is specified', async () => {
      mockGetContent.mockResolvedValue({
        data: [
          { name: 'LICENSE', type: 'file' },
          { name: 'package.json', type: 'file' },
        ],
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await licenseExists(context, { path: 'LICENSE' });
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

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await licenseExists(context, {});
      expect(result).toEqual({ errors: ['LICENSE.md not found'] });
    });

    it('should return false when repository is empty', async () => {
      mockGetContent.mockResolvedValue({
        data: [],
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await licenseExists(context, {});
      expect(result).toEqual({ errors: ['LICENSE.md not found'] });
    });
  });

  describe('with caseSensitive option', () => {
    it('should return true when exact case matches with caseSensitive: true', async () => {
      mockGetContent.mockResolvedValue({
        data: [
          { name: 'LICENSE.md', type: 'file' },
          { name: 'package.json', type: 'file' },
        ],
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await licenseExists(context, { caseSensitive: true });
      expect(result).toEqual({ errors: [] });
    });

    it('should return false when case does not match with caseSensitive: true', async () => {
      mockGetContent.mockResolvedValue({
        data: [
          { name: 'license.md', type: 'file' },
          { name: 'package.json', type: 'file' },
        ],
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await licenseExists(context, { caseSensitive: true });
      expect(result).toEqual({ errors: ['LICENSE.md not found'] });
    });
  });

  describe('invalid options', () => {
    it('should throw an error when caseSensitive is not a boolean', async () => {
      mockGetContent.mockResolvedValue({
        data: [{ name: 'LICENSE.md', type: 'file' }],
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      await expect(
        licenseExists(context, { caseSensitive: 'true' } as unknown as LicenseExistsOptions),
      ).rejects.toThrow('Invalid rule options');
    });

    it('should throw an error when path is not a string', async () => {
      mockGetContent.mockResolvedValue({
        data: [{ name: 'LICENSE.md', type: 'file' }],
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      await expect(
        licenseExists(context, { path: 123 } as unknown as LicenseExistsOptions),
      ).rejects.toThrow('Invalid rule options');
    });
  });
});

describe('LicenseExistsOptionsSchema', () => {
  it('should parse empty options with defaults', () => {
    const result = LicenseExistsOptionsSchema.parse({});
    expect(result).toEqual({ path: 'LICENSE.md', caseSensitive: false });
  });

  it('should parse options with custom path', () => {
    const result = LicenseExistsOptionsSchema.parse({ path: 'LICENSE' });
    expect(result).toEqual({ path: 'LICENSE', caseSensitive: false });
  });

  it('should parse options with caseSensitive: true', () => {
    const result = LicenseExistsOptionsSchema.parse({ caseSensitive: true });
    expect(result).toEqual({ path: 'LICENSE.md', caseSensitive: true });
  });

  it('should parse options with all values specified', () => {
    const result = LicenseExistsOptionsSchema.parse({ path: 'LICENSE.txt', caseSensitive: true });
    expect(result).toEqual({ path: 'LICENSE.txt', caseSensitive: true });
  });

  it('should throw when path is not a string', () => {
    expect(() => LicenseExistsOptionsSchema.parse({ path: 123 })).toThrow();
  });

  it('should throw when caseSensitive is not a boolean', () => {
    expect(() => LicenseExistsOptionsSchema.parse({ caseSensitive: 'true' })).toThrow();
  });
});
