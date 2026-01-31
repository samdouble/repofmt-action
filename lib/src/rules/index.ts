import z from 'zod';
import { FileContainsSchema } from './file-contains';
import { FileExistsSchema } from './file-exists';
import { FileForbiddenSchema } from './file-forbidden';
import { FileNotContainsSchema } from './file-not-contains';
import { GithubActionsTimeoutMinutesSchema } from './github-actions-timeout-minutes';
import { JsonHasKeysSchema } from './json-has-keys';
import { LicenseExistsSchema } from './license-exists';
import { PyprojectDependenciesAlphabeticalOrderSchema } from './pyproject-dependencies-alphabetical-order';
import { ReadmeExistsSchema } from './readme-exists';
import { ReadmeHasBadgesSchema } from './readme-has-badges';
import { ReadmeHasSectionSchema } from './readme-has-section';
import { RequirementsTxtDependenciesAlphabeticalOrderSchema } from './requirements-txt-dependencies-alphabetical-order';
import { YamlHasKeysSchema } from './yaml-has-keys';

export const ruleConfigSchema = z.union([
  FileContainsSchema,
  FileNotContainsSchema,
  FileExistsSchema,
  FileForbiddenSchema,
  GithubActionsTimeoutMinutesSchema,
  JsonHasKeysSchema,
  LicenseExistsSchema,
  PyprojectDependenciesAlphabeticalOrderSchema,
  ReadmeExistsSchema,
  ReadmeHasBadgesSchema,
  ReadmeHasSectionSchema,
  RequirementsTxtDependenciesAlphabeticalOrderSchema,
  YamlHasKeysSchema,
]);

export const rulesConfigSchema = z.array(ruleConfigSchema);

export type RulesConfig = z.infer<typeof rulesConfigSchema>;
