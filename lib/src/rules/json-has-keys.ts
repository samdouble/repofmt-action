import { z } from 'zod';
import { regexPatternSchema } from '../utils/config';
import type { RuleContext } from '../utils/context';
import { checkHasKeys } from '../utils/has-keys';
import { AlertLevelSchema } from '../utils/types';

export const JsonHasKeysOptionsSchema = z.object({
  path: z.union([z.string(), z.array(z.string()).min(1)]),
  keys: z.array(z.string()).min(1),
});

export const JsonHasKeysSchema = z.object({
  name: z.literal('json-has-keys'),
  level: AlertLevelSchema,
  exceptions: z.array(regexPatternSchema).optional(),
  options: JsonHasKeysOptionsSchema,
});

export type JsonHasKeysOptions = z.input<typeof JsonHasKeysOptionsSchema>;

export const jsonHasKeys = async (
  context: RuleContext,
  ruleOptions: JsonHasKeysOptions,
) => {
  let sanitizedRuleOptions: z.output<typeof JsonHasKeysOptionsSchema>;
  try {
    sanitizedRuleOptions = JsonHasKeysOptionsSchema.parse(ruleOptions);
  } catch (error) {
    throw new Error(
      `Invalid rule options: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }

  return checkHasKeys(context, sanitizedRuleOptions, JSON.parse, 'JSON');
};
