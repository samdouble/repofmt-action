import path from 'node:path';
import { z } from 'zod';
import { AlertLevelSchema } from '../utils/types';
import type { RuleContext } from '../utils/context';

export const FileExistsOptionsSchema = z.object({
  caseSensitive: z.boolean().default(false),
  path: z.string(),
});

export const FileExistsSchema = z.object({
  name: z.literal('file-exists'),
  level: AlertLevelSchema,
  options: FileExistsOptionsSchema,
});

export type FileExistsOptions = z.input<typeof FileExistsOptionsSchema>;

export const fileExists = async (context: RuleContext, ruleOptions: FileExistsOptions) => {
  const errors: string[] = [];

  let sanitizedRuleOptions: FileExistsOptions;
  try {
    sanitizedRuleOptions = FileExistsOptionsSchema.parse(ruleOptions);
  } catch (error) {
    throw new Error(`Invalid rule options: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  const filePath = sanitizedRuleOptions.path;
  const dirPath = path.dirname(filePath);
  const fileName = path.basename(filePath);
  const directoryPath = dirPath === '.' ? '' : dirPath;

  let contents;
  try {
    contents = await context.getContent(directoryPath);
  } catch {
    errors.push(`${filePath} not found`);
    return { errors };
  }

  if (Array.isArray(contents)) {
    const file = contents
      .filter(item => item.type === 'file')
      .find(item => {
        return sanitizedRuleOptions.caseSensitive
          ? item.name === fileName
          : item.name.toLowerCase() === fileName.toLowerCase();
      });
    if (!file) {
      errors.push(`${filePath} not found`);
    }
  } else {
    errors.push(`Contents is not an array`);
  }
  return { errors };
};
