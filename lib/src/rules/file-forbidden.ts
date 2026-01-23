import nodePath from 'node:path';
import { z } from 'zod';
import { AlertLevelSchema } from '../utils/types';
import type { RuleContext } from '../utils/context';

export const EntryTypeSchema = z.enum(['file', 'directory', 'any']).default('file');

export const FileForbiddenOptionsSchema = z.object({
  caseSensitive: z.boolean().default(false),
  path: z.union([z.string(), z.array(z.string()).min(1)]),
  type: EntryTypeSchema,
});

export const FileForbiddenSchema = z.object({
  name: z.literal('file-forbidden'),
  level: AlertLevelSchema,
  options: FileForbiddenOptionsSchema,
});

export type FileForbiddenOptions = z.input<typeof FileForbiddenOptionsSchema>;

const checkEntryExists = async (
  context: RuleContext,
  entryPath: string,
  caseSensitive: boolean,
  entryType: 'file' | 'directory' | 'any',
): Promise<boolean> => {
  const dirPath = nodePath.dirname(entryPath);
  const entryName = nodePath.basename(entryPath);
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

  const entry = contents
    .filter(item => {
      if (entryType === 'any') return true;
      if (entryType === 'file') return item.type === 'file';
      if (entryType === 'directory') return item.type === 'dir';
      return false;
    })
    .find(item => {
      return caseSensitive
        ? item.name === entryName
        : item.name.toLowerCase() === entryName.toLowerCase();
    });

  return !!entry;
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

  const foundEntries: string[] = [];
  for (const entryPath of paths) {
    const exists = await checkEntryExists(
      context,
      entryPath,
      sanitizedRuleOptions.caseSensitive,
      sanitizedRuleOptions.type,
    );
    if (exists) {
      foundEntries.push(entryPath);
    }
  }

  if (foundEntries.length > 0) {
    const entriesDisplay = foundEntries.length === 1
      ? foundEntries[0]
      : `[${foundEntries.join(', ')}]`;
    errors.push(`${entriesDisplay} should not exist`);
  }

  return { errors };
};
