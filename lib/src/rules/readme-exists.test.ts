import type { getOctokit } from '@actions/github';
import { readmeExists, ReadmeExistsOptionsSchema, type ReadmeExistsOptions } from './readme-exists';
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

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await readmeExists(context, {});
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
          { name: 'readme.md', type: 'file' },
          { name: 'package.json', type: 'file' },
        ],
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await readmeExists(context, {});
      expect(result).toEqual({ errors: [] });
    });

    it('should return true when custom readme path is specified', async () => {
      mockGetContent.mockResolvedValue({
        data: [
          { name: 'docs.md', type: 'file' },
          { name: 'package.json', type: 'file' },
        ],
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await readmeExists(context, { path: 'docs.md' });
      expect(result).toEqual({ errors: [] });
    });

    it('should return true for README without extension', async () => {
      mockGetContent.mockResolvedValue({
        data: [
          { name: 'README', type: 'file' },
          { name: 'package.json', type: 'file' },
        ],
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await readmeExists(context, { path: 'README' });
      expect(result).toEqual({ errors: [] });
    });
  });

  describe('when README file does not exist', () => {
    it('should return false when README.md is not found', async () => {
      mockGetContent.mockResolvedValue({
        data: [
          { name: 'package.json', type: 'file' },
          { name: 'src', type: 'dir' },
        ],
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await readmeExists(context, {});
      expect(result).toEqual({ errors: ['README.md not found'] });
    });

    it('should return false when repository is empty', async () => {
      mockGetContent.mockResolvedValue({
        data: [],
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await readmeExists(context, {});
      expect(result).toEqual({ errors: ['README.md not found'] });
    });

    it('should return false when only directories exist', async () => {
      mockGetContent.mockResolvedValue({
        data: [
          { name: 'src', type: 'dir' },
          { name: 'docs', type: 'dir' },
        ],
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await readmeExists(context, {});
      expect(result).toEqual({ errors: ['README.md not found'] });
    });
  });

  describe('with caseSensitive option', () => {
    it('should return true when exact case matches with caseSensitive: true', async () => {
      mockGetContent.mockResolvedValue({
        data: [
          { name: 'README.md', type: 'file' },
          { name: 'package.json', type: 'file' },
        ],
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await readmeExists(context, { caseSensitive: true });
      expect(result).toEqual({ errors: [] });
    });

    it('should return false when case does not match with caseSensitive: true', async () => {
      mockGetContent.mockResolvedValue({
        data: [
          { name: 'readme.md', type: 'file' },
          { name: 'package.json', type: 'file' },
        ],
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await readmeExists(context, { caseSensitive: true });
      expect(result).toEqual({ errors: ['README.md not found'] });
    });

    it('should return false for Readme.md when looking for README.md with caseSensitive: true', async () => {
      mockGetContent.mockResolvedValue({
        data: [
          { name: 'Readme.md', type: 'file' },
          { name: 'package.json', type: 'file' },
        ],
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await readmeExists(context, { caseSensitive: true });
      expect(result).toEqual({ errors: ['README.md not found'] });
    });
  });

  describe('invalid options', () => {
    it('should throw an error when caseSensitive is not a boolean', async () => {
      mockGetContent.mockResolvedValue({
        data: [{ name: 'README.md', type: 'file' }],
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      await expect(
        readmeExists(context, { caseSensitive: 'true' } as unknown as ReadmeExistsOptions),
      ).rejects.toThrow('Invalid rule options');
    });

    it('should throw an error when path is not a string', async () => {
      mockGetContent.mockResolvedValue({
        data: [{ name: 'README.md', type: 'file' }],
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      await expect(
        readmeExists(context, { path: 123 } as unknown as ReadmeExistsOptions),
      ).rejects.toThrow('Invalid rule options');
    });
  });
});

describe('ReadmeExistsOptionsSchema', () => {
  it('should parse empty options with defaults', () => {
    const result = ReadmeExistsOptionsSchema.parse({});
    expect(result).toEqual({ path: 'README.md', caseSensitive: false });
  });

  it('should parse options with custom path', () => {
    const result = ReadmeExistsOptionsSchema.parse({ path: 'docs.md' });
    expect(result).toEqual({ path: 'docs.md', caseSensitive: false });
  });

  it('should parse options with caseSensitive: true', () => {
    const result = ReadmeExistsOptionsSchema.parse({ caseSensitive: true });
    expect(result).toEqual({ path: 'README.md', caseSensitive: true });
  });

  it('should parse options with all values specified', () => {
    const result = ReadmeExistsOptionsSchema.parse({ path: 'README.txt', caseSensitive: true });
    expect(result).toEqual({ path: 'README.txt', caseSensitive: true });
  });

  it('should throw when path is not a string', () => {
    expect(() => ReadmeExistsOptionsSchema.parse({ path: 123 })).toThrow();
  });

  it('should throw when caseSensitive is not a boolean', () => {
    expect(() => ReadmeExistsOptionsSchema.parse({ caseSensitive: 'true' })).toThrow();
  });

  it('should parse options with array of paths', () => {
    const result = ReadmeExistsOptionsSchema.parse({ path: ['README.md', 'README.rst'] });
    expect(result).toEqual({ path: ['README.md', 'README.rst'], caseSensitive: false });
  });

  it('should throw when array is empty', () => {
    expect(() => ReadmeExistsOptionsSchema.parse({ path: [] })).toThrow();
  });
});

describe('readmeExists with alternative paths', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should pass when first alternative exists', async () => {
    mockGetContent.mockResolvedValue({
      data: [
        { name: 'README.md', type: 'file' },
      ],
    });

    const context = new RuleContext(mockOctokit, mockRepository);
    const result = await readmeExists(context, { path: ['README.md', 'README.rst'] });
    expect(result).toEqual({ errors: [] });
  });

  it('should pass when second alternative exists', async () => {
    mockGetContent.mockResolvedValue({
      data: [
        { name: 'README.rst', type: 'file' },
      ],
    });

    const context = new RuleContext(mockOctokit, mockRepository);
    const result = await readmeExists(context, { path: ['README.md', 'README.rst'] });
    expect(result).toEqual({ errors: [] });
  });

  it('should fail when no alternatives exist', async () => {
    mockGetContent.mockResolvedValue({
      data: [
        { name: 'package.json', type: 'file' },
      ],
    });

    const context = new RuleContext(mockOctokit, mockRepository);
    const result = await readmeExists(context, { path: ['README.md', 'README.rst'] });
    expect(result).toEqual({ errors: ['one of [README.md, README.rst] not found'] });
  });
});
