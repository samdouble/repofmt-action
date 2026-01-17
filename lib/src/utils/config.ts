import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';
import { ruleConfigSchema } from '../rules';

export const configSchema = z.object({
  rules: ruleConfigSchema.optional().default({}),
});

export type Config = z.infer<typeof configSchema>;

export const getConfig = (): Config => {
  const workspaceRoot = process.env.GITHUB_WORKSPACE || process.cwd();
  const configPath = path.join(workspaceRoot, 'repolint.json');

  if (!fs.existsSync(configPath)) {
    throw new Error(`repolint.json not found at ${configPath}`);
  }

  console.info(`Found repolint.json at ${configPath}`);

  const configContent = fs.readFileSync(configPath, 'utf-8');
  const parsed = JSON.parse(configContent);

  const result = configSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Invalid repolint.json: ${result.error.message}`);
  }

  return result.data;
};
