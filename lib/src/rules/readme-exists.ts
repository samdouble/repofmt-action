import { z } from 'zod';
import { regexPatternSchema } from '../utils/config';
import type { RuleContext } from '../utils/context';
import { AlertLevelSchema } from '../utils/types';
import { fileExists } from './file-exists';

export const ReadmeExistsOptionsSchema = z.object({
  caseSensitive: z.boolean().optional().default(false),
  path: z.union([z.string(), z.array(z.string()).min(1)]).optional().default('README.md'),
});

export const ReadmeExistsSchema = z.object({
  name: z.literal('readme/exists'),
  level: AlertLevelSchema,
  exceptions: z.array(regexPatternSchema).optional(),
  options: ReadmeExistsOptionsSchema,
});

export type ReadmeExistsOptions = z.input<typeof ReadmeExistsOptionsSchema>;

export const readmeExists = async (context: RuleContext, ruleOptions: ReadmeExistsOptions) => {
  let sanitizedRuleOptions: z.output<typeof ReadmeExistsOptionsSchema>;
  try {
    sanitizedRuleOptions = ReadmeExistsOptionsSchema.parse(ruleOptions);
  } catch (error) {
    throw new Error(`Invalid rule options: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  const { errors } = await fileExists(context, sanitizedRuleOptions);
  return { errors };
};
