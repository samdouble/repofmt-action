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
  const contents = await context.getContent('');

  let sanitizedRuleOptions: FileExistsOptions;
  try {
    sanitizedRuleOptions = FileExistsOptionsSchema.parse(ruleOptions);
  } catch (error) {
    throw new Error(`Invalid rule options: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  if (Array.isArray(contents)) {
    const file = contents
      .filter(item => item.type === 'file')
      .find(item => {
        return sanitizedRuleOptions.caseSensitive
          ? item.name === sanitizedRuleOptions.path
          : item.name.toLowerCase() === sanitizedRuleOptions.path.toLowerCase();
      });
    if (!file) {
      errors.push(`${sanitizedRuleOptions.path} not found`);
    }
  } else {
    errors.push(`Contents is not an array`);
  }
  return { errors };
};
