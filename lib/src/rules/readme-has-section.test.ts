import type { getOctokit } from '@actions/github';
import { RuleContext } from '../utils/context';
import { readmeHasSection, ReadmeHasSectionOptions } from './readme-has-section';

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

describe('readmeHasSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when README contains the section', () => {
    it('should return no errors for default README.md path', async () => {
      mockGetContent.mockImplementation(({ path }) => {
        if (path === 'README.md') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from('## Usage\n\nThis is how you use it.').toString('base64'),
            },
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await readmeHasSection(context, {
        section: 'Usage',
      });

      expect(result).toEqual({ errors: [] });
    });

    it('should work with case-insensitive matching by default', async () => {
      mockGetContent.mockImplementation(({ path }) => {
        if (path === 'README.md') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from('## usage\n\nThis is how you use it.').toString('base64'),
            },
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await readmeHasSection(context, {
        section: 'Usage',
      });

      expect(result).toEqual({ errors: [] });
    });

    it('should work with case-sensitive matching when specified', async () => {
      mockGetContent.mockImplementation(({ path }) => {
        if (path === 'README.md') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from('## Usage\n\nThis is how you use it.').toString('base64'),
            },
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await readmeHasSection(context, {
        section: 'Usage',
        caseSensitive: true,
      });

      expect(result).toEqual({ errors: [] });
    });

    it('should work with custom path', async () => {
      mockGetContent.mockImplementation(({ path }) => {
        if (path === 'docs/README.md') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from('## Installation\n\nInstall it like this.').toString('base64'),
            },
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await readmeHasSection(context, {
        section: 'Installation',
        path: 'docs/README.md',
      });

      expect(result).toEqual({ errors: [] });
    });

    it('should find section even if there is content before it', async () => {
      mockGetContent.mockImplementation(({ path }) => {
        if (path === 'README.md') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from('# My Project\n\nSome description.\n\n## Usage\n\nThis is how you use it.').toString('base64'),
            },
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await readmeHasSection(context, {
        section: 'Usage',
      });

      expect(result).toEqual({ errors: [] });
    });
  });

  describe('when README does not contain the section', () => {
    it('should return an error', async () => {
      mockGetContent.mockImplementation(({ path }) => {
        if (path === 'README.md') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from('# My Project\n\nSome description.').toString('base64'),
            },
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await readmeHasSection(context, {
        section: 'Usage',
      });

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe('README.md: file does not contain "## Usage"');
    });

    it('should respect case-sensitive matching', async () => {
      mockGetContent.mockImplementation(({ path }) => {
        if (path === 'README.md') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from('## usage\n\nThis is how you use it.').toString('base64'),
            },
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await readmeHasSection(context, {
        section: 'Usage',
        caseSensitive: true,
      });

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe('README.md: file does not contain "## Usage"');
    });

    it('should match partial section names (substring matching)', async () => {
      mockGetContent.mockImplementation(({ path }) => {
        if (path === 'README.md') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from('## Usage Examples\n\nSome examples.').toString('base64'),
            },
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await readmeHasSection(context, {
        section: 'Usage',
      });

      expect(result).toEqual({ errors: [] });
    });
  });

  describe('when README does not exist', () => {
    it('should return an error', async () => {
      mockGetContent.mockRejectedValue(new Error('Not found'));

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await readmeHasSection(context, {
        section: 'Usage',
      });

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatch(/^README\.md: /);
    });
  });

  describe('caching', () => {
    it('should cache file content', async () => {
      mockGetContent.mockImplementation(({ path }) => {
        if (path === 'README.md') {
          return Promise.resolve({
            data: {
              type: 'file',
              content: Buffer.from('## Usage\n\nThis is how you use it.').toString('base64'),
            },
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      await readmeHasSection(context, {
        section: 'Usage',
      });
      await readmeHasSection(context, {
        section: 'Installation',
      });

      expect(mockGetContent).toHaveBeenCalledTimes(1);
    });
  });

  describe('validation', () => {
    it('should throw error when section is missing', async () => {
      const context = new RuleContext(mockOctokit, mockRepository);
      
      await expect(
        readmeHasSection(context, {} as ReadmeHasSectionOptions),
      ).rejects.toThrow('Invalid rule options');
    });
  });
});
