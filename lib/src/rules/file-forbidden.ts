import path from 'node:path';
import { z } from 'zod';
import { AlertLevelSchema } from '../utils/types';
import type { RuleContext } from '../utils/context';

export const FileForbiddenOptionsSchema = z.object({
  caseSensitive: z.boolean().default(false),
  path: z.string(),
});

export const FileForbiddenSchema = z.object({
  name: z.literal('file-forbidden'),
  level: AlertLevelSchema,
  options: FileForbiddenOptionsSchema,
});

export type FileForbiddenOptions = z.input<typeof FileForbiddenOptionsSchema>;

export const fileForbidden = async (context: RuleContext, ruleOptions: FileForbiddenOptions) => {
  const errors: string[] = [];

  let sanitizedRuleOptions: FileForbiddenOptions;
  try {
    sanitizedRuleOptions = FileForbiddenOptionsSchema.parse(ruleOptions);
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
    if (file) {
      errors.push(`${filePath} should not exist`);
    }
  } else {
    errors.push(`Contents is not an array`);
  }
  return { errors };
};
