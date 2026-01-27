import { z } from 'zod';
import type { RuleContext } from '../utils/context';
import { findMatchingFiles, isGlobPattern } from '../utils/files';
import { AlertLevelSchema } from '../utils/types';

export const FileContainsOptionsSchema = z.object({
  path: z.union([z.string(), z.array(z.string()).min(1)]),
  contains: z.string(),
  caseSensitive: z.boolean().default(false),
});

export const FileContainsSchema = z.object({
  name: z.literal('file-contains'),
  level: AlertLevelSchema,
  options: FileContainsOptionsSchema,
});

export type FileContainsOptions = z.input<typeof FileContainsOptionsSchema>;

export const fileContains = async (
  context: RuleContext,
  ruleOptions: FileContainsOptions,
) => {
  const errors: string[] = [];

  let sanitizedRuleOptions: z.output<typeof FileContainsOptionsSchema>;
  try {
    sanitizedRuleOptions = FileContainsOptionsSchema.parse(ruleOptions);
  } catch (error) {
    throw new Error(
      `Invalid rule options: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }

  const { path, contains, caseSensitive } = sanitizedRuleOptions;
  const paths = Array.isArray(path) ? path : [path];

  const searchText = caseSensitive ? contains : contains.toLowerCase();

  for (const pathPattern of paths) {
    const isPattern = isGlobPattern(pathPattern);
    let filesToCheck: string[];

    if (isPattern) {
      filesToCheck = await findMatchingFiles(context, pathPattern, caseSensitive);
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

      const contentToSearch = caseSensitive
        ? fileContent
        : fileContent.toLowerCase();

      if (!contentToSearch.includes(searchText)) {
        errors.push(`${filePath}: file does not contain "${contains}"`);
      }
    }
  }

  return { errors };
};
