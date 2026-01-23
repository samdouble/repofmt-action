import nodePath from 'node:path';
import { z } from 'zod';
import { AlertLevelSchema } from '../utils/types';
import type { RuleContext } from '../utils/context';

export const FileExistsOptionsSchema = z.object({
  caseSensitive: z.boolean().default(false),
  path: z.union([z.string(), z.array(z.string()).min(1)]),
});

export const FileExistsSchema = z.object({
  name: z.literal('file-exists'),
  level: AlertLevelSchema,
  options: FileExistsOptionsSchema,
});

export type FileExistsOptions = z.input<typeof FileExistsOptionsSchema>;

const checkFileExists = async (
  context: RuleContext,
  filePath: string,
  caseSensitive: boolean,
): Promise<boolean> => {
  const dirPath = nodePath.dirname(filePath);
  const fileName = nodePath.basename(filePath);
  const directoryPath = dirPath === '.' ? '' : dirPath;

  let contents;
  try {
    contents = await context.getContent(directoryPath);
  } catch {
    return false;
  }

  if (!Array.isArray(contents)) {
    return false;
  }

  const file = contents
    .filter(item => item.type === 'file')
    .find(item => {
      return caseSensitive
        ? item.name === fileName
        : item.name.toLowerCase() === fileName.toLowerCase();
    });

  return !!file;
};

export const fileExists = async (context: RuleContext, ruleOptions: FileExistsOptions) => {
  const errors: string[] = [];

  let sanitizedRuleOptions: z.output<typeof FileExistsOptionsSchema>;
  try {
    sanitizedRuleOptions = FileExistsOptionsSchema.parse(ruleOptions);
  } catch (error) {
    throw new Error(`Invalid rule options: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  const paths = Array.isArray(sanitizedRuleOptions.path)
    ? sanitizedRuleOptions.path
    : [sanitizedRuleOptions.path];

  for (const filePath of paths) {
    const exists = await checkFileExists(context, filePath, sanitizedRuleOptions.caseSensitive);
    if (exists) {
      return { errors };
    }
  }

  const pathsDisplay = paths.length === 1 ? paths[0] : `one of [${paths.join(', ')}]`;
  errors.push(`${pathsDisplay} not found`);

  return { errors };
};
