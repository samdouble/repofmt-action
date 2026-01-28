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
        options: z.ZodOptional<z.ZodObject<{
            maximum: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
    }, z.core.$strip>, z.ZodObject<{
        name: z.ZodLiteral<"license/exists">;
        level: z.ZodEnum<{
            error: "error";
            warning: "warning";
        }>;
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
        options: z.ZodObject<{
            caseSensitive: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            path: z.ZodDefault<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>>>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        name: z.ZodLiteral<"python/requirements-txt-dependencies-alphabetical-order">;
        level: z.ZodEnum<{
            error: "error";
            warning: "warning";
        }>;
        options: z.ZodOptional<z.ZodObject<{
            path: z.ZodDefault<z.ZodString>;
        }, z.core.$strip>>;
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

declare const GithubActionsTimeoutMinutesOptionsSchema: z.ZodObject<{
    maximum: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
type GithubActionsTimeoutMinutesOptions = z.input<typeof GithubActionsTimeoutMinutesOptionsSchema>;
declare const githubActionsTimeoutMinutes: (context: RuleContext, ruleOptions?: GithubActionsTimeoutMinutesOptions) => Promise<{
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
    'github-actions/timeout-minutes': (context: RuleContext, ruleOptions?: GithubActionsTimeoutMinutesOptions) => Promise<{
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
};

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

export { type Config, type Octokit, type Repository, RuleContext, type RunResult, configSchema, fileContains, fileExists, fileForbidden, getConfig, githubActionsTimeoutMinutes, licenseExists, pyprojectDependenciesAlphabeticalOrder, readmeExists, requirementsTxtDependenciesAlphabeticalOrder, rulesMapper, run, runRulesForRepo };
