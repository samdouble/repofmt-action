import type { getOctokit } from '@actions/github';
import { RuleContext } from '../utils/context';
import {
    readmeHasBadges,
    ReadmeHasBadgesOptionsSchema,
    type ReadmeHasBadgesOptions,
} from './readme-has-badges';

const mockGetFileContent = jest.fn();
const mockOctokit = {
  rest: {
    repos: {
      getContent: jest.fn(),
    },
  },
} as unknown as ReturnType<typeof getOctokit>;

const mockRepository = {
  owner: { login: 'test-owner' },
  name: 'test-repo',
  full_name: 'test-owner/test-repo',
} as ConstructorParameters<typeof RuleContext>[1];

describe('readmeHasBadges', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetFileContent.mockClear();
  });

  describe('when README contains badges', () => {
    it('should pass when README has at least one badge', async () => {
      const content = `# Project
[![CI](https://github.com/test/badge.svg)](https://github.com/test)
Some content here.
`;

      const context = new RuleContext(mockOctokit, mockRepository);
      context.getFileContent = jest.fn().mockResolvedValue(content);

      const result = await readmeHasBadges(context, {});
      expect(result).toEqual({ errors: [] });
    });

    it('should pass when README has multiple badges', async () => {
      const content = `[![CI](https://github.com/test/badge.svg)](https://github.com/test)
[![Coverage](https://coveralls.io/badge.svg)](https://coveralls.io)
[![Node.js](https://img.shields.io/badge/Node.js-6DA55F)](https://nodejs.org)
`;

      const context = new RuleContext(mockOctokit, mockRepository);
      context.getFileContent = jest.fn().mockResolvedValue(content);

      const result = await readmeHasBadges(context, {});
      expect(result).toEqual({ errors: [] });
    });

    it('should pass when badges meet minimum count requirement', async () => {
      const content = `[![CI](https://github.com/test/badge.svg)](https://github.com/test)
[![Coverage](https://coveralls.io/badge.svg)](https://coveralls.io)
[![Node.js](https://img.shields.io/badge/Node.js-6DA55F)](https://nodejs.org)
`;

      const context = new RuleContext(mockOctokit, mockRepository);
      context.getFileContent = jest.fn().mockResolvedValue(content);

      const result = await readmeHasBadges(context, { minCount: 3 });
      expect(result).toEqual({ errors: [] });
    });

    it('should pass when badges match required patterns', async () => {
      const content = `[![CI](https://github.com/test/badge.svg)](https://github.com/test)
[![Coverage](https://coveralls.io/badge.svg)](https://coveralls.io)
`;

      const context = new RuleContext(mockOctokit, mockRepository);
      context.getFileContent = jest.fn().mockResolvedValue(content);

      const result = await readmeHasBadges(context, {
        patterns: ['CI', 'Coverage'],
      });
      expect(result).toEqual({ errors: [] });
    });

    it('should pass when badges match patterns case-insensitively', async () => {
      const content = `[![ci](https://github.com/test/badge.svg)](https://github.com/test)
`;

      const context = new RuleContext(mockOctokit, mockRepository);
      context.getFileContent = jest.fn().mockResolvedValue(content);

      const result = await readmeHasBadges(context, {
        patterns: ['CI'],
      });
      expect(result).toEqual({ errors: [] });
    });

    it('should pass when pattern matches URL', async () => {
      const content = `[![Badge](https://github.com/test/badge.svg)](https://github.com/test)
`;

      const context = new RuleContext(mockOctokit, mockRepository);
      context.getFileContent = jest.fn().mockResolvedValue(content);

      const result = await readmeHasBadges(context, {
        patterns: ['github.com'],
      });
      expect(result).toEqual({ errors: [] });
    });
  });

  describe('when README does not contain badges', () => {
    it('should fail when README has no badges', async () => {
      const content = `# Project
Some content here.
No badges in this file.
`;

      const context = new RuleContext(mockOctokit, mockRepository);
      context.getFileContent = jest.fn().mockResolvedValue(content);

      const result = await readmeHasBadges(context, {});
      expect(result).toEqual({
        errors: ['README.md: no badges found'],
      });
    });

    it('should fail when badges are below minimum count', async () => {
      const content = `[![CI](https://github.com/test/badge.svg)](https://github.com/test)
`;

      const context = new RuleContext(mockOctokit, mockRepository);
      context.getFileContent = jest.fn().mockResolvedValue(content);

      const result = await readmeHasBadges(context, { minCount: 3 });
      expect(result).toEqual({
        errors: ['README.md: found 1 badge(s), but expected at least 3'],
      });
    });

    it('should fail when required pattern is missing', async () => {
      const content = `[![CI](https://github.com/test/badge.svg)](https://github.com/test)
`;

      const context = new RuleContext(mockOctokit, mockRepository);
      context.getFileContent = jest.fn().mockResolvedValue(content);

      const result = await readmeHasBadges(context, {
        patterns: ['Coverage'],
      });
      expect(result).toEqual({
        errors: ['README.md: no badge found matching pattern "Coverage"'],
      });
    });

    it('should fail when multiple required patterns are missing', async () => {
      const content = `[![CI](https://github.com/test/badge.svg)](https://github.com/test)
`;

      const context = new RuleContext(mockOctokit, mockRepository);
      context.getFileContent = jest.fn().mockResolvedValue(content);

      const result = await readmeHasBadges(context, {
        patterns: ['Coverage', 'Node.js'],
      });
      expect(result).toEqual({
        errors: [
          'README.md: no badge found matching pattern "Coverage"',
          'README.md: no badge found matching pattern "Node.js"',
        ],
      });
    });

    it('should pass only when ALL patterns are found', async () => {
      const content = `[![CI](https://github.com/test/badge.svg)](https://github.com/test)
[![Coverage](https://coveralls.io/badge.svg)](https://coveralls.io)
[![Node.js](https://img.shields.io/badge/Node.js-6DA55F)](https://nodejs.org)
`;

      const context = new RuleContext(mockOctokit, mockRepository);
      context.getFileContent = jest.fn().mockResolvedValue(content);

      const result = await readmeHasBadges(context, {
        patterns: ['CI', 'Coverage', 'Node.js'],
      });
      expect(result).toEqual({ errors: [] });
    });

    it('should fail when only some patterns are found', async () => {
      const content = `[![CI](https://github.com/test/badge.svg)](https://github.com/test)
[![Coverage](https://coveralls.io/badge.svg)](https://coveralls.io)
`;

      const context = new RuleContext(mockOctokit, mockRepository);
      context.getFileContent = jest.fn().mockResolvedValue(content);

      const result = await readmeHasBadges(context, {
        patterns: ['CI', 'Coverage', 'Node.js'],
      });
      expect(result).toEqual({
        errors: ['README.md: no badge found matching pattern "Node.js"'],
      });
    });
  });

  describe('when README file does not exist', () => {
    it('should return error when file is not found', async () => {
      const context = new RuleContext(mockOctokit, mockRepository);
      context.getFileContent = jest
        .fn()
        .mockRejectedValue(new Error('File not found'));

      const result = await readmeHasBadges(context, {});
      expect(result).toEqual({
        errors: ['README.md: File not found'],
      });
    });
  });

  describe('with custom path', () => {
    it('should check custom README path', async () => {
      const content = `[![CI](https://github.com/test/badge.svg)](https://github.com/test)
`;

      const context = new RuleContext(mockOctokit, mockRepository);
      context.getFileContent = jest.fn().mockResolvedValue(content);

      const result = await readmeHasBadges(context, { path: 'docs/README.md' });
      expect(result).toEqual({ errors: [] });
      expect(context.getFileContent).toHaveBeenCalledWith('docs/README.md');
    });

    it('should use custom path in error messages', async () => {
      const content = `No badges here.
`;

      const context = new RuleContext(mockOctokit, mockRepository);
      context.getFileContent = jest.fn().mockResolvedValue(content);

      const result = await readmeHasBadges(context, { path: 'docs/README.md' });
      expect(result).toEqual({
        errors: ['docs/README.md: no badges found'],
      });
    });
  });

  describe('edge cases', () => {
    it('should handle badges with special characters in alt text', async () => {
      const content = `[![CI/CD](https://github.com/test/badge.svg)](https://github.com/test)
`;

      const context = new RuleContext(mockOctokit, mockRepository);
      context.getFileContent = jest.fn().mockResolvedValue(content);

      const result = await readmeHasBadges(context, {});
      expect(result).toEqual({ errors: [] });
    });

    it('should handle badges with query parameters in URLs', async () => {
      const content = `[![Coverage](https://coveralls.io/badge.svg?branch=master)](https://coveralls.io)
`;

      const context = new RuleContext(mockOctokit, mockRepository);
      context.getFileContent = jest.fn().mockResolvedValue(content);

      const result = await readmeHasBadges(context, {});
      expect(result).toEqual({ errors: [] });
    });

    it('should not match non-badge markdown links', async () => {
      const content = `[Regular Link](https://example.com)
[![Badge](https://badge.svg)](https://example.com)
`;

      const context = new RuleContext(mockOctokit, mockRepository);
      context.getFileContent = jest.fn().mockResolvedValue(content);

      const result = await readmeHasBadges(context, {});
      expect(result).toEqual({ errors: [] });
    });

    it('should handle empty README', async () => {
      const content = '';

      const context = new RuleContext(mockOctokit, mockRepository);
      context.getFileContent = jest.fn().mockResolvedValue(content);

      const result = await readmeHasBadges(context, {});
      expect(result).toEqual({
        errors: ['README.md: no badges found'],
      });
    });

    it('should handle minCount of 0', async () => {
      const content = `No badges here.
`;

      const context = new RuleContext(mockOctokit, mockRepository);
      context.getFileContent = jest.fn().mockResolvedValue(content);

      const result = await readmeHasBadges(context, { minCount: 0 });
      expect(result).toEqual({ errors: [] });
    });
  });

  describe('invalid options', () => {
    it('should throw an error when minCount is negative', async () => {
      const context = new RuleContext(mockOctokit, mockRepository);
      await expect(
        readmeHasBadges(context, { minCount: -1 } as unknown as ReadmeHasBadgesOptions),
      ).rejects.toThrow('Invalid rule options');
    });

    it('should throw an error when path is not a string', async () => {
      const context = new RuleContext(mockOctokit, mockRepository);
      await expect(
        readmeHasBadges(context, { path: 123 } as unknown as ReadmeHasBadgesOptions),
      ).rejects.toThrow('Invalid rule options');
    });

    it('should throw an error when patterns is not an array', async () => {
      const context = new RuleContext(mockOctokit, mockRepository);
      await expect(
        readmeHasBadges(context, { patterns: 'CI' } as unknown as ReadmeHasBadgesOptions),
      ).rejects.toThrow('Invalid rule options');
    });
  });
});

