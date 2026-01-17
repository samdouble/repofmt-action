import z from 'zod';
import { fileExistsOptionsSchema } from './file-exists';
import { licenseExistsOptionsSchema } from './license-exists';
import { readmeExistsOptionsSchema } from './readme-exists';

export * from './readme-exists';

export const ruleConfigSchema = z.object({
  'file-exists': fileExistsOptionsSchema.optional(),
  'license/exists': licenseExistsOptionsSchema.optional(),
  'readme/exists': readmeExistsOptionsSchema.optional(),
});

export type RuleConfig = z.infer<typeof ruleConfigSchema>;
export type RuleName = keyof RuleConfig;
