import { fileContains } from "./rules/file-contains";
import { fileExists } from "./rules/file-exists";
import { fileForbidden } from "./rules/file-forbidden";
import { githubActionsTimeoutMinutes } from "./rules/github-actions-timeout-minutes";
import { licenseExists } from "./rules/license-exists";
import { readmeExists } from "./rules/readme-exists";

export const rulesMapper = {
  'file-contains': fileContains,
  'file-exists': fileExists,
  'file-forbidden': fileForbidden,
  'github-actions/timeout-minutes': githubActionsTimeoutMinutes,
  'license/exists': licenseExists,
  'readme/exists': readmeExists,
};
