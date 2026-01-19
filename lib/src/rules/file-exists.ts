import type { getOctokit } from '@actions/github';
import type { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods';
import { z } from 'zod';

export const fileExistsOptionsSchema = z.object({
  caseSensitive: z.boolean().default(false),
  path: z.string(),
});

export type fileExistsOptions = z.input<typeof fileExistsOptionsSchema>;

type Octokit = ReturnType<typeof getOctokit>;
type Repository = RestEndpointMethodTypes['repos']['listForAuthenticatedUser']['response']['data'][number];

export const fileExists = async (octokit: Octokit, repository: Repository, ruleOptions: fileExistsOptions) => {
  const { data: contents } = await octokit.rest.repos.getContent({
    owner: repository.owner.login,
    repo: repository.name,
    path: '',
  });
  let sanitizedRuleOptions: fileExistsOptions;
  try {
    sanitizedRuleOptions = fileExistsOptionsSchema.parse(ruleOptions);
  } catch (error) {
    throw new Error(`Invalid rule options: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  if (Array.isArray(contents)) {
    const file = contents
      .filter(item => item.type === 'file')
      .find(item => {
        return sanitizedRuleOptions.caseSensitive
          ? item.name === sanitizedRuleOptions.path
          : item.name.toLowerCase() === sanitizedRuleOptions.path.toLowerCase();
      });
    return !!file;
  }
  return false;
};
