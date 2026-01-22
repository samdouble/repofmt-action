import type { getOctokit } from '@actions/github';
import type { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods';

export type Octokit = ReturnType<typeof getOctokit>;
export type Repository = RestEndpointMethodTypes['repos']['listForAuthenticatedUser']['response']['data'][number];
export type RepoContent = RestEndpointMethodTypes['repos']['getContent']['response']['data'];

export class RuleContext {
  private contentCache: Map<string, RepoContent> = new Map();

  constructor(
    public readonly octokit: Octokit,
    public readonly repository: Repository,
  ) {}

  async getContent(path: string = ''): Promise<RepoContent> {
    const cacheKey = `${this.repository.full_name}:${path}`;

    if (this.contentCache.has(cacheKey)) {
      return this.contentCache.get(cacheKey)!;
    }

    const { data: contents } = await this.octokit.rest.repos.getContent({
      owner: this.repository.owner.login,
      repo: this.repository.name,
      path,
    });

    this.contentCache.set(cacheKey, contents);
    return contents;
  }

  clearCache(): void {
    this.contentCache.clear();
  }
}
