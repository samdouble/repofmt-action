import type { getOctokit } from '@actions/github';
import type { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods';
import { z } from 'zod';
import { AlertLevelSchema } from '../utils/types';

export const FileForbiddenOptionsSchema = z.object({
  caseSensitive: z.boolean().default(false),
  path: z.string(),
});

export const FileForbiddenSchema = z.object({
  name: z.literal('file-forbidden'),
  level: AlertLevelSchema,
  options: FileForbiddenOptionsSchema,
});

export type FileForbiddenOptions = z.input<typeof FileForbiddenOptionsSchema>;

type Octokit = ReturnType<typeof getOctokit>;
type Repository = RestEndpointMethodTypes['repos']['listForAuthenticatedUser']['response']['data'][number];

export const fileForbidden = async (octokit: Octokit, repository: Repository, ruleOptions: FileForbiddenOptions) => {
  const errors: string[] = [];
  const { data: contents } = await octokit.rest.repos.getContent({
    owner: repository.owner.login,
    repo: repository.name,
    path: '',
  });
  let sanitizedRuleOptions: FileForbiddenOptions;
  try {
    sanitizedRuleOptions = FileForbiddenOptionsSchema.parse(ruleOptions);
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
    if (file) {
      errors.push(`${sanitizedRuleOptions.path} should not exist`);
    }
  } else {
    errors.push(`Contents is not an array`);
  }
  return { errors };
};
