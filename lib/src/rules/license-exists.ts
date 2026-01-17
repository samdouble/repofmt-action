import type { getOctokit } from '@actions/github';
import type { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods';
import { z } from 'zod';
import { fileExists } from './file-exists';

export const licenseExistsOptionsSchema = z.object({
  caseSensitive: z.boolean().optional().default(false),
  path: z.string().optional().default('LICENSE.md'),
});

export type LicenseExistsOptions = z.infer<typeof licenseExistsOptionsSchema>;

type Octokit = ReturnType<typeof getOctokit>;
type Repository = RestEndpointMethodTypes['repos']['listForAuthenticatedUser']['response']['data'][number];

export const licenseExists = async (octokit: Octokit, repository: Repository, ruleOptions: LicenseExistsOptions) => {
  let sanitizedRuleOptions: LicenseExistsOptions;
  try {
    sanitizedRuleOptions = licenseExistsOptionsSchema.parse(ruleOptions);
  } catch (error) {
    throw new Error(`Invalid rule options: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  return await fileExists(octokit, repository, sanitizedRuleOptions);
};
