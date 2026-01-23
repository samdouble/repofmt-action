import { getOctokit } from '@actions/github';
import { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods';
import { z } from 'zod';

declare const configSchema: z.ZodObject<{
    rules: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodObject<{
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
        name: z.ZodLiteral<"readme/exists">;
        level: z.ZodEnum<{
            error: "error";
            warning: "warning";
        }>;
        options: z.ZodObject<{
            caseSensitive: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            path: z.ZodDefault<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>>>;
        }, z.core.$strip>;
    }, z.core.$strip>]>>>>;
}, z.core.$strip>;
type Config = z.infer<typeof configSchema>;
declare const getConfig: (configPathArg?: string) => Promise<Config>;

type Octokit$1 = ReturnType<typeof getOctokit>;
type Repository$1 = RestEndpointMethodTypes['repos']['listForAuthenticatedUser']['response']['data'][number];
type RepoContent = RestEndpointMethodTypes['repos']['getContent']['response']['data'];
declare class RuleContext {
    readonly octokit: Octokit$1;
    readonly repository: Repository$1;
    private contentCache;
    constructor(octokit: Octokit$1, repository: Repository$1);
    getContent(path?: string): Promise<RepoContent>;
    clearCache(): void;
}

declare const ReadmeExistsOptionsSchema: z.ZodObject<{
    caseSensitive: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    path: z.ZodDefault<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>>>;
}, z.core.$strip>;
type ReadmeExistsOptions = z.input<typeof ReadmeExistsOptionsSchema>;
declare const readmeExists: (context: RuleContext, ruleOptions: ReadmeExistsOptions) => Promise<{
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

declare const rulesMapper: {
    'file-exists': (context: RuleContext, ruleOptions: FileExistsOptions) => Promise<{
        errors: string[];
    }>;
    'file-forbidden': (context: RuleContext, ruleOptions: FileForbiddenOptions) => Promise<{
        errors: string[];
    }>;
    'license/exists': (context: RuleContext, ruleOptions: LicenseExistsOptions) => Promise<{
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

export { type Config, type Octokit, type Repository, RuleContext, type RunResult, configSchema, fileExists, fileForbidden, getConfig, licenseExists, readmeExists, rulesMapper, run, runRulesForRepo };
