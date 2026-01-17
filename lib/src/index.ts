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

export interface RepolintResult {
  repository: string;
  results: {
    rule: string;
    passed: boolean;
  }[];
}

export async function runRulesForRepo(
  octokit: Octokit,
  repo: Repository,
  config: Config,
): Promise<RepolintResult> {
  const results: RepolintResult['results'] = [];

  for (const [rule, ruleOptions] of Object.entries(config.rules ?? {})) {
    const ruleFunction = rulesMapper[rule as keyof typeof rulesMapper];
    if (!ruleFunction) {
      throw new Error(`Rule ${rule} not found`);
    }
    const passed = await ruleFunction(octokit, repo, ruleOptions);
    results.push({ rule, passed });
  }

  return {
    repository: repo.full_name,
    results,
  };
}

export async function run(
  octokit: Octokit,
  config: Config,
): Promise<RepolintResult[]> {
  const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
    visibility: 'all',
    per_page: 100,
  });

  const results: RepolintResult[] = [];

  for (const repo of repos) {
    const repoResult = await runRulesForRepo(octokit, repo, config);
    results.push(repoResult);
  }

  return results;
}
