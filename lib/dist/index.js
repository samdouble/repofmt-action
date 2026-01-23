"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  RuleContext: () => RuleContext,
  configSchema: () => configSchema,
  fileExists: () => fileExists,
  fileForbidden: () => fileForbidden,
  getConfig: () => getConfig,
  licenseExists: () => licenseExists,
  readmeExists: () => readmeExists,
  rulesMapper: () => rulesMapper,
  run: () => run,
  runRulesForRepo: () => runRulesForRepo
});
module.exports = __toCommonJS(index_exports);

// src/rules/file-exists.ts
var import_node_path = __toESM(require("path"));
var import_zod2 = require("zod");

// src/utils/types.ts
var import_zod = require("zod");
var AlertLevelSchema = import_zod.z.enum(["error", "warning"]);

// src/rules/file-exists.ts
var EntryTypeSchema = import_zod2.z.enum(["file", "directory", "any"]).default("file");
var FileExistsOptionsSchema = import_zod2.z.object({
  caseSensitive: import_zod2.z.boolean().default(false),
  path: import_zod2.z.union([import_zod2.z.string(), import_zod2.z.array(import_zod2.z.string()).min(1)]),
  type: EntryTypeSchema
});
var FileExistsSchema = import_zod2.z.object({
  name: import_zod2.z.literal("file-exists"),
  level: AlertLevelSchema,
  options: FileExistsOptionsSchema
});
var checkEntryExists = async (context, entryPath, caseSensitive, entryType) => {
  const dirPath = import_node_path.default.dirname(entryPath);
  const entryName = import_node_path.default.basename(entryPath);
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
var import_node_path2 = __toESM(require("path"));
var import_zod3 = require("zod");
var EntryTypeSchema2 = import_zod3.z.enum(["file", "directory", "any"]).default("file");
var FileForbiddenOptionsSchema = import_zod3.z.object({
  caseSensitive: import_zod3.z.boolean().default(false),
  path: import_zod3.z.union([import_zod3.z.string(), import_zod3.z.array(import_zod3.z.string()).min(1)]),
  type: EntryTypeSchema2
});
var FileForbiddenSchema = import_zod3.z.object({
  name: import_zod3.z.literal("file-forbidden"),
  level: AlertLevelSchema,
  options: FileForbiddenOptionsSchema
});
var checkEntryExists2 = async (context, entryPath, caseSensitive, entryType) => {
  const dirPath = import_node_path2.default.dirname(entryPath);
  const entryName = import_node_path2.default.basename(entryPath);
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
var import_zod4 = require("zod");
var LicenseExistsOptionsSchema = import_zod4.z.object({
  caseSensitive: import_zod4.z.boolean().default(false),
  path: import_zod4.z.union([import_zod4.z.string(), import_zod4.z.array(import_zod4.z.string()).min(1)]).default("LICENSE.md")
});
var LicenseExistsSchema = import_zod4.z.object({
  name: import_zod4.z.literal("license/exists"),
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
var import_zod5 = require("zod");
var ReadmeExistsOptionsSchema = import_zod5.z.object({
  caseSensitive: import_zod5.z.boolean().optional().default(false),
  path: import_zod5.z.union([import_zod5.z.string(), import_zod5.z.array(import_zod5.z.string()).min(1)]).optional().default("README.md")
});
var ReadmeExistsSchema = import_zod5.z.object({
  name: import_zod5.z.literal("readme/exists"),
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
var import_jiti = require("jiti");
var fs = __toESM(require("fs"));
var path = __toESM(require("path"));
var import_node_url = require("url");
var import_zod7 = require("zod");

// src/rules/index.ts
var import_zod6 = __toESM(require("zod"));
var ruleConfigSchema = import_zod6.default.union([
  FileExistsSchema,
  FileForbiddenSchema,
  LicenseExistsSchema,
  ReadmeExistsSchema
]);
var rulesConfigSchema = import_zod6.default.array(ruleConfigSchema);

// src/utils/config.ts
var configSchema = import_zod7.z.object({
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
  const jiti = (0, import_jiti.createJiti)((0, import_node_url.pathToFileURL)(__filename).href);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
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
});
//# sourceMappingURL=index.js.map