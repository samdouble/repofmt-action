import z from 'zod';
import { FileContainsSchema } from './file-contains';
import { FileExistsSchema } from './file-exists';
import { FileForbiddenSchema } from './file-forbidden';
import { FileNotContainsSchema } from './file-not-contains';
import { GithubActionsTimeoutMinutesSchema } from './github-actions-timeout-minutes';
import { LicenseExistsSchema } from './license-exists';
import { PyprojectDependenciesAlphabeticalOrderSchema } from './pyproject-dependencies-alphabetical-order';
import { ReadmeExistsSchema } from './readme-exists';
import { RequirementsTxtDependenciesAlphabeticalOrderSchema } from './requirements-txt-dependencies-alphabetical-order';

export const ruleConfigSchema = z.union([
  FileContainsSchema,
  FileNotContainsSchema,
  FileExistsSchema,
  FileForbiddenSchema,
  GithubActionsTimeoutMinutesSchema,
  LicenseExistsSchema,
  PyprojectDependenciesAlphabeticalOrderSchema,
  ReadmeExistsSchema,
  RequirementsTxtDependenciesAlphabeticalOrderSchema,
]);

export const rulesConfigSchema = z.array(ruleConfigSchema);

export type RulesConfig = z.infer<typeof rulesConfigSchema>;
