import { fileContains } from "./rules/file-contains";
import { fileExists } from "./rules/file-exists";
import { fileForbidden } from "./rules/file-forbidden";
import { fileNotContains } from "./rules/file-not-contains";
import { githubActionsTimeoutMinutes } from "./rules/github-actions-timeout-minutes";
import { licenseExists } from "./rules/license-exists";
import { pyprojectDependenciesAlphabeticalOrder } from "./rules/pyproject-dependencies-alphabetical-order";
import { readmeExists } from "./rules/readme-exists";
import { requirementsTxtDependenciesAlphabeticalOrder } from "./rules/requirements-txt-dependencies-alphabetical-order";

export const rulesMapper = {
  'file-contains': fileContains,
  'file-exists': fileExists,
  'file-forbidden': fileForbidden,
  'file-not-contains': fileNotContains,
  'github-actions/timeout-minutes': githubActionsTimeoutMinutes,
  'license/exists': licenseExists,
  'python/pyproject-dependencies-alphabetical-order': pyprojectDependenciesAlphabeticalOrder,
  'python/requirements-txt-dependencies-alphabetical-order': requirementsTxtDependenciesAlphabeticalOrder,
  'readme/exists': readmeExists,
};
