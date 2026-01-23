import nodePath from 'node:path';
import { z } from 'zod';
import { AlertLevelSchema } from '../utils/types';
import type { RuleContext } from '../utils/context';

export const FileForbiddenOptionsSchema = z.object({
  caseSensitive: z.boolean().default(false),
  path: z.union([z.string(), z.array(z.string()).min(1)]),
});

export const FileForbiddenSchema = z.object({
  name: z.literal('file-forbidden'),
  level: AlertLevelSchema,
  options: FileForbiddenOptionsSchema,
});

export type FileForbiddenOptions = z.input<typeof FileForbiddenOptionsSchema>;

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

export const fileForbidden = async (context: RuleContext, ruleOptions: FileForbiddenOptions) => {
  const errors: string[] = [];

  let sanitizedRuleOptions: z.output<typeof FileForbiddenOptionsSchema>;
  try {
    sanitizedRuleOptions = FileForbiddenOptionsSchema.parse(ruleOptions);
  } catch (error) {
    throw new Error(`Invalid rule options: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  const paths = Array.isArray(sanitizedRuleOptions.path)
    ? sanitizedRuleOptions.path
    : [sanitizedRuleOptions.path];

  const foundFiles: string[] = [];
  for (const filePath of paths) {
    const exists = await checkFileExists(context, filePath, sanitizedRuleOptions.caseSensitive);
    if (exists) {
      foundFiles.push(filePath);
    }
  }

  if (foundFiles.length > 0) {
    const filesDisplay = foundFiles.length === 1
      ? foundFiles[0]
      : `[${foundFiles.join(', ')}]`;
    errors.push(`${filesDisplay} should not exist`);
  }

  return { errors };
};
