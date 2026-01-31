import { z } from 'zod';
import type { RuleContext } from '../utils/context';
import { createRuleSchema } from '../utils/rule-schema';
import { fileContains } from './file-contains';

export const ReadmeHasSectionOptionsSchema = z.object({
  section: z.string(),
  path: z.string().optional().default('README.md'),
  caseSensitive: z.boolean().optional().default(false),
});

export const ReadmeHasSectionSchema = createRuleSchema('readme/has-section', ReadmeHasSectionOptionsSchema);

export type ReadmeHasSectionOptions = z.input<typeof ReadmeHasSectionOptionsSchema>;

export const readmeHasSection = async (
  context: RuleContext,
  ruleOptions: ReadmeHasSectionOptions,
) => {
  let sanitizedRuleOptions: z.output<typeof ReadmeHasSectionOptionsSchema>;
  try {
    sanitizedRuleOptions = ReadmeHasSectionOptionsSchema.parse(ruleOptions);
  } catch (error) {
    throw new Error(
      `Invalid rule options: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }

  const { section, path, caseSensitive } = sanitizedRuleOptions;

  const { errors } = await fileContains(context, {
    path,
    contains: `## ${section}`,
    caseSensitive,
  });

  return { errors };
};
