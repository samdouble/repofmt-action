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

    it('should filter by organization', async () => {
      const org1Repo = {
        ...mockRepository,
        name: 'repo1',
        full_name: 'org1/repo1',
        owner: { login: 'org1' },
      };
      const org2Repo = {
        ...mockRepository,
        name: 'repo2',
        full_name: 'org2/repo2',
        owner: { login: 'org2' },
      };
      const userRepo = {
        ...mockRepository,
        name: 'repo3',
        full_name: 'user/repo3',
        owner: { login: 'user' },
      };

      mockListRepos.mockResolvedValue({
        data: [org1Repo, org2Repo, userRepo],
      });
      mockGetContent.mockResolvedValue({ data: [] });

      const config: Config = {
        rules: [],
        filters: {
          organizations: ['org1'],
        },
      };

      const results = await run(mockOctokit, config);

      expect(results).toHaveLength(1);
      expect(results[0].repository).toBe('org1/repo1');
    });

    it('should filter by multiple organizations', async () => {
      const org1Repo = {
        ...mockRepository,
        name: 'repo1',
        full_name: 'org1/repo1',
        owner: { login: 'org1' },
      };
      const org2Repo = {
        ...mockRepository,
        name: 'repo2',
        full_name: 'org2/repo2',
        owner: { login: 'org2' },
      };
      const org3Repo = {
        ...mockRepository,
        name: 'repo3',
        full_name: 'org3/repo3',
        owner: { login: 'org3' },
      };
      const userRepo = {
        ...mockRepository,
        name: 'repo4',
        full_name: 'user/repo4',
        owner: { login: 'user' },
      };

      mockListRepos.mockResolvedValue({
        data: [org1Repo, org2Repo, org3Repo, userRepo],
      });
      mockGetContent.mockResolvedValue({ data: [] });

      const config: Config = {
        rules: [],
        filters: {
          organizations: ['org1', 'org2'],
        },
      };

      const results = await run(mockOctokit, config);

      expect(results).toHaveLength(2);
      expect(results.map((r) => r.repository)).toContain('org1/repo1');
      expect(results.map((r) => r.repository)).toContain('org2/repo2');
    });

    it('should combine organization and visibility filters', async () => {
      const org1PublicRepo = {
        ...mockRepository,
        name: 'public-repo',
        full_name: 'org1/public-repo',
        owner: { login: 'org1' },
        private: false,
      };
      const org1PrivateRepo = {
        ...mockRepository,
        name: 'private-repo',
        full_name: 'org1/private-repo',
        owner: { login: 'org1' },
        private: true,
      };
      const org2PublicRepo = {
        ...mockRepository,
        name: 'public-repo',
        full_name: 'org2/public-repo',
        owner: { login: 'org2' },
        private: false,
      };

      mockListRepos.mockResolvedValue({
        data: [org1PublicRepo, org1PrivateRepo, org2PublicRepo],
      });
      mockGetContent.mockResolvedValue({ data: [] });

      const config: Config = {
        rules: [],
        filters: {
          organizations: ['org1'],
          visibility: 'public',
        },
      };

      const results = await run(mockOctokit, config);

      expect(results).toHaveLength(1);
      expect(results[0].repository).toBe('org1/public-repo');
    });

    it('should combine organization and include filters', async () => {
      const org1Repo1 = {
        ...mockRepository,
        name: 'my-org-repo1',
        full_name: 'org1/my-org-repo1',
        owner: { login: 'org1' },
      };
      const org1Repo2 = {
        ...mockRepository,
        name: 'other-repo',
        full_name: 'org1/other-repo',
        owner: { login: 'org1' },
      };
      const org2Repo1 = {
        ...mockRepository,
        name: 'my-org-repo2',
        full_name: 'org2/my-org-repo2',
        owner: { login: 'org2' },
      };

      mockListRepos.mockResolvedValue({
        data: [org1Repo1, org1Repo2, org2Repo1],
      });
      mockGetContent.mockResolvedValue({ data: [] });

      const config: Config = {
        rules: [],
        filters: {
          organizations: ['org1'],
          include: ['^my-org-'],
        },
      };

      const results = await run(mockOctokit, config);

      expect(results).toHaveLength(1);
      expect(results[0].repository).toBe('org1/my-org-repo1');
    });
  });
});
