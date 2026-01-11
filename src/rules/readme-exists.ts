import type { getOctokit } from '@actions/github';
import type { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods';

type Octokit = ReturnType<typeof getOctokit>;
type Repository = RestEndpointMethodTypes['repos']['listForAuthenticatedUser']['response']['data'][number];

export const readmeExists = async (octokit: Octokit, repository: Repository) => {
  const { data: contents } = await octokit.rest.repos.getContent({
    owner: repository.owner.login,
    repo: repository.name,
    path: '',
  });
  if (Array.isArray(contents)) {
    const readme = contents.find(item => item.name === 'README.md' && item.type === 'file');
    if (readme) {
      return true;
    }
  }
  return false;
};
