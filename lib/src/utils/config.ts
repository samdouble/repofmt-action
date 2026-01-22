import { createJiti } from 'jiti';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import { rulesConfigSchema } from '../rules';

export const configSchema = z.object({
  rules: rulesConfigSchema.optional().default([]),
});

export type Config = z.infer<typeof configSchema>;

const CONFIG_FILES = [
  'repofmt.config.ts',
  'repofmt.config.js',
  'repofmt.config.mjs',
  'repofmt.config.cjs',
];

export const getConfig = async (configPathArg?: string): Promise<Config> => {
  let configPath: string | undefined;

  if (configPathArg) {
    const resolvedPath = path.isAbsolute(configPathArg)
      ? configPathArg
      : path.join(process.cwd(), configPathArg);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Config file not found: ${configPathArg}`);
    }
    configPath = resolvedPath;
  } else {
    const workspaceRoot = process.cwd();
    for (const configFile of CONFIG_FILES) {
      const candidatePath = path.join(workspaceRoot, configFile);
      if (fs.existsSync(candidatePath)) {
        configPath = candidatePath;
        break;
      }
    }

    if (!configPath) {
      throw new Error(
        `No config file found. Create one of: ${CONFIG_FILES.join(', ')}`,
      );
    }
  }

  console.info(`Found config at ${configPath}`);

  const jiti = createJiti(pathToFileURL(__filename).href);
  const configModule = await jiti.import(configPath);
  const rawConfig = (configModule as { default?: unknown }).default ?? configModule;

  const result = configSchema.safeParse(rawConfig);
  if (!result.success) {
    throw new Error(`Invalid config: ${result.error.message}`);
  }

  return result.data;
};
