#!/usr/bin/env node
import { getOctokit } from '@actions/github';
import { getConfig, configSchema, runRepolint } from './index';

async function main() {
  console.log('Running repolint...');

  let config;
  try {
    const rawConfig = getConfig();
    if (!rawConfig) {
      console.error('Failed to load repolint.json');
      process.exit(1);
    }
    config = configSchema.parse(rawConfig);
  } catch (error) {
    console.error(`Invalid configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('GITHUB_TOKEN environment variable is required');
    process.exit(1);
  }

  const octokit = getOctokit(token);

  try {
    const results = await runRepolint(octokit, config);

    let hasFailures = false;
    for (const repoResult of results) {
      console.log(`\n${repoResult.repository}`);
      console.log('='.repeat(repoResult.repository.length));

      for (const { rule, passed } of repoResult.results) {
        const icon = passed ? '✓' : '✗';
        console.log(`  ${icon} ${rule}`);
        if (!passed) hasFailures = true;
      }
    }

    process.exit(hasFailures ? 1 : 0);
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

main();
