import { parse as parseYaml } from 'yaml';
import { z } from 'zod';
import type { RuleContext } from '../utils/context';
import { checkHasKeys } from '../utils/has-keys';
import { AlertLevelSchema } from '../utils/types';

export const YamlHasKeysOptionsSchema = z.object({
  path: z.union([z.string(), z.array(z.string()).min(1)]),
  keys: z.array(z.string()).min(1),
});

export const YamlHasKeysSchema = z.object({
  name: z.literal('yaml-has-keys'),
  level: AlertLevelSchema,
  options: YamlHasKeysOptionsSchema,
});

export type YamlHasKeysOptions = z.input<typeof YamlHasKeysOptionsSchema>;

export const yamlHasKeys = async (
  context: RuleContext,
  ruleOptions: YamlHasKeysOptions,
) => {
  let sanitizedRuleOptions: z.output<typeof YamlHasKeysOptionsSchema>;
  try {
    sanitizedRuleOptions = YamlHasKeysOptionsSchema.parse(ruleOptions);
  } catch (error) {
    throw new Error(
      `Invalid rule options: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }

  return checkHasKeys(context, sanitizedRuleOptions, parseYaml, 'YAML');
};
