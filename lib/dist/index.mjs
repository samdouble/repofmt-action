// src/rules/file-exists.ts
import nodePath from "path";
import { z as z2 } from "zod";

// src/utils/types.ts
import { z } from "zod";
var AlertLevelSchema = z.enum(["error", "warning"]);

// src/rules/file-exists.ts
var EntryTypeSchema = z2.enum(["file", "directory", "any"]).default("file");
var FileExistsOptionsSchema = z2.object({
  caseSensitive: z2.boolean().default(false),
  path: z2.union([z2.string(), z2.array(z2.string()).min(1)]),
  type: EntryTypeSchema
});
var FileExistsSchema = z2.object({
  name: z2.literal("file-exists"),
  level: AlertLevelSchema,
  options: FileExistsOptionsSchema
});
var checkEntryExists = async (context, entryPath, caseSensitive, entryType) => {
  const dirPath = nodePath.dirname(entryPath);
  const entryName = nodePath.basename(entryPath);
  const directoryPath = dirPath === "." ? "" : dirPath;
  let contents;
  try {
    contents = await context.getContent(directoryPath);
  } catch {
    return false;
  }
  if (!Array.isArray(contents)) {
    return false;
  }
  const entry = contents.filter((item) => {
    if (entryType === "any") return true;
    if (entryType === "file") return item.type === "file";
    if (entryType === "directory") return item.type === "dir";
    return false;
  }).find((item) => {
    return caseSensitive ? item.name === entryName : item.name.toLowerCase() === entryName.toLowerCase();
  });
  return !!entry;
};
var fileExists = async (context, ruleOptions) => {
  const errors = [];
  let sanitizedRuleOptions;
  try {
    sanitizedRuleOptions = FileExistsOptionsSchema.parse(ruleOptions);
  } catch (error) {
    throw new Error(`Invalid rule options: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
  const paths = Array.isArray(sanitizedRuleOptions.path) ? sanitizedRuleOptions.path : [sanitizedRuleOptions.path];
  for (const entryPath of paths) {
    const exists = await checkEntryExists(
      context,
      entryPath,
      sanitizedRuleOptions.caseSensitive,
      sanitizedRuleOptions.type
    );
    if (exists) {
      return { errors };
    }
  }
  const pathsDisplay = paths.length === 1 ? paths[0] : `one of [${paths.join(", ")}]`;
  errors.push(`${pathsDisplay} not found`);
  return { errors };
};

// src/rules/file-forbidden.ts
import nodePath2 from "path";
import { z as z3 } from "zod";
var EntryTypeSchema2 = z3.enum(["file", "directory", "any"]).default("file");
var FileForbiddenOptionsSchema = z3.object({
  caseSensitive: z3.boolean().default(false),
  path: z3.union([z3.string(), z3.array(z3.string()).min(1)]),
  type: EntryTypeSchema2
});
var FileForbiddenSchema = z3.object({
  name: z3.literal("file-forbidden"),
  level: AlertLevelSchema,
  options: FileForbiddenOptionsSchema
});
var checkEntryExists2 = async (context, entryPath, caseSensitive, entryType) => {
  const dirPath = nodePath2.dirname(entryPath);
  const entryName = nodePath2.basename(entryPath);
  const directoryPath = dirPath === "." ? "" : dirPath;
  let contents;
  try {
    contents = await context.getContent(directoryPath);
  } catch {
    return false;
  }
  if (!Array.isArray(contents)) {
    return false;
  }
  const entry = contents.filter((item) => {
    if (entryType === "any") return true;
    if (entryType === "file") return item.type === "file";
    if (entryType === "directory") return item.type === "dir";
    return false;
  }).find((item) => {
    return caseSensitive ? item.name === entryName : item.name.toLowerCase() === entryName.toLowerCase();
  });
  return !!entry;
};
var fileForbidden = async (context, ruleOptions) => {
  const errors = [];
  let sanitizedRuleOptions;
  try {
    sanitizedRuleOptions = FileForbiddenOptionsSchema.parse(ruleOptions);
  } catch (error) {
    throw new Error(`Invalid rule options: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
  const paths = Array.isArray(sanitizedRuleOptions.path) ? sanitizedRuleOptions.path : [sanitizedRuleOptions.path];
  const foundEntries = [];
  for (const entryPath of paths) {
    const exists = await checkEntryExists2(
      context,
      entryPath,
      sanitizedRuleOptions.caseSensitive,
      sanitizedRuleOptions.type
    );
    if (exists) {
      foundEntries.push(entryPath);
    }
  }
  if (foundEntries.length > 0) {
    const entriesDisplay = foundEntries.length === 1 ? foundEntries[0] : `[${foundEntries.join(", ")}]`;
    errors.push(`${entriesDisplay} should not exist`);
  }
  return { errors };
};

// src/rules/license-exists.ts
import { z as z4 } from "zod";
var LicenseExistsOptionsSchema = z4.object({
  caseSensitive: z4.boolean().default(false),
  path: z4.union([z4.string(), z4.array(z4.string()).min(1)]).default("LICENSE.md")
});
var LicenseExistsSchema = z4.object({
  name: z4.literal("license/exists"),
  level: AlertLevelSchema,
  options: LicenseExistsOptionsSchema
});
var licenseExists = async (context, ruleOptions) => {
  let sanitizedRuleOptions;
  try {
    sanitizedRuleOptions = LicenseExistsOptionsSchema.parse(ruleOptions);
  } catch (error) {
    throw new Error(`Invalid rule options: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
  const { errors } = await fileExists(context, sanitizedRuleOptions);
  return { errors };
};

// src/rules/readme-exists.ts
import { z as z5 } from "zod";
var ReadmeExistsOptionsSchema = z5.object({
  caseSensitive: z5.boolean().optional().default(false),
  path: z5.union([z5.string(), z5.array(z5.string()).min(1)]).optional().default("README.md")
});
var ReadmeExistsSchema = z5.object({
  name: z5.literal("readme/exists"),
  level: AlertLevelSchema,
  options: ReadmeExistsOptionsSchema
});
var readmeExists = async (context, ruleOptions) => {
  let sanitizedRuleOptions;
  try {
    sanitizedRuleOptions = ReadmeExistsOptionsSchema.parse(ruleOptions);
  } catch (error) {
    throw new Error(`Invalid rule options: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
  const { errors } = await fileExists(context, sanitizedRuleOptions);
  return { errors };
};

// src/rulesMapper.ts
var rulesMapper = {
  "file-exists": fileExists,
  "file-forbidden": fileForbidden,
  "license/exists": licenseExists,
  "readme/exists": readmeExists
};

// src/utils/context.ts
var RuleContext = class {
  constructor(octokit, repository) {
    this.octokit = octokit;
    this.repository = repository;
  }
  contentCache = /* @__PURE__ */ new Map();
  async getContent(path2 = "") {
    const cacheKey = `${this.repository.full_name}:${path2}`;
    if (this.contentCache.has(cacheKey)) {
      return this.contentCache.get(cacheKey);
    }
    const { data: contents } = await this.octokit.rest.repos.getContent({
      owner: this.repository.owner.login,
      repo: this.repository.name,
      path: path2
    });
    this.contentCache.set(cacheKey, contents);
    return contents;
  }
  clearCache() {
    this.contentCache.clear();
  }
};

// src/utils/config.ts
import { createJiti } from "jiti";
import * as fs from "fs";
import * as path from "path";
import { pathToFileURL } from "url";
import { z as z7 } from "zod";

// src/rules/index.ts
import z6 from "zod";
var ruleConfigSchema = z6.union([
  FileExistsSchema,
  FileForbiddenSchema,
  LicenseExistsSchema,
  ReadmeExistsSchema
]);
var rulesConfigSchema = z6.array(ruleConfigSchema);

// src/utils/config.ts
var configSchema = z7.object({
  rules: rulesConfigSchema.optional().default([])
});
var CONFIG_FILES = [
  "repofmt.config.ts",
  "repofmt.config.js",
  "repofmt.config.mjs",
  "repofmt.config.cjs"
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
  const context = new RuleContext(octokit, repo);
  for (const ruleConfig of config.rules ?? []) {
    const { name: rule, level: alertLevel, options: ruleOptions } = ruleConfig;
    const ruleFunction = rulesMapper[rule];
    if (!ruleFunction) {
      throw new Error(`Rule ${rule} not found`);
    }
    const { errors } = await ruleFunction(context, ruleOptions);
    if (errors.length > 0) {
      if (alertLevel === "error") {
        results.push({ rule, errors });
      } else if (alertLevel === "warning") {
        results.push({ rule, warnings: errors });
      }
    }
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
  RuleContext,
  configSchema,
  fileExists,
  fileForbidden,
  getConfig,
  licenseExists,
  readmeExists,
  rulesMapper,
  run,
  runRulesForRepo
};
//# sourceMappingURL=index.mjs.map