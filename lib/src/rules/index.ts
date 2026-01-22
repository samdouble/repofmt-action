import z from 'zod';
import { FileExistsSchema } from './file-exists';
import { LicenseExistsSchema } from './license-exists';
import { ReadmeExistsSchema } from './readme-exists';

export const ruleConfigSchema = z.union([
  FileExistsSchema,
  LicenseExistsSchema,
  ReadmeExistsSchema,
]);

export const rulesConfigSchema = z.array(ruleConfigSchema);

export type RulesConfig = z.infer<typeof rulesConfigSchema>;
