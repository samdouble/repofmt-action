import type { getOctokit } from '@actions/github';
import type { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods';
import { z } from 'zod';
import { fileExists } from './file-exists';
import { AlertLevelSchema } from '../utils/types';

export const ReadmeExistsOptionsSchema = z.object({
  caseSensitive: z.boolean().optional().default(false),
  path: z.string().optional().default('README.md'),
});

export const ReadmeExistsSchema = z.object({
  name: z.literal('readme/exists'),
  level: AlertLevelSchema,
  options: ReadmeExistsOptionsSchema,
});

export type ReadmeExistsOptions = z.infer<typeof ReadmeExistsOptionsSchema>;

type Octokit = ReturnType<typeof getOctokit>;
type Repository = RestEndpointMethodTypes['repos']['listForAuthenticatedUser']['response']['data'][number];

export const readmeExists = async (octokit: Octokit, repository: Repository, ruleOptions: ReadmeExistsOptions) => {
  let sanitizedRuleOptions: ReadmeExistsOptions;
  try {
    sanitizedRuleOptions = ReadmeExistsOptionsSchema.parse(ruleOptions);
  } catch (error) {
    throw new Error(`Invalid rule options: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  const { errors } = await fileExists(octokit, repository, sanitizedRuleOptions);
  return { errors };
};
