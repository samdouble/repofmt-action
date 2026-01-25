import type { getOctokit } from '@actions/github';
import { run, runRulesForRepo } from './index';
import type { Config } from './utils/config';

const mockGetContent = jest.fn();
const mockListRepos = jest.fn();
const mockOctokit = {
  rest: {
    repos: {
      getContent: mockGetContent,
      listForAuthenticatedUser: mockListRepos,
    },
  },
} as unknown as ReturnType<typeof getOctokit>;

const mockRepository = {
  id: 1,
  name: 'test-repo',
  full_name: 'test-owner/test-repo',
  private: false,
  owner: { login: 'test-owner' },
} as Parameters<typeof runRulesForRepo>[1];

const mockPrivateRepository = {
  id: 2,
  name: 'private-repo',
  full_name: 'test-owner/private-repo',
  private: true,
  owner: { login: 'test-owner' },
} as Parameters<typeof runRulesForRepo>[1];

describe('run', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('filtering', () => {
    it('should include all repositories when no filters are provided', async () => {
      mockListRepos.mockResolvedValue({
        data: [mockRepository, mockPrivateRepository],
      });
      mockGetContent.mockResolvedValue({ data: [] });

      const config: Config = {
        rules: [],
      };

      const results = await run(mockOctokit, config);

      expect(results).toHaveLength(2);
      expect(mockListRepos).toHaveBeenCalledWith({
        visibility: 'all',
        per_page: 100,
      });
    });

    it('should filter by visibility: public', async () => {
      mockListRepos.mockResolvedValue({
        data: [mockRepository, mockPrivateRepository],
      });
      mockGetContent.mockResolvedValue({ data: [] });

      const config: Config = {
        rules: [],
        filters: {
          visibility: 'public',
        },
      };

      const results = await run(mockOctokit, config);

      expect(results).toHaveLength(1);
      expect(results[0].repository).toBe('test-owner/test-repo');
      expect(mockListRepos).toHaveBeenCalledWith({
        visibility: 'public',
        per_page: 100,
      });
    });

    it('should filter by visibility: private', async () => {
      mockListRepos.mockResolvedValue({
        data: [mockRepository, mockPrivateRepository],
      });
      mockGetContent.mockResolvedValue({ data: [] });

      const config: Config = {
        rules: [],
        filters: {
          visibility: 'private',
        },
      };

      const results = await run(mockOctokit, config);

      expect(results).toHaveLength(1);
      expect(results[0].repository).toBe('test-owner/private-repo');
      expect(mockListRepos).toHaveBeenCalledWith({
        visibility: 'private',
        per_page: 100,
      });
    });

    it('should filter by visibility: all', async () => {
      mockListRepos.mockResolvedValue({
        data: [mockRepository, mockPrivateRepository],
      });
      mockGetContent.mockResolvedValue({ data: [] });

      const config: Config = {
        rules: [],
        filters: {
          visibility: 'all',
        },
      };

      const results = await run(mockOctokit, config);

      expect(results).toHaveLength(2);
      expect(mockListRepos).toHaveBeenCalledWith({
        visibility: 'all',
        per_page: 100,
      });
    });

    it('should filter by include', async () => {
      const repo1 = {
        ...mockRepository,
        name: 'my-org-repo1',
        full_name: 'test-owner/my-org-repo1',
      };
      const repo2 = {
        ...mockRepository,
        name: 'other-repo',
        full_name: 'test-owner/other-repo',
      };

      mockListRepos.mockResolvedValue({
        data: [repo1, repo2],
      });
      mockGetContent.mockResolvedValue({ data: [] });

      const config: Config = {
        rules: [],
        filters: {
          include: ['^my-org-'],
        },
      };

      const results = await run(mockOctokit, config);

      expect(results).toHaveLength(1);
      expect(results[0].repository).toBe('test-owner/my-org-repo1');
    });

    it('should filter by include matching full_name', async () => {
      const repo1 = {
        ...mockRepository,
        name: 'repo1',
        full_name: 'my-org/repo1',
      };
      const repo2 = {
        ...mockRepository,
        name: 'repo2',
        full_name: 'other-org/repo2',
      };

      mockListRepos.mockResolvedValue({
        data: [repo1, repo2],
      });
      mockGetContent.mockResolvedValue({ data: [] });

      const config: Config = {
        rules: [],
        filters: {
          include: ['^my-org/'],
        },
      };

      const results = await run(mockOctokit, config);

      expect(results).toHaveLength(1);
      expect(results[0].repository).toBe('my-org/repo1');
    });

    it('should filter by exclude', async () => {
      const repo1 = {
        ...mockRepository,
        name: 'active-repo',
        full_name: 'test-owner/active-repo',
      };
      const repo2 = {
        ...mockRepository,
        name: 'deprecated-repo',
        full_name: 'test-owner/deprecated-repo',
      };

      mockListRepos.mockResolvedValue({
        data: [repo1, repo2],
      });
      mockGetContent.mockResolvedValue({ data: [] });

      const config: Config = {
        rules: [],
        filters: {
          exclude: ['^deprecated-'],
        },
      };

      const results = await run(mockOctokit, config);

      expect(results).toHaveLength(1);
      expect(results[0].repository).toBe('test-owner/active-repo');
    });

    it('should combine include and exclude', async () => {
      const repo1 = {
        ...mockRepository,
        name: 'my-org-active',
        full_name: 'test-owner/my-org-active',
      };
      const repo2 = {
        ...mockRepository,
        name: 'my-org-deprecated',
        full_name: 'test-owner/my-org-deprecated',
      };
      const repo3 = {
        ...mockRepository,
        name: 'other-repo',
        full_name: 'test-owner/other-repo',
      };

      mockListRepos.mockResolvedValue({
        data: [repo1, repo2, repo3],
      });
      mockGetContent.mockResolvedValue({ data: [] });

      const config: Config = {
        rules: [],
        filters: {
          include: ['^my-org-'],
          exclude: ['deprecated'],
        },
      };

      const results = await run(mockOctokit, config);

      expect(results).toHaveLength(1);
      expect(results[0].repository).toBe('test-owner/my-org-active');
    });

    it('should combine visibility and include filters', async () => {
      const publicRepo = {
        ...mockRepository,
        name: 'my-org-public',
        full_name: 'test-owner/my-org-public',
        private: false,
      };
      const privateRepo = {
        ...mockRepository,
        name: 'my-org-private',
        full_name: 'test-owner/my-org-private',
        private: true,
      };
      const otherPublicRepo = {
        ...mockRepository,
        name: 'other-public',
        full_name: 'test-owner/other-public',
        private: false,
      };

      mockListRepos.mockResolvedValue({
        data: [publicRepo, privateRepo, otherPublicRepo],
      });
      mockGetContent.mockResolvedValue({ data: [] });

      const config: Config = {
        rules: [],
        filters: {
          visibility: 'public',
          include: ['^my-org-'],
        },
      };

      const results = await run(mockOctokit, config);

      expect(results).toHaveLength(1);
      expect(results[0].repository).toBe('test-owner/my-org-public');
    });

    it('should handle multiple include patterns (OR logic)', async () => {
      const repo1 = {
        ...mockRepository,
        name: 'my-org-repo1',
        full_name: 'test-owner/my-org-repo1',
      };
      const repo2 = {
        ...mockRepository,
        name: 'other-org-repo2',
        full_name: 'test-owner/other-org-repo2',
      };
      const repo3 = {
        ...mockRepository,
        name: 'unmatched-repo',
        full_name: 'test-owner/unmatched-repo',
      };

      mockListRepos.mockResolvedValue({
        data: [repo1, repo2, repo3],
      });
      mockGetContent.mockResolvedValue({ data: [] });

      const config: Config = {
        rules: [],
        filters: {
          include: ['^my-org-', '^other-org-'],
        },
      };

      const results = await run(mockOctokit, config);

      expect(results).toHaveLength(2);
      expect(results.map((r) => r.repository)).toContain('test-owner/my-org-repo1');
      expect(results.map((r) => r.repository)).toContain('test-owner/other-org-repo2');
    });

    it('should handle multiple exclude patterns (OR logic)', async () => {
      const repo1 = {
        ...mockRepository,
        name: 'active-repo',
        full_name: 'test-owner/active-repo',
      };
      const repo2 = {
        ...mockRepository,
        name: 'deprecated-repo',
        full_name: 'test-owner/deprecated-repo',
      };
      const repo3 = {
        ...mockRepository,
        name: 'archived-repo',
        full_name: 'test-owner/archived-repo',
      };

      mockListRepos.mockResolvedValue({
        data: [repo1, repo2, repo3],
      });
      mockGetContent.mockResolvedValue({ data: [] });

      const config: Config = {
        rules: [],
        filters: {
          exclude: ['deprecated', 'archived'],
        },
      };

      const results = await run(mockOctokit, config);

      expect(results).toHaveLength(1);
      expect(results[0].repository).toBe('test-owner/active-repo');
    });
  });
});
