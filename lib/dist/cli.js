#!/usr/bin/env node
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

// src/cli.ts
var cli_exports = {};
__export(cli_exports, {
  default: () => cli_default
});
module.exports = __toCommonJS(cli_exports);
var import_commander = require("commander");
var import_node_fs = require("fs");
var import_node_path = require("path");
var import_github = require("@actions/github");

// src/rules/file-exists.ts
var import_zod = require("zod");
var fileExistsOptionsSchema = import_zod.z.object({
  caseSensitive: import_zod.z.boolean().optional().default(false),
  path: import_zod.z.string()
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
var import_zod2 = require("zod");
var licenseExistsOptionsSchema = import_zod2.z.object({
  caseSensitive: import_zod2.z.boolean().optional().default(false),
  path: import_zod2.z.string().optional().default("LICENSE.md")
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
var import_zod3 = require("zod");
var readmeExistsOptionsSchema = import_zod3.z.object({
  caseSensitive: import_zod3.z.boolean().optional().default(false),
  path: import_zod3.z.string().optional().default("README.md")
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
var import_jiti = require("jiti");
var fs = __toESM(require("fs"));
var path = __toESM(require("path"));
var import_node_url = require("url");
var import_zod5 = require("zod");

// src/rules/index.ts
var import_zod4 = __toESM(require("zod"));
var ruleConfigSchema = import_zod4.default.object({
  "file-exists": fileExistsOptionsSchema.optional(),
  "license/exists": licenseExistsOptionsSchema.optional(),
  "readme/exists": readmeExistsOptionsSchema.optional()
});

// src/utils/config.ts
var configSchema = import_zod5.z.object({
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

// src/cli.ts
var packageJson = JSON.parse(
  (0, import_node_fs.readFileSync)((0, import_node_path.join)(__dirname, "../package.json"), "utf-8")
);
var program = new import_commander.Command();
program.name("repolint").description("A CLI tool that checks consistency across repositories").version(packageJson.version);
program.command("run").description("Run repolint checks against your repositories").option("--config <path>", "path to config file").option("--token <token>", "GitHub token (can also use GITHUB_TOKEN env var)").action(async (options) => {
  console.log("Running repolint...");
  let config;
  try {
    config = await getConfig(options.config);
  } catch (error) {
    console.error(
      `Configuration error: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    process.exit(1);
  }
  const token = options.token ?? process.env.GITHUB_TOKEN;
  if (!token) {
    console.error("GitHub token is required. Use --token or set GITHUB_TOKEN environment variable");
    process.exit(1);
  }
  const octokit = (0, import_github.getOctokit)(token);
  try {
    const results = await run(octokit, config);
    let hasFailures = false;
    for (const repoResult of results) {
      console.log(`
${repoResult.repository}`);
      console.log("=".repeat(repoResult.repository.length));
      for (const { rule, passed } of repoResult.results) {
        const icon = passed ? "\u2713" : "\u2717";
        console.log(`  ${icon} ${rule}`);
        if (!passed) hasFailures = true;
      }
    }
    process.exit(hasFailures ? 1 : 0);
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    process.exit(1);
  }
});
if (process.env.NODE_ENV !== "test") {
  program.parse();
}
var cli_default = program;
//# sourceMappingURL=cli.js.map