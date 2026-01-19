import type { getOctokit } from '@actions/github';
import type { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods';
import { z } from 'zod';
import { fileExists } from './file-exists';

export const readmeExistsOptionsSchema = z.object({
  caseSensitive: z.boolean().optional().default(false),
  path: z.string().optional().default('README.md'),
});

export type readmeExistsOptions = z.infer<typeof readmeExistsOptionsSchema>;

type Octokit = ReturnType<typeof getOctokit>;
type Repository = RestEndpointMethodTypes['repos']['listForAuthenticatedUser']['response']['data'][number];

export const readmeExists = async (octokit: Octokit, repository: Repository, ruleOptions: readmeExistsOptions) => {
  let sanitizedRuleOptions: readmeExistsOptions;
  try {
    sanitizedRuleOptions = readmeExistsOptionsSchema.parse(ruleOptions);
  } catch (error) {
    throw new Error(`Invalid rule options: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  return await fileExists(octokit, repository, sanitizedRuleOptions);
};
