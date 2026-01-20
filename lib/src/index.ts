import type { getOctokit } from '@actions/github';
import type { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods';
import { rulesMapper } from './rulesMapper';
import { Config } from './utils/config';

export { getConfig, configSchema, type Config } from './utils/config';
export { rulesMapper } from './rulesMapper';
export { readmeExists } from './rules/readme-exists';
export { licenseExists } from './rules/license-exists';
export { fileExists } from './rules/file-exists';

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

  for (const [rule, [alertLevel, ruleOptions]] of Object.entries(config.rules ?? {})) {
    const ruleFunction = rulesMapper[rule as keyof typeof rulesMapper];
    if (!ruleFunction) {
      throw new Error(`Rule ${rule} not found`);
    }
    const { errors } = await ruleFunction(octokit, repo, ruleOptions);
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
