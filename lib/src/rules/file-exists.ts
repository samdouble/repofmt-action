import { minimatch } from 'minimatch';
import nodePath from 'node:path';
import { z } from 'zod';
import type { RuleContext } from '../utils/context';
import { isGlobPattern } from '../utils/files';
import { createRuleSchema } from '../utils/rule-schema';

export const EntryTypeSchema = z.enum(['file', 'directory', 'any']).default('file');

export const FileExistsOptionsSchema = z.object({
  caseSensitive: z.boolean().default(false),
  path: z.union([z.string(), z.array(z.string()).min(1)]),
  type: EntryTypeSchema,
});

export const FileExistsSchema = createRuleSchema('file-exists', FileExistsOptionsSchema);

export type FileExistsOptions = z.input<typeof FileExistsOptionsSchema>;

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

const checkPatternExists = async (
  context: RuleContext,
  pattern: string,
  caseSensitive: boolean,
  entryType: 'file' | 'directory' | 'any',
): Promise<boolean> => {
  const allFiles = await context.getAllFiles();

  const matchingEntry = allFiles.find(entry => {
    if (entryType === 'file' && entry.type !== 'file') return false;
    if (entryType === 'directory' && entry.type !== 'dir') return false;

    return minimatch(entry.path, pattern, {
      nocase: !caseSensitive,
      dot: true,
    });
  });

  return !!matchingEntry;
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

  for (const entryPath of paths) {
    const isPattern = isGlobPattern(entryPath);
    const exists = isPattern
      ? await checkPatternExists(context, entryPath, sanitizedRuleOptions.caseSensitive, sanitizedRuleOptions.type)
      : await checkEntryExists(context, entryPath, sanitizedRuleOptions.caseSensitive, sanitizedRuleOptions.type);

    if (exists) {
      return { errors };
    }
  }

  const pathsDisplay = paths.length === 1 ? paths[0] : `one of [${paths.join(', ')}]`;
  errors.push(`${pathsDisplay} not found`);

  return { errors };
};
