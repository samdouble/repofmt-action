#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getOctokit } from '@actions/github';
import { getConfig, run } from './index';

const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../package.json'), 'utf-8'),
);

const program = new Command();

program
  .name('repofmt')
  .description('A CLI tool that checks consistency across repositories')
  .version(packageJson.version);

program
  .command('run')
  .description('Run repofmt checks against your repositories')
  .option('--config <path>', 'path to config file')
  .option('--token <token>', 'GitHub token (can also use GITHUB_TOKEN env var)')
  .action(async (options) => {
    console.log('Running repofmt...');

    let config;
    try {
      config = await getConfig(options.config);
    } catch (error) {
      console.error(
        `Configuration error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      process.exit(1);
    }

    const token = options.token ?? process.env.GITHUB_TOKEN;
    if (!token) {
      console.error('GitHub token is required. Use --token or set GITHUB_TOKEN environment variable');
      process.exit(1);
    }

    const octokit = getOctokit(token);

    try {
      const results = await run(octokit, config);

      let totalErrors = 0;
      let totalWarnings = 0;

      for (const repoResult of results) {
        console.log(`\n${repoResult.repository}`);

        for (const { rule, errors, warnings } of repoResult.results) {
          for (const error of errors ?? []) {
            console.log(`  ❌ ${rule}: ${error}`);
            totalErrors++;
          }
          for (const warning of warnings ?? []) {
            console.log(`  ⚠️ ${rule}: ${warning}`);
            totalWarnings++;
          }
        }
      }

      console.log(`${totalErrors} error${totalErrors > 1 ? 's' : ''}, ${totalWarnings} warning${totalWarnings > 1 ? 's' : ''}`);

      process.exit(totalErrors > 0 ? 1 : 0);
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

if (process.env.NODE_ENV !== 'test') {
  program.parse();
}

export default program;
