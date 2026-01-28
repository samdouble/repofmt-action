import type { getOctokit } from '@actions/github';
import { RuleContext } from '../utils/context';
import { requirementsTxtDependenciesAlphabeticalOrder } from './requirements-txt-dependencies-alphabetical-order';

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

describe('requirementsTxtDependenciesAlphabeticalOrder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when requirements.txt does not exist', () => {
    it('should return an error', async () => {
      mockGetContent.mockRejectedValue(new Error('Not found'));

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await requirementsTxtDependenciesAlphabeticalOrder(context, {});

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatch(/^requirements\.txt: /);
    });
  });

  describe('when requirements.txt is empty', () => {
    it('should return no errors', async () => {
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from('').toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await requirementsTxtDependenciesAlphabeticalOrder(context, {});

      expect(result).toEqual({ errors: [] });
    });
  });

  describe('when requirements.txt has only comments', () => {
    it('should return no errors', async () => {
      const content = `# This is a comment
# Another comment
`;
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from(content).toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await requirementsTxtDependenciesAlphabeticalOrder(context, {});

      expect(result).toEqual({ errors: [] });
    });
  });

  describe('when dependencies are in alphabetical order', () => {
    it('should return no errors', async () => {
      const content = `black
pytest
requests
`;
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from(content).toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await requirementsTxtDependenciesAlphabeticalOrder(context, {});

      expect(result).toEqual({ errors: [] });
    });
  });

  describe('when dependencies are not in alphabetical order', () => {
    it('should return an error', async () => {
      const content = `requests
black
pytest
`;
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from(content).toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await requirementsTxtDependenciesAlphabeticalOrder(context, {});

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('dependencies are not in alphabetical order');
      expect(result.errors[0]).toContain('black');
      expect(result.errors[0]).toContain('requests');
    });
  });

  describe('when dependencies have version specifiers', () => {
    it('should sort by package name, not version', async () => {
      const content = `black>=23.0.0
pytest>=7.0.0
requests>=2.28.0
`;
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from(content).toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await requirementsTxtDependenciesAlphabeticalOrder(context, {});

      expect(result).toEqual({ errors: [] });
    });
  });

  describe('when dependencies have version specifiers and are out of order', () => {
    it('should return an error', async () => {
      const content = `requests>=2.28.0
black>=23.0.0
pytest>=7.0.0
`;
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from(content).toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await requirementsTxtDependenciesAlphabeticalOrder(context, {});

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('dependencies are not in alphabetical order');
      expect(result.errors[0]).toContain('black');
      expect(result.errors[0]).toContain('requests');
    });
  });

  describe('when dependencies have extras', () => {
    it('should sort by package name including extras', async () => {
      const content = `black[dev]>=23.0.0
pytest>=7.0.0
requests[security]>=2.28.0
`;
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from(content).toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await requirementsTxtDependenciesAlphabeticalOrder(context, {});

      expect(result).toEqual({ errors: [] });
    });
  });

  describe('when file has comments and empty lines', () => {
    it('should ignore comments and empty lines', async () => {
      const content = `# Production dependencies
black
pytest

# Development dependencies
requests
`;
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from(content).toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await requirementsTxtDependenciesAlphabeticalOrder(context, {});

      expect(result).toEqual({ errors: [] });
    });
  });

  describe('when file has inline comments', () => {
    it('should preserve the dependency line but ignore the comment', async () => {
      const content = `black>=23.0.0  # Formatter
pytest>=7.0.0  # Testing framework
requests>=2.28.0  # HTTP library
`;
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from(content).toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await requirementsTxtDependenciesAlphabeticalOrder(context, {});

      expect(result).toEqual({ errors: [] });
    });
  });

  describe('when custom path is provided', () => {
    it('should check the custom path', async () => {
      const content = `black
pytest
requests
`;
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from(content).toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await requirementsTxtDependenciesAlphabeticalOrder(context, {
        path: 'requirements-dev.txt',
      });

      expect(mockGetContent).toHaveBeenCalledWith(
        expect.objectContaining({
          path: 'requirements-dev.txt',
        }),
      );
      expect(result).toEqual({ errors: [] });
    });
  });

  describe('when dependencies include editable installs', () => {
    it('should handle -e . correctly', async () => {
      const content = `-e .
black
pytest
requests
`;
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from(content).toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await requirementsTxtDependenciesAlphabeticalOrder(context, {});

      expect(result).toEqual({ errors: [] });
    });

    it('should handle -e ./local-package correctly', async () => {
      const content = `black
-e ./local-package
pytest
requests
`;
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from(content).toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await requirementsTxtDependenciesAlphabeticalOrder(context, {});

      expect(result).toEqual({ errors: [] });
    });
  });

  describe('when dependencies include git URLs', () => {
    it('should handle git URLs', async () => {
      const content = `black
pytest
git+https://github.com/user/repo.git
requests
`;
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from(content).toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await requirementsTxtDependenciesAlphabeticalOrder(context, {});

      // The git URL should be sorted by the repo name (repo comes after pytest)
      expect(result).toEqual({ errors: [] });
    });

    it('should handle git URLs with egg parameter', async () => {
      const content = `black
pytest
git+https://github.com/user/repo.git@branch#egg=my-package
requests
`;
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from(content).toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await requirementsTxtDependenciesAlphabeticalOrder(context, {});

      // The git URL should be sorted by the egg name (my-package comes after pytest)
      expect(result).toEqual({ errors: [] });
    });
  });

  describe('caching', () => {
    it('should cache file content', async () => {
      const content = `black
pytest
requests
`;
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from(content).toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      await requirementsTxtDependenciesAlphabeticalOrder(context, {});
      await requirementsTxtDependenciesAlphabeticalOrder(context, {});

      expect(mockGetContent).toHaveBeenCalledTimes(1);
    });
  });
});
