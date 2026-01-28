import { fileContains } from "./rules/file-contains";
import { fileExists } from "./rules/file-exists";
import { fileForbidden } from "./rules/file-forbidden";
import { githubActionsTimeoutMinutes } from "./rules/github-actions-timeout-minutes";
import { licenseExists } from "./rules/license-exists";
import { pyprojectDependenciesAlphabeticalOrder } from "./rules/pyproject-dependencies-alphabetical-order";
import { readmeExists } from "./rules/readme-exists";
import { requirementsTxtDependenciesAlphabeticalOrder } from "./rules/requirements-txt-dependencies-alphabetical-order";

export const rulesMapper = {
  'file-contains': fileContains,
  'file-exists': fileExists,
  'file-forbidden': fileForbidden,
  'github-actions/timeout-minutes': githubActionsTimeoutMinutes,
  'license/exists': licenseExists,
  'python/pyproject-dependencies-alphabetical-order': pyprojectDependenciesAlphabeticalOrder,
  'python/requirements-txt-dependencies-alphabetical-order': requirementsTxtDependenciesAlphabeticalOrder,
  'readme/exists': readmeExists,
};
