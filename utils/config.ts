import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';

export const getConfig = () => {
  const workspaceRoot = process.env.GITHUB_WORKSPACE || process.cwd();
  const configPath = path.join(workspaceRoot, 'repolint.json');

  if (!fs.existsSync(configPath)) {
    core.setFailed(`repolint.json not found at ${configPath}`);
    return;
  }

  core.info(`Found repolint.json at ${configPath}`);

  const configContent = fs.readFileSync(configPath, 'utf-8');

  // TODO: Add config validation
  return JSON.parse(configContent);
};
