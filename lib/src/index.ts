import type { getOctokit } from '@actions/github';
import type { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods';
import { rulesMapper } from './rulesMapper';
import { Config } from './utils/config';
import { RuleContext } from './utils/context';

export { fileContains } from './rules/file-contains';
export { fileExists } from './rules/file-exists';
export { fileForbidden } from './rules/file-forbidden';
export { fileNotContains } from './rules/file-not-contains';
export { githubActionsTimeoutMinutes } from './rules/github-actions-timeout-minutes';
export { licenseExists } from './rules/license-exists';
export { pyprojectDependenciesAlphabeticalOrder } from './rules/pyproject-dependencies-alphabetical-order';
export { readmeExists } from './rules/readme-exists';
export { requirementsTxtDependenciesAlphabeticalOrder } from './rules/requirements-txt-dependencies-alphabetical-order';
export { rulesMapper } from './rulesMapper';
export { configSchema, getConfig, type Config } from './utils/config';
export { RuleContext } from './utils/context';

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

function matchesFilters(repo: Repository, filters?: Config['filters']): boolean {
  if (!filters) {
    return true;
  }

  if (filters.visibility) {
    if (filters.visibility === 'public' && repo.private) {
      return false;
    }
    if (filters.visibility === 'private' && !repo.private) {
      return false;
    }
  }

  if (filters.archived !== undefined) {
    if (filters.archived && !repo.archived) {
      return false;
    }
    if (!filters.archived && repo.archived) {
      return false;
    }
  }

  if (filters.organizations && filters.organizations.length > 0) {
    if (!filters.organizations.includes(repo.owner.login)) {
      return false;
    }
  }

  if (filters.include && filters.include.length > 0) {
    let matched = false;
    for (const pattern of filters.include) {
      const regex = new RegExp(pattern);
      if (regex.test(repo.name) || regex.test(repo.full_name)) {
        matched = true;
        break;
      }
    }
    if (!matched) {
      return false;
    }
  }

  if (filters.exclude && filters.exclude.length > 0) {
    for (const pattern of filters.exclude) {
      const regex = new RegExp(pattern);
      if (regex.test(repo.name) || regex.test(repo.full_name)) {
        return false;
      }
    }
  }
  return true;
}

export async function run(
  octokit: Octokit,
  config: Config,
): Promise<RunResult[]> {
  const visibility = config.filters?.visibility ?? 'all';
  const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
    visibility,
    per_page: 100,
  });

  const results: RunResult[] = [];

  for (const repo of repos) {
    if (matchesFilters(repo, config.filters)) {
      const repoResult = await runRulesForRepo(octokit, repo, config);
      results.push(repoResult);
    }
  }

  return results;
}
