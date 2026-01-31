import { getOctokit } from '@actions/github';
import { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods';
import { z } from 'zod';

declare const configSchema: z.ZodObject<{
    rules: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodObject<{
        name: z.ZodLiteral<"file-contains">;
        level: z.ZodEnum<{
            error: "error";
            warning: "warning";
        }>;
        exceptions: z.ZodOptional<z.ZodArray<z.ZodString>>;
        options: z.ZodObject<{
            path: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>;
            contains: z.ZodString;
            caseSensitive: z.ZodDefault<z.ZodBoolean>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        name: z.ZodLiteral<"file-not-contains">;
        level: z.ZodEnum<{
            error: "error";
            warning: "warning";
        }>;
        exceptions: z.ZodOptional<z.ZodArray<z.ZodString>>;
        options: z.ZodObject<{
            path: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>;
            contains: z.ZodString;
            caseSensitive: z.ZodDefault<z.ZodBoolean>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        name: z.ZodLiteral<"file-exists">;
        level: z.ZodEnum<{
            error: "error";
            warning: "warning";
        }>;
        exceptions: z.ZodOptional<z.ZodArray<z.ZodString>>;
        options: z.ZodObject<{
            caseSensitive: z.ZodDefault<z.ZodBoolean>;
            path: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>;
            type: z.ZodDefault<z.ZodEnum<{
                any: "any";
                file: "file";
                directory: "directory";
            }>>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        name: z.ZodLiteral<"file-forbidden">;
        level: z.ZodEnum<{
            error: "error";
            warning: "warning";
        }>;
        exceptions: z.ZodOptional<z.ZodArray<z.ZodString>>;
        options: z.ZodObject<{
            caseSensitive: z.ZodDefault<z.ZodBoolean>;
            path: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>;
            type: z.ZodDefault<z.ZodEnum<{
                any: "any";
                file: "file";
                directory: "directory";
            }>>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        name: z.ZodLiteral<"github-actions/timeout-minutes">;
        level: z.ZodEnum<{
            error: "error";
            warning: "warning";
        }>;
        exceptions: z.ZodOptional<z.ZodArray<z.ZodString>>;
        options: z.ZodOptional<z.ZodObject<{
            maximum: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
    }, z.core.$strip>, z.ZodObject<{
        name: z.ZodLiteral<"json-has-keys">;
        level: z.ZodEnum<{
            error: "error";
            warning: "warning";
        }>;
        exceptions: z.ZodOptional<z.ZodArray<z.ZodString>>;
        options: z.ZodObject<{
            path: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>;
            keys: z.ZodArray<z.ZodString>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        name: z.ZodLiteral<"license/exists">;
        level: z.ZodEnum<{
            error: "error";
            warning: "warning";
        }>;
        exceptions: z.ZodOptional<z.ZodArray<z.ZodString>>;
        options: z.ZodObject<{
            caseSensitive: z.ZodDefault<z.ZodBoolean>;
            path: z.ZodDefault<z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        name: z.ZodLiteral<"python/pyproject-dependencies-alphabetical-order">;
        level: z.ZodEnum<{
            error: "error";
            warning: "warning";
        }>;
        exceptions: z.ZodOptional<z.ZodArray<z.ZodString>>;
        options: z.ZodOptional<z.ZodObject<{
            path: z.ZodDefault<z.ZodString>;
            sections: z.ZodDefault<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>>;
    }, z.core.$strip>, z.ZodObject<{
        name: z.ZodLiteral<"readme/exists">;
        level: z.ZodEnum<{
            error: "error";
            warning: "warning";
        }>;
        exceptions: z.ZodOptional<z.ZodArray<z.ZodString>>;
        options: z.ZodObject<{
            caseSensitive: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            path: z.ZodDefault<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>>>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        name: z.ZodLiteral<"readme/has-badges">;
        level: z.ZodEnum<{
            error: "error";
            warning: "warning";
        }>;
        exceptions: z.ZodOptional<z.ZodArray<z.ZodString>>;
        options: z.ZodObject<{
            path: z.ZodDefault<z.ZodString>;
            minCount: z.ZodOptional<z.ZodNumber>;
            patterns: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        name: z.ZodLiteral<"readme/has-section">;
        level: z.ZodEnum<{
            error: "error";
            warning: "warning";
        }>;
        exceptions: z.ZodOptional<z.ZodArray<z.ZodString>>;
        options: z.ZodObject<{
            section: z.ZodString;
            path: z.ZodDefault<z.ZodOptional<z.ZodString>>;
            caseSensitive: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        name: z.ZodLiteral<"python/requirements-txt-dependencies-alphabetical-order">;
        level: z.ZodEnum<{
            error: "error";
            warning: "warning";
        }>;
        exceptions: z.ZodOptional<z.ZodArray<z.ZodString>>;
        options: z.ZodOptional<z.ZodObject<{
            path: z.ZodDefault<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>, z.ZodObject<{
        name: z.ZodLiteral<"yaml-has-keys">;
        level: z.ZodEnum<{
            error: "error";
            warning: "warning";
        }>;
        exceptions: z.ZodOptional<z.ZodArray<z.ZodString>>;
        options: z.ZodObject<{
            path: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>;
            keys: z.ZodArray<z.ZodString>;
        }, z.core.$strip>;
    }, z.core.$strip>]>>>>;
    filters: z.ZodOptional<z.ZodObject<{
        archived: z.ZodOptional<z.ZodBoolean>;
        organizations: z.ZodOptional<z.ZodArray<z.ZodString>>;
        visibility: z.ZodOptional<z.ZodEnum<{
            public: "public";
            private: "private";
            all: "all";
        }>>;
        include: z.ZodOptional<z.ZodArray<z.ZodString>>;
        exclude: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
type Config = z.infer<typeof configSchema>;
declare const getConfig: (configPathArg?: string) => Promise<Config>;

type Octokit$1 = ReturnType<typeof getOctokit>;
type Repository$1 = RestEndpointMethodTypes['repos']['listForAuthenticatedUser']['response']['data'][number];
type RepoContent = RestEndpointMethodTypes['repos']['getContent']['response']['data'];
interface FileEntry {
    path: string;
    name: string;
    type: 'file' | 'dir';
}
declare class RuleContext {
    readonly octokit: Octokit$1;
    readonly repository: Repository$1;
    private contentCache;
    private fileContentCache;
    private allFilesCache;
    constructor(octokit: Octokit$1, repository: Repository$1);
    getContent(path?: string): Promise<RepoContent>;
    getAllFiles(): Promise<FileEntry[]>;
    getFileContent(path: string): Promise<string>;
    clearCache(): void;
}

declare const FileContainsOptionsSchema: z.ZodObject<{
    path: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>;
    contains: z.ZodString;
    caseSensitive: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
type FileContainsOptions = z.input<typeof FileContainsOptionsSchema>;
declare const fileContains: (context: RuleContext, ruleOptions: FileContainsOptions) => Promise<{
    errors: string[];
}>;

declare const FileExistsOptionsSchema: z.ZodObject<{
    caseSensitive: z.ZodDefault<z.ZodBoolean>;
    path: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>;
    type: z.ZodDefault<z.ZodEnum<{
        any: "any";
        file: "file";
        directory: "directory";
    }>>;
}, z.core.$strip>;
type FileExistsOptions = z.input<typeof FileExistsOptionsSchema>;
declare const fileExists: (context: RuleContext, ruleOptions: FileExistsOptions) => Promise<{
    errors: string[];
}>;

declare const FileForbiddenOptionsSchema: z.ZodObject<{
    caseSensitive: z.ZodDefault<z.ZodBoolean>;
    path: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>;
    type: z.ZodDefault<z.ZodEnum<{
        any: "any";
        file: "file";
        directory: "directory";
    }>>;
}, z.core.$strip>;
type FileForbiddenOptions = z.input<typeof FileForbiddenOptionsSchema>;
declare const fileForbidden: (context: RuleContext, ruleOptions: FileForbiddenOptions) => Promise<{
    errors: string[];
}>;

declare const FileNotContainsOptionsSchema: z.ZodObject<{
    path: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>;
    contains: z.ZodString;
    caseSensitive: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
type FileNotContainsOptions = z.input<typeof FileNotContainsOptionsSchema>;
declare const fileNotContains: (context: RuleContext, ruleOptions: FileNotContainsOptions) => Promise<{
    errors: string[];
}>;

declare const GithubActionsTimeoutMinutesOptionsSchema: z.ZodObject<{
    maximum: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
type GithubActionsTimeoutMinutesOptions = z.input<typeof GithubActionsTimeoutMinutesOptionsSchema>;
declare const githubActionsTimeoutMinutes: (context: RuleContext, ruleOptions?: GithubActionsTimeoutMinutesOptions) => Promise<{
    errors: string[];
}>;

declare const JsonHasKeysOptionsSchema: z.ZodObject<{
    path: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>;
    keys: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
type JsonHasKeysOptions = z.input<typeof JsonHasKeysOptionsSchema>;
declare const jsonHasKeys: (context: RuleContext, ruleOptions: JsonHasKeysOptions) => Promise<{
    errors: string[];
}>;

declare const LicenseExistsOptionsSchema: z.ZodObject<{
    caseSensitive: z.ZodDefault<z.ZodBoolean>;
    path: z.ZodDefault<z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>>;
}, z.core.$strip>;
type LicenseExistsOptions = z.input<typeof LicenseExistsOptionsSchema>;
declare const licenseExists: (context: RuleContext, ruleOptions: LicenseExistsOptions) => Promise<{
    errors: string[];
}>;

declare const PyprojectDependenciesAlphabeticalOrderOptionsSchema: z.ZodObject<{
    path: z.ZodDefault<z.ZodString>;
    sections: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
type PyprojectDependenciesAlphabeticalOrderOptions = z.input<typeof PyprojectDependenciesAlphabeticalOrderOptionsSchema>;
declare const pyprojectDependenciesAlphabeticalOrder: (context: RuleContext, ruleOptions?: PyprojectDependenciesAlphabeticalOrderOptions) => Promise<{
    errors: string[];
}>;

declare const ReadmeExistsOptionsSchema: z.ZodObject<{
    caseSensitive: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    path: z.ZodDefault<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>>>;
}, z.core.$strip>;
type ReadmeExistsOptions = z.input<typeof ReadmeExistsOptionsSchema>;
declare const readmeExists: (context: RuleContext, ruleOptions: ReadmeExistsOptions) => Promise<{
    errors: string[];
}>;

declare const RequirementsTxtDependenciesAlphabeticalOrderOptionsSchema: z.ZodObject<{
    path: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
type RequirementsTxtDependenciesAlphabeticalOrderOptions = z.input<typeof RequirementsTxtDependenciesAlphabeticalOrderOptionsSchema>;
declare const requirementsTxtDependenciesAlphabeticalOrder: (context: RuleContext, ruleOptions?: RequirementsTxtDependenciesAlphabeticalOrderOptions) => Promise<{
    errors: string[];
}>;

declare const YamlHasKeysOptionsSchema: z.ZodObject<{
    path: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>;
    keys: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
type YamlHasKeysOptions = z.input<typeof YamlHasKeysOptionsSchema>;
declare const yamlHasKeys: (context: RuleContext, ruleOptions: YamlHasKeysOptions) => Promise<{
    errors: string[];
}>;

declare const ReadmeHasSectionOptionsSchema: z.ZodObject<{
    section: z.ZodString;
    path: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    caseSensitive: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>;
type ReadmeHasSectionOptions = z.input<typeof ReadmeHasSectionOptionsSchema>;

declare const ReadmeHasBadgesOptionsSchema: z.ZodObject<{
    path: z.ZodDefault<z.ZodString>;
    minCount: z.ZodOptional<z.ZodNumber>;
    patterns: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
type ReadmeHasBadgesOptions = z.input<typeof ReadmeHasBadgesOptionsSchema>;

declare const rulesMapper: {
    'file-contains': (context: RuleContext, ruleOptions: FileContainsOptions) => Promise<{
        errors: string[];
    }>;
    'file-exists': (context: RuleContext, ruleOptions: FileExistsOptions) => Promise<{
        errors: string[];
    }>;
    'file-forbidden': (context: RuleContext, ruleOptions: FileForbiddenOptions) => Promise<{
        errors: string[];
    }>;
    'file-not-contains': (context: RuleContext, ruleOptions: FileNotContainsOptions) => Promise<{
        errors: string[];
    }>;
    'github-actions/timeout-minutes': (context: RuleContext, ruleOptions?: GithubActionsTimeoutMinutesOptions) => Promise<{
        errors: string[];
    }>;
    'json-has-keys': (context: RuleContext, ruleOptions: JsonHasKeysOptions) => Promise<{
        errors: string[];
    }>;
    'license/exists': (context: RuleContext, ruleOptions: LicenseExistsOptions) => Promise<{
        errors: string[];
    }>;
    'python/pyproject-dependencies-alphabetical-order': (context: RuleContext, ruleOptions?: PyprojectDependenciesAlphabeticalOrderOptions) => Promise<{
        errors: string[];
    }>;
    'python/requirements-txt-dependencies-alphabetical-order': (context: RuleContext, ruleOptions?: RequirementsTxtDependenciesAlphabeticalOrderOptions) => Promise<{
        errors: string[];
    }>;
    'readme/exists': (context: RuleContext, ruleOptions: ReadmeExistsOptions) => Promise<{
        errors: string[];
    }>;
    'readme/has-badges': (context: RuleContext, ruleOptions?: ReadmeHasBadgesOptions) => Promise<{
        errors: string[];
    }>;
    'readme/has-section': (context: RuleContext, ruleOptions: ReadmeHasSectionOptions) => Promise<{
        errors: string[];
    }>;
    'yaml-has-keys': (context: RuleContext, ruleOptions: YamlHasKeysOptions) => Promise<{
        errors: string[];
    }>;
};

declare function createRuleSchema<TName extends string, TOptions extends z.ZodTypeAny>(name: TName, optionsSchema: TOptions): z.ZodObject<{
    name: z.ZodLiteral<TName>;
    level: z.ZodEnum<{
        error: "error";
        warning: "warning";
    }>;
    exceptions: z.ZodOptional<z.ZodArray<z.ZodString>>;
    options: TOptions;
}, z.core.$strip>;

type Octokit = ReturnType<typeof getOctokit>;
type Repository = RestEndpointMethodTypes['repos']['listForAuthenticatedUser']['response']['data'][number];
interface RunResult {
    repository: string;
    results: {
        rule: string;
        errors?: string[];
        warnings?: string[];
    }[];
}
declare function runRulesForRepo(octokit: Octokit, repo: Repository, config: Config): Promise<RunResult>;
declare function run(octokit: Octokit, config: Config): Promise<RunResult[]>;

export { type Config, type Octokit, type Repository, RuleContext, type RunResult, configSchema, createRuleSchema, fileContains, fileExists, fileForbidden, fileNotContains, getConfig, githubActionsTimeoutMinutes, jsonHasKeys, licenseExists, pyprojectDependenciesAlphabeticalOrder, readmeExists, requirementsTxtDependenciesAlphabeticalOrder, rulesMapper, run, runRulesForRepo, yamlHasKeys };
