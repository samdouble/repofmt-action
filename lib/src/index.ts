import type { getOctokit } from '@actions/github';
import type { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods';
import { rulesMapper } from './rulesMapper';
import { Config } from './utils/config';
import { RuleContext } from './utils/context';

export { getConfig, configSchema, type Config } from './utils/config';
export { RuleContext } from './utils/context';
export { rulesMapper } from './rulesMapper';
export { fileExists } from './rules/file-exists';
export { fileForbidden } from './rules/file-forbidden';
export { githubActionsTimeoutMinutes } from './rules/github-actions-timeout-minutes';
export { licenseExists } from './rules/license-exists';
export { readmeExists } from './rules/readme-exists';

export type Octokit = ReturnType<typeof getOctokit>;
export type Repository = RestEndpointMethodTypes['repos']['listForAuthenticatedUser']['response']['data'][number];

export interface RunResult {
  repository: string;
  results: {
    rule: string;
    errors?: string[];
    warnings?: string[];
  }[];
}

export async function runRulesForRepo(
  octokit: Octokit,
  repo: Repository,
  config: Config,
): Promise<RunResult> {
  const results: RunResult['results'] = [];
  const context = new RuleContext(octokit, repo);

  for (const ruleConfig of config.rules ?? []) {
    const { name: rule, level: alertLevel, options: ruleOptions } = ruleConfig;
    const ruleFunction = rulesMapper[rule as keyof typeof rulesMapper];
    if (!ruleFunction) {
      throw new Error(`Rule ${rule} not found`);
    }
    const { errors } = await ruleFunction(context, ruleOptions as never);
    if (errors.length > 0) {
      if (alertLevel === 'error') {
        results.push({ rule, errors });
      } else if (alertLevel === 'warning') {
        results.push({ rule, warnings: errors });
      }
    }
  }

  return {
    repository: repo.full_name,
    results,
  };
}

export async function run(
  octokit: Octokit,
  config: Config,
): Promise<RunResult[]> {
  const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
    visibility: 'all',
    per_page: 100,
  });

  const results: RunResult[] = [];

  for (const repo of repos) {
    const repoResult = await runRulesForRepo(octokit, repo, config);
    results.push(repoResult);
  }

  return results;
}
