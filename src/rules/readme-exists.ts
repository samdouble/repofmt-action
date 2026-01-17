import type { getOctokit } from '@actions/github';
import type { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods';
import { z } from 'zod';

export const readmeExistsOptionsSchema = z.object({
  caseInsensitive: z.boolean().optional().default(false),
  path: z.string().optional().default('README.md'),
});

export type ReadmeExistsOptions = z.infer<typeof readmeExistsOptionsSchema>;

type Octokit = ReturnType<typeof getOctokit>;
type Repository = RestEndpointMethodTypes['repos']['listForAuthenticatedUser']['response']['data'][number];

export const readmeExists = async (octokit: Octokit, repository: Repository, ruleOptions: ReadmeExistsOptions) => {
  const { data: contents } = await octokit.rest.repos.getContent({
    owner: repository.owner.login,
    repo: repository.name,
    path: '',
  });
  if (Array.isArray(contents)) {
    const readme = contents
      .filter(item => item.type === 'file')
      .find(item => {
        return ruleOptions.caseInsensitive
          ? item.name.toLowerCase() === ruleOptions.path.toLowerCase()
          : item.name === ruleOptions.path;
      });
    if (readme) {
      return true;
    }
  }
  return false;
};
