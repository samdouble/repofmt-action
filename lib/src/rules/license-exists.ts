import type { getOctokit } from '@actions/github';
import type { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods';
import { z } from 'zod';
import { fileExists } from './file-exists';
import { AlertLevelSchema } from '../utils/types';

export const LicenseExistsOptionsSchema = z.object({
  caseSensitive: z.boolean().default(false),
  path: z.string().default('LICENSE.md'),
});

export const LicenseExistsSchema = z.object({
  name: z.literal('license/exists'),
  level: AlertLevelSchema,
  options: LicenseExistsOptionsSchema,
});

export type LicenseExistsOptions = z.infer<typeof LicenseExistsOptionsSchema>;

type Octokit = ReturnType<typeof getOctokit>;
type Repository = RestEndpointMethodTypes['repos']['listForAuthenticatedUser']['response']['data'][number];

export const licenseExists = async (octokit: Octokit, repository: Repository, ruleOptions: LicenseExistsOptions) => {
  let sanitizedRuleOptions: LicenseExistsOptions;
  try {
    sanitizedRuleOptions = LicenseExistsOptionsSchema.parse(ruleOptions);
  } catch (error) {
    throw new Error(`Invalid rule options: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  const { errors } = await fileExists(octokit, repository, sanitizedRuleOptions);
  return { errors };
};
