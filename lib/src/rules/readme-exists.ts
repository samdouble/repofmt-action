import { z } from 'zod';
import type { RuleContext } from '../utils/context';
import { createRuleSchema } from '../utils/rule-schema';
import { fileExists } from './file-exists';

export const ReadmeExistsOptionsSchema = z.object({
  caseSensitive: z.boolean().optional().default(false),
  path: z.union([z.string(), z.array(z.string()).min(1)]).optional().default('README.md'),
});

export const ReadmeExistsSchema = createRuleSchema('readme/exists', ReadmeExistsOptionsSchema);

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
