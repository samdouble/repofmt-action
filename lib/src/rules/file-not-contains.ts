import { z } from 'zod';
import { regexPatternSchema } from '../utils/config';
import type { RuleContext } from '../utils/context';
import { findMatchingFiles, isGlobPattern } from '../utils/files';
import { AlertLevelSchema } from '../utils/types';

export const FileNotContainsOptionsSchema = z.object({
  path: z.union([z.string(), z.array(z.string()).min(1)]),
  contains: z.string(),
  caseSensitive: z.boolean().default(false),
});

export const FileNotContainsSchema = z.object({
  name: z.literal('file-not-contains'),
  level: AlertLevelSchema,
  exceptions: z.array(regexPatternSchema).optional(),
  options: FileNotContainsOptionsSchema,
});

export type FileNotContainsOptions = z.input<typeof FileNotContainsOptionsSchema>;

export const fileNotContains = async (
  context: RuleContext,
  ruleOptions: FileNotContainsOptions,
) => {
  const errors: string[] = [];

  let sanitizedRuleOptions: z.output<typeof FileNotContainsOptionsSchema>;
  try {
    sanitizedRuleOptions = FileNotContainsOptionsSchema.parse(ruleOptions);
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
        continue;
      }
    } else {
      filesToCheck = [pathPattern];
    }

    for (const filePath of filesToCheck) {
      let fileContent: string;
      try {
        fileContent = await context.getFileContent(filePath);
      } catch {
        continue;
      }

      const contentToSearch = caseSensitive
        ? fileContent
        : fileContent.toLowerCase();

      if (contentToSearch.includes(searchText)) {
        errors.push(`${filePath}: file contains "${contains}"`);
      }
    }
  }

  return { errors };
};
