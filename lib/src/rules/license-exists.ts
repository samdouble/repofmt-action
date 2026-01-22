import { z } from 'zod';
import { fileExists } from './file-exists';
import { AlertLevelSchema } from '../utils/types';
import type { RuleContext } from '../utils/context';

export const LicenseExistsOptionsSchema = z.object({
  caseSensitive: z.boolean().default(false),
  path: z.string().default('LICENSE.md'),
});

export const LicenseExistsSchema = z.object({
  name: z.literal('license/exists'),
  level: AlertLevelSchema,
  options: LicenseExistsOptionsSchema,
});

export type LicenseExistsOptions = z.input<typeof LicenseExistsOptionsSchema>;

export const licenseExists = async (context: RuleContext, ruleOptions: LicenseExistsOptions) => {
  let sanitizedRuleOptions: z.output<typeof LicenseExistsOptionsSchema>;
  try {
    sanitizedRuleOptions = LicenseExistsOptionsSchema.parse(ruleOptions);
  } catch (error) {
    throw new Error(`Invalid rule options: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  const { errors } = await fileExists(context, sanitizedRuleOptions);
  return { errors };
};
