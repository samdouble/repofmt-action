import * as core from '@actions/core';
import * as github from '@actions/github';
import { getConfig } from '../utils/config';
import { rulesMapper } from './rulesMapper';

export async function main() {
  core.info(`Running repolint action`);

  const config = getConfig();

  core.info(`Loaded configuration: ${JSON.stringify(config, null, 2)}`);

  const token = core.getInput('github-token', { required: true });
  const octokit = github.getOctokit(token);

  core.info(`Fetching repositories accessible to the authenticated token`);

  const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
    visibility: 'all',
    per_page: 100,
  });

  core.info(`Found ${repos.length} repositories:`);
  for (const repo of repos) {
    core.info(`  - ${repo.full_name} (${repo.private ? 'private' : 'public'})`);
    core.info(`==================`);

    try {
      for (const rule of config.rules) {
        const ruleFunction = rulesMapper[rule as keyof typeof rulesMapper];
        if (ruleFunction) {
          const result = await ruleFunction(octokit, repo);
          if (result) {
            core.info(`  - ${rule} passed`);
          } else {
            core.warning(`  - ${rule} failed`);
          }
        }
      }
    } catch (error) {
      core.warning(`Could not fetch contents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

if (process.env.NODE_ENV !== 'test') {
  main();
}
