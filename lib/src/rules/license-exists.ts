import { z } from 'zod';
import type { RuleContext } from '../utils/context';
import { createRuleSchema } from '../utils/rule-schema';
import { fileExists } from './file-exists';

export const LicenseExistsOptionsSchema = z.object({
  caseSensitive: z.boolean().default(false),
  path: z.union([z.string(), z.array(z.string()).min(1)]).default('LICENSE.md'),
});

export const LicenseExistsSchema = createRuleSchema('license/exists', LicenseExistsOptionsSchema);

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
