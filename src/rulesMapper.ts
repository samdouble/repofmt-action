import { fileExists } from "./rules/file-exists";
import { licenseExists } from "./rules/license-exists";
import { readmeExists } from "./rules/readme-exists";

export const rulesMapper = {
  'file-exists': fileExists,
  'license/exists': licenseExists,
  'readme/exists': readmeExists,
};
