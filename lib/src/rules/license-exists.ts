import type { getOctokit } from '@actions/github';
import type { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods';
import { z } from 'zod';
import { fileExists } from './file-exists';

export const licenseExistsOptionsSchema = z.object({
  caseSensitive: z.boolean().default(false),
  path: z.string().default('LICENSE.md'),
});

export type licenseExistsOptions = z.infer<typeof licenseExistsOptionsSchema>;

type Octokit = ReturnType<typeof getOctokit>;
type Repository = RestEndpointMethodTypes['repos']['listForAuthenticatedUser']['response']['data'][number];

export const licenseExists = async (octokit: Octokit, repository: Repository, ruleOptions: licenseExistsOptions) => {
  let sanitizedRuleOptions: licenseExistsOptions;
  try {
    sanitizedRuleOptions = licenseExistsOptionsSchema.parse(ruleOptions);
  } catch (error) {
    throw new Error(`Invalid rule options: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  return await fileExists(octokit, repository, sanitizedRuleOptions);
};
