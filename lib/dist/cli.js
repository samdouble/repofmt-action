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
var import_node_path3 = require("path");
var import_github = require("@actions/github");

// src/rules/file-contains.ts
var import_zod3 = require("zod");

// src/utils/files.ts
var import_minimatch = require("minimatch");
var isGlobPattern = (path2) => {
  return /[*?[\]{}]/.test(path2);
};
var findMatchingFiles = async (context, pattern, caseSensitive) => {
  const allFiles = await context.getAllFiles();
  return allFiles.filter((entry) => entry.type === "file").filter(
    (entry) => (0, import_minimatch.minimatch)(entry.path, pattern, {
      nocase: !caseSensitive,
      dot: true
    })
  ).map((entry) => entry.path);
};

// src/utils/rule-schema.ts
var import_zod2 = require("zod");

// src/utils/types.ts
var import_zod = require("zod");
var AlertLevelSchema = import_zod.z.enum(["error", "warning"]);

// src/utils/rule-schema.ts
var regexPatternSchema = import_zod2.z.string().refine(
  (pattern) => {
    try {
      new RegExp(pattern);
      return true;
    } catch {
      return false;
    }
  },
  {
    message: "Invalid regex pattern"
  }
);
var exceptionsSchema = import_zod2.z.array(regexPatternSchema).optional();
function createRuleSchema(name, optionsSchema) {
  return import_zod2.z.object({
    name: import_zod2.z.literal(name),
    level: AlertLevelSchema,
    exceptions: exceptionsSchema,
    options: optionsSchema
  });
}

