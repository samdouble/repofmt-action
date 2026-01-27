import { minimatch } from 'minimatch';
import nodePath from 'node:path';
import { z } from 'zod';
import type { RuleContext } from '../utils/context';
import { isGlobPattern } from '../utils/files';
import { AlertLevelSchema } from '../utils/types';

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

const findMatchingEntries = async (
  context: RuleContext,
  pattern: string,
  caseSensitive: boolean,
  entryType: 'file' | 'directory' | 'any',
): Promise<string[]> => {
  const allFiles = await context.getAllFiles();

  return allFiles
    .filter(entry => {
      if (entryType === 'file' && entry.type !== 'file') return false;
      if (entryType === 'directory' && entry.type !== 'dir') return false;

      return minimatch(entry.path, pattern, {
        nocase: !caseSensitive,
        dot: true,
      });
    })
    .map(entry => entry.path);
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
    const isPattern = isGlobPattern(entryPath);

    if (isPattern) {
      const matches = await findMatchingEntries(
        context,
        entryPath,
        sanitizedRuleOptions.caseSensitive,
        sanitizedRuleOptions.type,
      );
      foundEntries.push(...matches);
    } else {
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
  }

  if (foundEntries.length > 0) {
    const uniqueEntries = [...new Set(foundEntries)];
    const entriesDisplay = uniqueEntries.length === 1
      ? uniqueEntries[0]
      : `[${uniqueEntries.join(', ')}]`;
    errors.push(`${entriesDisplay} should not exist`);
  }

  return { errors };
};
