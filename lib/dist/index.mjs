// src/rules/file-exists.ts
import { z } from "zod";
var fileExistsOptionsSchema = z.object({
  caseSensitive: z.boolean().optional().default(false),
  path: z.string()
});
var fileExists = async (octokit, repository, ruleOptions) => {
  const { data: contents } = await octokit.rest.repos.getContent({
    owner: repository.owner.login,
    repo: repository.name,
    path: ""
  });
  let sanitizedRuleOptions;
  try {
    sanitizedRuleOptions = fileExistsOptionsSchema.parse(ruleOptions);
  } catch (error) {
    throw new Error(`Invalid rule options: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
  if (Array.isArray(contents)) {
    const file = contents.filter((item) => item.type === "file").find((item) => {
      return sanitizedRuleOptions.caseSensitive ? item.name === sanitizedRuleOptions.path : item.name.toLowerCase() === sanitizedRuleOptions.path.toLowerCase();
    });
    return !!file;
  }
  return false;
};

// src/rules/license-exists.ts
import { z as z2 } from "zod";
var licenseExistsOptionsSchema = z2.object({
  caseSensitive: z2.boolean().optional().default(false),
  path: z2.string().optional().default("LICENSE.md")
});
var licenseExists = async (octokit, repository, ruleOptions) => {
  let sanitizedRuleOptions;
  try {
    sanitizedRuleOptions = licenseExistsOptionsSchema.parse(ruleOptions);
  } catch (error) {
    throw new Error(`Invalid rule options: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
  return await fileExists(octokit, repository, sanitizedRuleOptions);
};

// src/rules/readme-exists.ts
import { z as z3 } from "zod";
var readmeExistsOptionsSchema = z3.object({
  caseSensitive: z3.boolean().optional().default(false),
  path: z3.string().optional().default("README.md")
});
var readmeExists = async (octokit, repository, ruleOptions) => {
  let sanitizedRuleOptions;
  try {
    sanitizedRuleOptions = readmeExistsOptionsSchema.parse(ruleOptions);
  } catch (error) {
    throw new Error(`Invalid rule options: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
  return await fileExists(octokit, repository, sanitizedRuleOptions);
};

// src/rulesMapper.ts
var rulesMapper = {
  "file-exists": fileExists,
  "license/exists": licenseExists,
  "readme/exists": readmeExists
};

// src/utils/config.ts
import { createJiti } from "jiti";
import * as fs from "fs";
import * as path from "path";
import { pathToFileURL } from "url";
import { z as z5 } from "zod";

// src/rules/index.ts
import z4 from "zod";
var ruleConfigSchema = z4.object({
  "file-exists": fileExistsOptionsSchema.optional(),
  "license/exists": licenseExistsOptionsSchema.optional(),
  "readme/exists": readmeExistsOptionsSchema.optional()
});

// src/utils/config.ts
var configSchema = z5.object({
  rules: ruleConfigSchema.optional().default({})
});
var CONFIG_FILES = [
  "repolint.config.ts",
  "repolint.config.js",
  "repolint.config.mjs",
  "repolint.config.cjs"
];
var getConfig = async (configPathArg) => {
  let configPath;
  if (configPathArg) {
    const resolvedPath = path.isAbsolute(configPathArg) ? configPathArg : path.join(process.cwd(), configPathArg);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Config file not found: ${configPathArg}`);
    }
    configPath = resolvedPath;
  } else {
    const workspaceRoot = process.cwd();
    for (const configFile of CONFIG_FILES) {
      const candidatePath = path.join(workspaceRoot, configFile);
      if (fs.existsSync(candidatePath)) {
        configPath = candidatePath;
        break;
      }
    }
    if (!configPath) {
      throw new Error(
        `No config file found. Create one of: ${CONFIG_FILES.join(", ")}`
      );
    }
  }
  console.info(`Found config at ${configPath}`);
  const jiti = createJiti(pathToFileURL(__filename).href);
  const configModule = await jiti.import(configPath);
  const rawConfig = configModule.default ?? configModule;
  const result = configSchema.safeParse(rawConfig);
  if (!result.success) {
    throw new Error(`Invalid config: ${result.error.message}`);
  }
  return result.data;
};

// src/index.ts
async function runRulesForRepo(octokit, repo, config) {
  const results = [];
  for (const [rule, ruleOptions] of Object.entries(config.rules ?? {})) {
    const ruleFunction = rulesMapper[rule];
    if (!ruleFunction) {
      throw new Error(`Rule ${rule} not found`);
    }
    const passed = await ruleFunction(octokit, repo, ruleOptions);
    results.push({ rule, passed });
  }
  return {
    repository: repo.full_name,
    results
  };
}
async function run(octokit, config) {
  const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
    visibility: "all",
    per_page: 100
  });
  const results = [];
  for (const repo of repos) {
    const repoResult = await runRulesForRepo(octokit, repo, config);
    results.push(repoResult);
  }
  return results;
}
export {
  configSchema,
  fileExists,
  getConfig,
  licenseExists,
  readmeExists,
  rulesMapper,
  run,
  runRulesForRepo
};
//# sourceMappingURL=index.mjs.map