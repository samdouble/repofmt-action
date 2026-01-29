import { z } from 'zod';
import type { RuleContext } from '../utils/context';
import { findMatchingFiles, isGlobPattern } from '../utils/files';
import { AlertLevelSchema } from '../utils/types';

export const JsonHasKeysOptionsSchema = z.object({
  path: z.union([z.string(), z.array(z.string()).min(1)]),
  keys: z.array(z.string()).min(1),
});

export const JsonHasKeysSchema = z.object({
  name: z.literal('json-has-keys'),
  level: AlertLevelSchema,
  options: JsonHasKeysOptionsSchema,
});

export type JsonHasKeysOptions = z.input<typeof JsonHasKeysOptionsSchema>;

const getNestedValue = (obj: unknown, keyPath: string): unknown => {
  const parts = keyPath.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current && typeof current === 'object' && !Array.isArray(current) && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return current;
};

const hasKey = (obj: unknown, keyPath: string): boolean => {
  const value = getNestedValue(obj, keyPath);
  return value !== undefined;
};

export const jsonHasKeys = async (
  context: RuleContext,
  ruleOptions: JsonHasKeysOptions,
) => {
  const errors: string[] = [];

  let sanitizedRuleOptions: z.output<typeof JsonHasKeysOptionsSchema>;
  try {
    sanitizedRuleOptions = JsonHasKeysOptionsSchema.parse(ruleOptions);
  } catch (error) {
    throw new Error(
      `Invalid rule options: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }

  const { path, keys } = sanitizedRuleOptions;
  const paths = Array.isArray(path) ? path : [path];

  for (const pathPattern of paths) {
    const isPattern = isGlobPattern(pathPattern);
    let filesToCheck: string[];

    if (isPattern) {
      filesToCheck = await findMatchingFiles(context, pathPattern, false);
      if (filesToCheck.length === 0) {
        errors.push(`${pathPattern}: no files match pattern`);
        continue;
      }
    } else {
      filesToCheck = [pathPattern];
    }

    for (const filePath of filesToCheck) {
      let fileContent: string;
      try {
        fileContent = await context.getFileContent(filePath);
      } catch (error) {
        errors.push(
          `${filePath}: ${error instanceof Error ? error.message : 'failed to read file'}`,
        );
        continue;
      }

      let jsonContent: unknown;
      try {
        jsonContent = JSON.parse(fileContent);
      } catch (error) {
        errors.push(
          `${filePath}: failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
        continue;
      }

      for (const key of keys) {
        if (!hasKey(jsonContent, key)) {
          errors.push(`${filePath}: missing key "${key}"`);
        }
      }
    }
  }

  return { errors };
};