// src/rules/file-contains.ts
var FileContainsOptionsSchema = import_zod3.z.object({
  path: import_zod3.z.union([import_zod3.z.string(), import_zod3.z.array(import_zod3.z.string()).min(1)]),
  contains: import_zod3.z.string(),
  caseSensitive: import_zod3.z.boolean().default(false)
});
var FileContainsSchema = createRuleSchema("file-contains", FileContainsOptionsSchema);
var fileContains = async (context, ruleOptions) => {
  const errors = [];
  let sanitizedRuleOptions;
  try {
    sanitizedRuleOptions = FileContainsOptionsSchema.parse(ruleOptions);
  } catch (error) {
    throw new Error(
      `Invalid rule options: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
  const { path: path2, contains, caseSensitive } = sanitizedRuleOptions;
  const paths = Array.isArray(path2) ? path2 : [path2];
  const searchText = caseSensitive ? contains : contains.toLowerCase();
  for (const pathPattern of paths) {
    const isPattern = isGlobPattern(pathPattern);
    let filesToCheck;
    if (isPattern) {
      filesToCheck = await findMatchingFiles(context, pathPattern, caseSensitive);
      if (filesToCheck.length === 0) {
        errors.push(`${pathPattern}: no files match pattern`);
        continue;
      }
    } else {
      filesToCheck = [pathPattern];
    }
    for (const filePath of filesToCheck) {
      let fileContent;
      try {
        fileContent = await context.getFileContent(filePath);
      } catch (error) {
        errors.push(
          `${filePath}: ${error instanceof Error ? error.message : "failed to read file"}`
        );
        continue;
      }
      const contentToSearch = caseSensitive ? fileContent : fileContent.toLowerCase();
      if (!contentToSearch.includes(searchText)) {
        errors.push(`${filePath}: file does not contain "${contains}"`);
      }
    }
  }
  return { errors };
};

// src/rules/file-exists.ts
var import_minimatch2 = require("minimatch");
var import_node_path = __toESM(require("path"));
var import_zod4 = require("zod");
var EntryTypeSchema = import_zod4.z.enum(["file", "directory", "any"]).default("file");
var FileExistsOptionsSchema = import_zod4.z.object({
  caseSensitive: import_zod4.z.boolean().default(false),
  path: import_zod4.z.union([import_zod4.z.string(), import_zod4.z.array(import_zod4.z.string()).min(1)]),
  type: EntryTypeSchema
});
var FileExistsSchema = createRuleSchema("file-exists", FileExistsOptionsSchema);
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
var checkPatternExists = async (context, pattern, caseSensitive, entryType) => {
  const allFiles = await context.getAllFiles();
  const matchingEntry = allFiles.find((entry) => {
    if (entryType === "file" && entry.type !== "file") return false;
    if (entryType === "directory" && entry.type !== "dir") return false;
    return (0, import_minimatch2.minimatch)(entry.path, pattern, {
      nocase: !caseSensitive,
      dot: true
    });
  });
  return !!matchingEntry;
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
    const isPattern = isGlobPattern(entryPath);
    const exists = isPattern ? await checkPatternExists(context, entryPath, sanitizedRuleOptions.caseSensitive, sanitizedRuleOptions.type) : await checkEntryExists(context, entryPath, sanitizedRuleOptions.caseSensitive, sanitizedRuleOptions.type);
    if (exists) {
      return { errors };
    }
  }
  const pathsDisplay = paths.length === 1 ? paths[0] : `one of [${paths.join(", ")}]`;
  errors.push(`${pathsDisplay} not found`);
  return { errors };
};

// src/rules/file-forbidden.ts
var import_minimatch3 = require("minimatch");
var import_node_path2 = __toESM(require("path"));
var import_zod5 = require("zod");
var EntryTypeSchema2 = import_zod5.z.enum(["file", "directory", "any"]).default("file");
var FileForbiddenOptionsSchema = import_zod5.z.object({
  caseSensitive: import_zod5.z.boolean().default(false),
  path: import_zod5.z.union([import_zod5.z.string(), import_zod5.z.array(import_zod5.z.string()).min(1)]),
  type: EntryTypeSchema2
});
var FileForbiddenSchema = createRuleSchema("file-forbidden", FileForbiddenOptionsSchema);
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
var findMatchingEntries = async (context, pattern, caseSensitive, entryType) => {
  const allFiles = await context.getAllFiles();
  return allFiles.filter((entry) => {
    if (entryType === "file" && entry.type !== "file") return false;
    if (entryType === "directory" && entry.type !== "dir") return false;
    return (0, import_minimatch3.minimatch)(entry.path, pattern, {
      nocase: !caseSensitive,
      dot: true
    });
  }).map((entry) => entry.path);
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
    const isPattern = isGlobPattern(entryPath);
    if (isPattern) {
      const matches = await findMatchingEntries(
        context,
        entryPath,
        sanitizedRuleOptions.caseSensitive,
        sanitizedRuleOptions.type
      );
      foundEntries.push(...matches);
    } else {
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
  }
  if (foundEntries.length > 0) {
    const uniqueEntries = [...new Set(foundEntries)];
    const entriesDisplay = uniqueEntries.length === 1 ? uniqueEntries[0] : `[${uniqueEntries.join(", ")}]`;
    errors.push(`${entriesDisplay} should not exist`);
  }
  return { errors };
};

// src/rules/file-not-contains.ts
var import_zod6 = require("zod");
var FileNotContainsOptionsSchema = import_zod6.z.object({
  path: import_zod6.z.union([import_zod6.z.string(), import_zod6.z.array(import_zod6.z.string()).min(1)]),
  contains: import_zod6.z.string(),
  caseSensitive: import_zod6.z.boolean().default(false)
});
var FileNotContainsSchema = createRuleSchema("file-not-contains", FileNotContainsOptionsSchema);
var fileNotContains = async (context, ruleOptions) => {
  const errors = [];
  let sanitizedRuleOptions;
  try {
    sanitizedRuleOptions = FileNotContainsOptionsSchema.parse(ruleOptions);
  } catch (error) {
    throw new Error(
      `Invalid rule options: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
  const { path: path2, contains, caseSensitive } = sanitizedRuleOptions;
  const paths = Array.isArray(path2) ? path2 : [path2];
  const searchText = caseSensitive ? contains : contains.toLowerCase();
  for (const pathPattern of paths) {
    const isPattern = isGlobPattern(pathPattern);
    let filesToCheck;
    if (isPattern) {
      filesToCheck = await findMatchingFiles(context, pathPattern, caseSensitive);
      if (filesToCheck.length === 0) {
        continue;
      }
    } else {
      filesToCheck = [pathPattern];
    }
    for (const filePath of filesToCheck) {
      let fileContent;
      try {
        fileContent = await context.getFileContent(filePath);
      } catch {
        continue;
      }
      const contentToSearch = caseSensitive ? fileContent : fileContent.toLowerCase();
      if (contentToSearch.includes(searchText)) {
        errors.push(`${filePath}: file contains "${contains}"`);
      }
    }
  }
  return { errors };
};

// src/rules/github-actions-timeout-minutes.ts
var import_yaml = require("yaml");
var import_zod7 = require("zod");
var GithubActionsTimeoutMinutesOptionsSchema = import_zod7.z.object({
  maximum: import_zod7.z.number().positive().optional()
});
var GithubActionsTimeoutMinutesSchema = createRuleSchema(
  "github-actions/timeout-minutes",
  GithubActionsTimeoutMinutesOptionsSchema.optional()
);
var githubActionsTimeoutMinutes = async (context, ruleOptions = {}) => {
  const errors = [];
  const workflowsPath = ".github/workflows";
  let workflowFiles;
  try {
    const contents = await context.getContent(workflowsPath);
    if (!Array.isArray(contents)) {
      return { errors };
    }
    workflowFiles = contents.filter(
      (item) => item.type === "file" && (item.name.endsWith(".yml") || item.name.endsWith(".yaml"))
    );
  } catch {
    return { errors };
  }
  for (const file of workflowFiles) {
    const filePath = `${workflowsPath}/${file.name}`;
    let content;
    try {
      content = await context.getFileContent(filePath);
    } catch (error) {
      errors.push(
        `${filePath}: failed to read file: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      continue;
    }
    let workflow;
    try {
      workflow = (0, import_yaml.parse)(content);
    } catch (error) {
      errors.push(
        `${filePath}: failed to parse YAML: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      continue;
    }
    if (workflow?.jobs) {
      for (const jobName of Object.keys(workflow.jobs)) {
        const job = workflow.jobs[jobName];
        const timeoutMinutes = job?.["timeout-minutes"];
        if (timeoutMinutes === void 0) {
          errors.push(`${filePath}: job "${jobName}" is missing timeout-minutes`);
        } else if (ruleOptions.maximum !== void 0 && timeoutMinutes > ruleOptions.maximum) {
          errors.push(
            `${filePath}: job "${jobName}" has timeout-minutes (${timeoutMinutes}) that is higher than ${ruleOptions.maximum}`
          );
        }
      }
    }
  }
  return { errors };
};

// src/rules/json-has-keys.ts
var import_zod8 = require("zod");

// src/utils/has-keys.ts
var getNestedValue = (obj, keyPath) => {
  const parts = keyPath.split(".");
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === "object" && !Array.isArray(current) && part in current) {
      current = current[part];
    } else {
      return void 0;
    }
  }
  return current;
};
var hasKey = (obj, keyPath) => {
  const value = getNestedValue(obj, keyPath);
  return value !== void 0;
};
var checkHasKeys = async (context, options, parse, formatName) => {
  const errors = [];
  const { path: path2, keys } = options;
  const paths = Array.isArray(path2) ? path2 : [path2];
  for (const pathPattern of paths) {
    const isPattern = isGlobPattern(pathPattern);
    let filesToCheck;
    if (isPattern) {
      filesToCheck = await findMatchingFiles(context, pathPattern, false);
      if (filesToCheck.length === 0) {
        errors.push(`${pathPattern}: no files match pattern`);
        continue;
      }
    } else {
      filesToCheck = [pathPattern];
    }
    for (const filePath of filesToCheck) {
      let fileContent;
      try {
        fileContent = await context.getFileContent(filePath);
      } catch (error) {
        errors.push(
          `${filePath}: ${error instanceof Error ? error.message : "failed to read file"}`
        );
        continue;
      }
      let parsedContent;
      try {
        parsedContent = parse(fileContent);
      } catch (error) {
        errors.push(
          `${filePath}: failed to parse ${formatName}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
        continue;
      }
      for (const key of keys) {
        if (!hasKey(parsedContent, key)) {
          errors.push(`${filePath}: missing key "${key}"`);
        }
      }
    }
  }
  return { errors };
};

// src/rules/json-has-keys.ts
var JsonHasKeysOptionsSchema = import_zod8.z.object({
  path: import_zod8.z.union([import_zod8.z.string(), import_zod8.z.array(import_zod8.z.string()).min(1)]),
  keys: import_zod8.z.array(import_zod8.z.string()).min(1)
});
var JsonHasKeysSchema = createRuleSchema("json-has-keys", JsonHasKeysOptionsSchema);
var jsonHasKeys = async (context, ruleOptions) => {
  let sanitizedRuleOptions;
  try {
    sanitizedRuleOptions = JsonHasKeysOptionsSchema.parse(ruleOptions);
  } catch (error) {
    throw new Error(
      `Invalid rule options: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
  return checkHasKeys(context, sanitizedRuleOptions, JSON.parse, "JSON");
};

// src/rules/license-exists.ts
var import_zod9 = require("zod");
var LicenseExistsOptionsSchema = import_zod9.z.object({
  caseSensitive: import_zod9.z.boolean().default(false),
  path: import_zod9.z.union([import_zod9.z.string(), import_zod9.z.array(import_zod9.z.string()).min(1)]).default("LICENSE.md")
});
var LicenseExistsSchema = createRuleSchema("license/exists", LicenseExistsOptionsSchema);
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

// src/rules/pyproject-dependencies-alphabetical-order.ts
var import_smol_toml = require("smol-toml");
var import_zod10 = require("zod");
var PyprojectDependenciesAlphabeticalOrderOptionsSchema = import_zod10.z.object({
  path: import_zod10.z.string().default("pyproject.toml"),
  sections: import_zod10.z.array(import_zod10.z.string()).default(["project.dependencies", "project.optional-dependencies", "tool.poetry.dependencies"])
});
var PyprojectDependenciesAlphabeticalOrderSchema = createRuleSchema(
  "python/pyproject-dependencies-alphabetical-order",
  PyprojectDependenciesAlphabeticalOrderOptionsSchema.optional()
);
var getDependencyName = (dep) => {
  const match = dep.match(/^([a-zA-Z0-9_-]+(?:\[[^\]]+\])?)/);
  return match ? match[1].toLowerCase() : dep.toLowerCase();
};
var checkAlphabeticalOrder = (dependencies, sectionPath) => {
  const errors = [];
  const sorted = [...dependencies].sort((a, b) => {
    const nameA = getDependencyName(a);
    const nameB = getDependencyName(b);
    return nameA.localeCompare(nameB);
  });
  for (let i = 0; i < dependencies.length; i++) {
    if (dependencies[i] !== sorted[i]) {
      errors.push(
        `${sectionPath}: dependencies are not in alphabetical order. Expected "${sorted[i]}" but found "${dependencies[i]}"`
      );
      break;
    }
  }
  return errors;
};
var getNestedValue2 = (obj, path2) => {
  const parts = path2.split(".");
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = current[part];
    } else {
      return void 0;
    }
  }
  return current;
};
var pyprojectDependenciesAlphabeticalOrder = async (context, ruleOptions = {}) => {
  const errors = [];
  let sanitizedRuleOptions;
  try {
    sanitizedRuleOptions = PyprojectDependenciesAlphabeticalOrderOptionsSchema.parse(ruleOptions);
  } catch (error) {
    throw new Error(
      `Invalid rule options: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
  const { path: path2, sections } = sanitizedRuleOptions;
  let content;
  try {
    content = await context.getFileContent(path2);
  } catch (error) {
    errors.push(
      `${path2}: ${error instanceof Error ? error.message : "failed to read file"}`
    );
    return { errors };
  }
  let pyproject;
  try {
    pyproject = (0, import_smol_toml.parse)(content);
  } catch (error) {
    errors.push(
      `${path2}: failed to parse TOML: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    return { errors };
  }
  for (const sectionPath of sections) {
    const sectionValue = getNestedValue2(pyproject, sectionPath);
    if (sectionValue === void 0) {
      continue;
    }
    if (sectionPath === "project.dependencies") {
      if (Array.isArray(sectionValue)) {
        const deps = sectionValue;
        if (deps.length > 0) {
          errors.push(...checkAlphabeticalOrder(deps, `${path2}:${sectionPath}`));
        }
      }
    } else if (sectionPath === "project.optional-dependencies") {
      if (sectionValue && typeof sectionValue === "object") {
        const optionalDeps = sectionValue;
        for (const [groupName, deps] of Object.entries(optionalDeps)) {
          if (Array.isArray(deps) && deps.length > 0) {
            errors.push(
              ...checkAlphabeticalOrder(deps, `${path2}:${sectionPath}.${groupName}`)
            );
          }
        }
      }
    } else if (sectionPath === "tool.poetry.dependencies") {
      if (sectionValue && typeof sectionValue === "object") {
        const poetryDeps = sectionValue;
        const depNames = Object.keys(poetryDeps).filter(
          (key) => key !== "python"
        );
        if (depNames.length > 0) {
          const sorted = [...depNames].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
          for (let i = 0; i < depNames.length; i++) {
            if (depNames[i] !== sorted[i]) {
              errors.push(
                `${path2}:${sectionPath}: dependencies are not in alphabetical order. Expected "${sorted[i]}" but found "${depNames[i]}"`
              );
              break;
            }
          }
        }
      }
    }
  }
  return { errors };
};

// src/rules/readme-exists.ts
var import_zod11 = require("zod");
var ReadmeExistsOptionsSchema = import_zod11.z.object({
  caseSensitive: import_zod11.z.boolean().optional().default(false),
  path: import_zod11.z.union([import_zod11.z.string(), import_zod11.z.array(import_zod11.z.string()).min(1)]).optional().default("README.md")
});
var ReadmeExistsSchema = createRuleSchema("readme/exists", ReadmeExistsOptionsSchema);
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

// src/rules/requirements-txt-dependencies-alphabetical-order.ts
var import_zod12 = require("zod");

// src/utils/python/requirements.ts
var extractPackageNameFromUrl = (url) => {
  const eggMatch = url.match(/#egg=([a-zA-Z0-9_-]+)/);
  if (eggMatch) {
    return eggMatch[1].toLowerCase();
  }
  const urlMatch = url.match(/(?:github\.com|gitlab\.com|bitbucket\.org)[/:]([^/]+)\/([^/]+?)(?:\.git|@|#|$)/);
  if (urlMatch) {
    return urlMatch[2].toLowerCase();
  }
  return url.toLowerCase();
};
var getDependencyName2 = (line) => {
  const trimmed = line.trim();
  if (trimmed.startsWith("-e ")) {
    const rest = trimmed.slice(3).trim();
    if (rest.startsWith(".") || rest.startsWith("/")) {
      const parts = rest.split(/[/\\]/);
      const lastPart = parts[parts.length - 1];
      return lastPart.toLowerCase();
    }
    return extractPackageNameFromUrl(rest);
  }
  if (trimmed.includes("git+") || trimmed.includes("@git+")) {
    return extractPackageNameFromUrl(trimmed);
  }
  if (trimmed.startsWith(".") || trimmed.startsWith("/")) {
    const parts = trimmed.split(/[/\\]/);
    const lastPart = parts[parts.length - 1];
    return lastPart.toLowerCase();
  }
  const match = trimmed.match(/^([a-zA-Z0-9_-]+(?:\[[^\]]+\])?)/);
  return match ? match[1].toLowerCase() : trimmed.toLowerCase();
};
var parseRequirementsFile = (content) => {
  const lines = content.split("\n");
  const dependencies = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) {
      continue;
    }
    const commentIndex = trimmed.indexOf("#");
    const lineContent = commentIndex >= 0 ? trimmed.slice(0, commentIndex).trim() : trimmed;
    if (lineContent === "") {
      continue;
    }
    dependencies.push(lineContent);
  }
  return dependencies;
};

// src/rules/requirements-txt-dependencies-alphabetical-order.ts
var RequirementsTxtDependenciesAlphabeticalOrderOptionsSchema = import_zod12.z.object({
  path: import_zod12.z.string().default("requirements.txt")
});
var RequirementsTxtDependenciesAlphabeticalOrderSchema = createRuleSchema(
  "python/requirements-txt-dependencies-alphabetical-order",
  RequirementsTxtDependenciesAlphabeticalOrderOptionsSchema.optional()
);
var checkAlphabeticalOrder2 = (dependencies, filePath) => {
  const errors = [];
  const sorted = [...dependencies].sort((a, b) => {
    const nameA = getDependencyName2(a);
    const nameB = getDependencyName2(b);
    return nameA.localeCompare(nameB);
  });
  for (let i = 0; i < dependencies.length; i++) {
    if (dependencies[i] !== sorted[i]) {
      errors.push(
        `${filePath}: dependencies are not in alphabetical order. Expected "${sorted[i]}" but found "${dependencies[i]}"`
      );
      break;
    }
  }
  return errors;
};
var requirementsTxtDependenciesAlphabeticalOrder = async (context, ruleOptions = {}) => {
  const errors = [];
  let sanitizedRuleOptions;
  try {
    sanitizedRuleOptions = RequirementsTxtDependenciesAlphabeticalOrderOptionsSchema.parse(ruleOptions);
  } catch (error) {
    throw new Error(
      `Invalid rule options: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
  const { path: path2 } = sanitizedRuleOptions;
  let content;
  try {
    content = await context.getFileContent(path2);
  } catch (error) {
    errors.push(
      `${path2}: ${error instanceof Error ? error.message : "failed to read file"}`
    );
    return { errors };
  }
  const dependencies = parseRequirementsFile(content);
  if (dependencies.length === 0) {
    return { errors };
  }
  errors.push(...checkAlphabeticalOrder2(dependencies, path2));
  return { errors };
};

// src/rules/yaml-has-keys.ts
var import_yaml2 = require("yaml");
var import_zod13 = require("zod");
var YamlHasKeysOptionsSchema = import_zod13.z.object({
  path: import_zod13.z.union([import_zod13.z.string(), import_zod13.z.array(import_zod13.z.string()).min(1)]),
  keys: import_zod13.z.array(import_zod13.z.string()).min(1)
});
var YamlHasKeysSchema = createRuleSchema("yaml-has-keys", YamlHasKeysOptionsSchema);
var yamlHasKeys = async (context, ruleOptions) => {
  let sanitizedRuleOptions;
  try {
    sanitizedRuleOptions = YamlHasKeysOptionsSchema.parse(ruleOptions);
  } catch (error) {
    throw new Error(
      `Invalid rule options: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
  return checkHasKeys(context, sanitizedRuleOptions, import_yaml2.parse, "YAML");
};

// src/rulesMapper.ts
var rulesMapper = {
  "file-contains": fileContains,
  "file-exists": fileExists,
  "file-forbidden": fileForbidden,
  "file-not-contains": fileNotContains,
  "github-actions/timeout-minutes": githubActionsTimeoutMinutes,
  "json-has-keys": jsonHasKeys,
  "license/exists": licenseExists,
  "python/pyproject-dependencies-alphabetical-order": pyprojectDependenciesAlphabeticalOrder,
  "python/requirements-txt-dependencies-alphabetical-order": requirementsTxtDependenciesAlphabeticalOrder,
  "readme/exists": readmeExists,
  "yaml-has-keys": yamlHasKeys
};

// src/utils/context.ts
var RuleContext = class {
  constructor(octokit, repository) {
    this.octokit = octokit;
    this.repository = repository;
  }
  contentCache = /* @__PURE__ */ new Map();
  fileContentCache = /* @__PURE__ */ new Map();
  allFilesCache = null;
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
  async getAllFiles() {
    if (this.allFilesCache !== null) {
      return this.allFilesCache;
    }
    const files = [];
    const dirsToProcess = [""];
    while (dirsToProcess.length > 0) {
      const dir = dirsToProcess.pop();
      const contents = await this.getContent(dir);
      if (Array.isArray(contents)) {
        for (const item of contents) {
          const itemPath = dir ? `${dir}/${item.name}` : item.name;
          if (item.type === "file") {
            files.push({ path: itemPath, name: item.name, type: "file" });
          } else if (item.type === "dir") {
            files.push({ path: itemPath, name: item.name, type: "dir" });
            dirsToProcess.push(itemPath);
          }
        }
      }
    }
    this.allFilesCache = files;
    return files;
  }
  async getFileContent(path2) {
    const cacheKey = `${this.repository.full_name}:file:${path2}`;
    if (this.fileContentCache.has(cacheKey)) {
      return this.fileContentCache.get(cacheKey);
    }
    const content = await this.getContent(path2);
    if (Array.isArray(content)) {
      throw new Error(`Path ${path2} is a directory, not a file`);
    }
    if (content.type !== "file" || !("content" in content)) {
      throw new Error(`Path ${path2} is not a file`);
    }
    const decodedContent = Buffer.from(content.content, "base64").toString("utf-8");
    this.fileContentCache.set(cacheKey, decodedContent);
    return decodedContent;
  }
  clearCache() {
    this.contentCache.clear();
    this.fileContentCache.clear();
    this.allFilesCache = null;
  }
};

// src/utils/config.ts
var import_jiti = require("jiti");
var fs = __toESM(require("fs"));
var path = __toESM(require("path"));
var import_node_url = require("url");
var import_zod15 = require("zod");

// src/rules/index.ts
var import_zod14 = __toESM(require("zod"));
var ruleConfigSchema = import_zod14.default.union([
  FileContainsSchema,
  FileNotContainsSchema,
  FileExistsSchema,
  FileForbiddenSchema,
  GithubActionsTimeoutMinutesSchema,
  JsonHasKeysSchema,
  LicenseExistsSchema,
  PyprojectDependenciesAlphabeticalOrderSchema,
  ReadmeExistsSchema,
  RequirementsTxtDependenciesAlphabeticalOrderSchema,
  YamlHasKeysSchema
]);
var rulesConfigSchema = import_zod14.default.array(ruleConfigSchema);

// src/utils/config.ts
var regexPatternSchema2 = import_zod15.z.string().refine(
  (pattern) => {
    try {
      new RegExp(pattern);
      return true;
    } catch {
      return false;
    }
  },
  {
    message: "Invalid regex pattern"
  }
);
var filtersSchema = import_zod15.z.object({
  archived: import_zod15.z.boolean().optional(),
  organizations: import_zod15.z.array(import_zod15.z.string()).optional(),
  visibility: import_zod15.z.enum(["public", "private", "all"]).optional(),
  include: import_zod15.z.array(regexPatternSchema2).optional(),
  exclude: import_zod15.z.array(regexPatternSchema2).optional()
});
var configSchema = import_zod15.z.object({
  rules: rulesConfigSchema.optional().default([]),
  filters: filtersSchema.optional()
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
function matchesExceptions(repo, exceptions) {
  if (!exceptions || exceptions.length === 0) {
    return false;
  }
  for (const pattern of exceptions) {
    const regex = new RegExp(pattern);
    if (regex.test(repo.name) || regex.test(repo.full_name)) {
      return true;
    }
  }
  return false;
}
async function runRulesForRepo(octokit, repo, config) {
  const results = [];
  const context = new RuleContext(octokit, repo);
  for (const ruleConfig of config.rules ?? []) {
    const { name: rule, level: alertLevel, options: ruleOptions, exceptions } = ruleConfig;
    if (matchesExceptions(repo, exceptions)) {
      continue;
    }
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
function matchesFilters(repo, filters) {
  if (!filters) {
    return true;
  }
  if (filters.visibility) {
    if (filters.visibility === "public" && repo.private) {
      return false;
    }
    if (filters.visibility === "private" && !repo.private) {
      return false;
    }
  }
  if (filters.archived !== void 0) {
    if (filters.archived && !repo.archived) {
      return false;
    }
    if (!filters.archived && repo.archived) {
      return false;
    }
  }
  if (filters.organizations && filters.organizations.length > 0) {
    if (!filters.organizations.includes(repo.owner.login)) {
      return false;
    }
  }
  if (filters.include && filters.include.length > 0) {
    let matched = false;
    for (const pattern of filters.include) {
      const regex = new RegExp(pattern);
      if (regex.test(repo.name) || regex.test(repo.full_name)) {
        matched = true;
        break;
      }
    }
    if (!matched) {
      return false;
    }
  }
  if (filters.exclude && filters.exclude.length > 0) {
    for (const pattern of filters.exclude) {
      const regex = new RegExp(pattern);
      if (regex.test(repo.name) || regex.test(repo.full_name)) {
        return false;
      }
    }
  }
  return true;
}
async function run(octokit, config) {
  const visibility = config.filters?.visibility ?? "all";
  const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
    visibility,
    per_page: 100
  });
  const results = [];
  for (const repo of repos) {
    if (matchesFilters(repo, config.filters)) {
      const repoResult = await runRulesForRepo(octokit, repo, config);
      results.push(repoResult);
    }
  }
  return results;
}

// src/cli.ts
var packageJson = JSON.parse(
  (0, import_node_fs.readFileSync)((0, import_node_path3.join)(__dirname, "../package.json"), "utf-8")
);
var program = new import_commander.Command();
program.name("repofmt").description("A CLI tool that checks consistency across repositories").version(packageJson.version);
program.command("run").description("Run repofmt checks against your repositories").option("--config <path>", "path to config file").option("--token <token>", "GitHub token (can also use GITHUB_TOKEN env var)").action(async (options) => {
  console.log("Running repofmt...");
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
    let totalErrors = 0;
    let totalWarnings = 0;
    for (const repoResult of results) {
      console.log(`
${repoResult.repository}`);
      for (const { rule, errors, warnings } of repoResult.results) {
        for (const error of errors ?? []) {
          console.log(`  \u274C ${rule}: ${error}`);
          totalErrors++;
        }
        for (const warning of warnings ?? []) {
          console.log(`  \u26A0\uFE0F ${rule}: ${warning}`);
          totalWarnings++;
        }
      }
    }
    console.log(`${totalErrors} error${totalErrors > 1 ? "s" : ""}, ${totalWarnings} warning${totalWarnings > 1 ? "s" : ""}`);
    process.exit(totalErrors > 0 ? 1 : 0);
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