describe('ReadmeHasBadgesOptionsSchema', () => {
  it('should parse empty options with defaults', () => {
    const result = ReadmeHasBadgesOptionsSchema.parse({});
    expect(result).toEqual({ path: 'README.md' });
  });

  it('should parse options with custom path', () => {
    const result = ReadmeHasBadgesOptionsSchema.parse({ path: 'docs.md' });
    expect(result).toEqual({ path: 'docs.md' });
  });

  it('should parse options with minCount', () => {
    const result = ReadmeHasBadgesOptionsSchema.parse({ minCount: 3 });
    expect(result).toEqual({ path: 'README.md', minCount: 3 });
  });

  it('should parse options with patterns', () => {
    const result = ReadmeHasBadgesOptionsSchema.parse({ patterns: ['CI', 'Coverage'] });
    expect(result).toEqual({ path: 'README.md', patterns: ['CI', 'Coverage'] });
  });

  it('should parse options with all values specified', () => {
    const result = ReadmeHasBadgesOptionsSchema.parse({
      path: 'README.txt',
      minCount: 2,
      patterns: ['CI'],
    });
    expect(result).toEqual({
      path: 'README.txt',
      minCount: 2,
      patterns: ['CI'],
    });
  });

  it('should throw when path is not a string', () => {
    expect(() => ReadmeHasBadgesOptionsSchema.parse({ path: 123 })).toThrow();
  });

  it('should throw when minCount is negative', () => {
    expect(() => ReadmeHasBadgesOptionsSchema.parse({ minCount: -1 })).toThrow();
  });

  it('should throw when minCount is not an integer', () => {
    expect(() => ReadmeHasBadgesOptionsSchema.parse({ minCount: 1.5 })).toThrow();
  });

  it('should throw when patterns is not an array', () => {
    expect(() => ReadmeHasBadgesOptionsSchema.parse({ patterns: 'CI' })).toThrow();
  });

  it('should accept minCount of 0', () => {
    const result = ReadmeHasBadgesOptionsSchema.parse({ minCount: 0 });
    expect(result).toEqual({ path: 'README.md', minCount: 0 });
  });
});
