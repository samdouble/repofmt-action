import z from 'zod';
import { FileContainsSchema } from './file-contains';
import { FileExistsSchema } from './file-exists';
import { FileForbiddenSchema } from './file-forbidden';
import { GithubActionsTimeoutMinutesSchema } from './github-actions-timeout-minutes';
import { LicenseExistsSchema } from './license-exists';
import { ReadmeExistsSchema } from './readme-exists';

export const ruleConfigSchema = z.union([
  FileContainsSchema,
  FileExistsSchema,
  FileForbiddenSchema,
  GithubActionsTimeoutMinutesSchema,
  LicenseExistsSchema,
  ReadmeExistsSchema,
]);

export const rulesConfigSchema = z.array(ruleConfigSchema);

export type RulesConfig = z.infer<typeof rulesConfigSchema>;
