import type { getOctokit } from '@actions/github';
import { RuleContext } from '../utils/context';
import { pyprojectDependenciesAlphabeticalOrder } from './pyproject-dependencies-alphabetical-order';

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

describe('pyprojectDependenciesAlphabeticalOrder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when pyproject.toml does not exist', () => {
    it('should return an error', async () => {
      mockGetContent.mockRejectedValue(new Error('Not found'));

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await pyprojectDependenciesAlphabeticalOrder(context, {});

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatch(/^pyproject\.toml: /);
    });
  });

  describe('when pyproject.toml has invalid TOML', () => {
    it('should return a parsing error', async () => {
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from('invalid toml content [unclosed').toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await pyprojectDependenciesAlphabeticalOrder(context, {});

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatch(/^pyproject\.toml: failed to parse TOML:/);
    });
  });

  describe('when project.dependencies are in alphabetical order', () => {
    it('should return no errors', async () => {
      const tomlContent = `
[project]
name = "test-project"
dependencies = [
  "black",
  "pytest",
  "requests",
]
`;
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from(tomlContent).toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await pyprojectDependenciesAlphabeticalOrder(context, {});

      expect(result).toEqual({ errors: [] });
    });
  });

  describe('when project.dependencies are not in alphabetical order', () => {
    it('should return an error', async () => {
      const tomlContent = `
[project]
name = "test-project"
dependencies = [
  "requests",
  "black",
  "pytest",
]
`;
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from(tomlContent).toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await pyprojectDependenciesAlphabeticalOrder(context, {});

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('dependencies are not in alphabetical order');
      expect(result.errors[0]).toContain('black');
      expect(result.errors[0]).toContain('requests');
    });
  });

  describe('when project.dependencies have version specifiers', () => {
    it('should sort by package name, not version', async () => {
      const tomlContent = `
[project]
name = "test-project"
dependencies = [
  "black>=23.0.0",
  "pytest>=7.0.0",
  "requests>=2.28.0",
]
`;
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from(tomlContent).toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await pyprojectDependenciesAlphabeticalOrder(context, {});

      expect(result).toEqual({ errors: [] });
    });
  });

  describe('when project.optional-dependencies are in alphabetical order', () => {
    it('should return no errors', async () => {
      const tomlContent = `
[project]
name = "test-project"
dependencies = []

[project.optional-dependencies]
dev = [
  "black",
  "pytest",
  "requests",
]
test = [
  "coverage",
  "pytest-cov",
]
`;
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from(tomlContent).toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await pyprojectDependenciesAlphabeticalOrder(context, {});

      expect(result).toEqual({ errors: [] });
    });
  });

  describe('when project.optional-dependencies are not in alphabetical order', () => {
    it('should return an error', async () => {
      const tomlContent = `
[project]
name = "test-project"
dependencies = []

[project.optional-dependencies]
dev = [
  "pytest",
  "black",
  "requests",
]
`;
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from(tomlContent).toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await pyprojectDependenciesAlphabeticalOrder(context, {});

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('optional-dependencies.dev');
      expect(result.errors[0]).toContain('dependencies are not in alphabetical order');
    });
  });

  describe('when tool.poetry.dependencies are in alphabetical order', () => {
    it('should return no errors', async () => {
      const tomlContent = `
[tool.poetry]
name = "test-project"

[tool.poetry.dependencies]
python = "^3.9"
black = "^23.0.0"
pytest = "^7.0.0"
requests = "^2.28.0"
`;
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from(tomlContent).toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await pyprojectDependenciesAlphabeticalOrder(context, {});

      expect(result).toEqual({ errors: [] });
    });
  });

  describe('when tool.poetry.dependencies are not in alphabetical order', () => {
    it('should return an error', async () => {
      const tomlContent = `
[tool.poetry]
name = "test-project"

[tool.poetry.dependencies]
python = "^3.9"
pytest = "^7.0.0"
black = "^23.0.0"
requests = "^2.28.0"
`;
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from(tomlContent).toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await pyprojectDependenciesAlphabeticalOrder(context, {});

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('tool.poetry.dependencies');
      expect(result.errors[0]).toContain('dependencies are not in alphabetical order');
    });
  });

  describe('when custom path is provided', () => {
    it('should check the custom path', async () => {
      const tomlContent = `
[project]
name = "test-project"
dependencies = [
  "black",
  "pytest",
  "requests",
]
`;
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from(tomlContent).toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await pyprojectDependenciesAlphabeticalOrder(context, {
        path: 'custom/pyproject.toml',
      });

      expect(mockGetContent).toHaveBeenCalledWith(
        expect.objectContaining({
          path: 'custom/pyproject.toml',
        }),
      );
      expect(result).toEqual({ errors: [] });
    });
  });

  describe('when custom sections are provided', () => {
    it('should only check the specified sections', async () => {
      const tomlContent = `
[project]
name = "test-project"
dependencies = [
  "requests",
  "black",
  "pytest",
]

[tool.poetry.dependencies]
python = "^3.9"
black = "^23.0.0"
pytest = "^7.0.0"
`;
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from(tomlContent).toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await pyprojectDependenciesAlphabeticalOrder(context, {
        sections: ['tool.poetry.dependencies'],
      });

      expect(result).toEqual({ errors: [] });
    });
  });

  describe('when dependencies have extras', () => {
    it('should sort by package name including extras', async () => {
      const tomlContent = `
[project]
name = "test-project"
dependencies = [
  "black[dev]>=23.0.0",
  "pytest>=7.0.0",
  "requests[security]>=2.28.0",
]
`;
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from(tomlContent).toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await pyprojectDependenciesAlphabeticalOrder(context, {});

      expect(result).toEqual({ errors: [] });
    });
  });

  describe('when section does not exist', () => {
    it('should skip the section', async () => {
      const tomlContent = `
[project]
name = "test-project"
`;
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from(tomlContent).toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await pyprojectDependenciesAlphabeticalOrder(context, {});

      expect(result).toEqual({ errors: [] });
    });
  });

  describe('when dependencies array is empty', () => {
    it('should return no errors', async () => {
      const tomlContent = `
[project]
name = "test-project"
dependencies = []
`;
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from(tomlContent).toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      const result = await pyprojectDependenciesAlphabeticalOrder(context, {});

      expect(result).toEqual({ errors: [] });
    });
  });

  describe('caching', () => {
    it('should cache file content', async () => {
      const tomlContent = `
[project]
name = "test-project"
dependencies = [
  "black",
  "pytest",
  "requests",
]
`;
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from(tomlContent).toString('base64'),
        },
      });

      const context = new RuleContext(mockOctokit, mockRepository);
      await pyprojectDependenciesAlphabeticalOrder(context, {});
      await pyprojectDependenciesAlphabeticalOrder(context, {});

      expect(mockGetContent).toHaveBeenCalledTimes(1);
    });
  });
});
