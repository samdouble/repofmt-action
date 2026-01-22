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
  const contents = await context.getContent('');

  let sanitizedRuleOptions: FileForbiddenOptions;
  try {
    sanitizedRuleOptions = FileForbiddenOptionsSchema.parse(ruleOptions);
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
    if (file) {
      errors.push(`${sanitizedRuleOptions.path} should not exist`);
    }
  } else {
    errors.push(`Contents is not an array`);
  }
  return { errors };
};
