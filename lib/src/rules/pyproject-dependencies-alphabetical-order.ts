import { parse as parseToml } from 'smol-toml';
import { z } from 'zod';
import { regexPatternSchema } from '../utils/config';
import type { RuleContext } from '../utils/context';
import { AlertLevelSchema } from '../utils/types';

export const PyprojectDependenciesAlphabeticalOrderOptionsSchema = z.object({
  path: z.string().default('pyproject.toml'),
  sections: z
    .array(z.string())
    .default(['project.dependencies', 'project.optional-dependencies', 'tool.poetry.dependencies']),
});

export const PyprojectDependenciesAlphabeticalOrderSchema = z.object({
  name: z.literal('python/pyproject-dependencies-alphabetical-order'),
  level: AlertLevelSchema,
  exceptions: z.array(regexPatternSchema).optional(),
  options: PyprojectDependenciesAlphabeticalOrderOptionsSchema.optional(),
});

export type PyprojectDependenciesAlphabeticalOrderOptions = z.input<
  typeof PyprojectDependenciesAlphabeticalOrderOptionsSchema
>;

interface PyprojectToml {
  project?: {
    dependencies?: string[];
    'optional-dependencies'?: Record<string, string[]>;
    [key: string]: unknown;
  };
  tool?: {
    poetry?: {
      dependencies?: Record<string, unknown>;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

const getDependencyName = (dep: string): string => {
  const match = dep.match(/^([a-zA-Z0-9_-]+(?:\[[^\]]+\])?)/);
  return match ? match[1].toLowerCase() : dep.toLowerCase();
};

const checkAlphabeticalOrder = (dependencies: string[], sectionPath: string): string[] => {
  const errors: string[] = [];
  const sorted = [...dependencies].sort((a, b) => {
    const nameA = getDependencyName(a);
    const nameB = getDependencyName(b);
    return nameA.localeCompare(nameB);
  });

  for (let i = 0; i < dependencies.length; i++) {
    if (dependencies[i] !== sorted[i]) {
      errors.push(
        `${sectionPath}: dependencies are not in alphabetical order. Expected "${sorted[i]}" but found "${dependencies[i]}"`,
      );
      break;
    }
  }

  return errors;
};

const getNestedValue = (obj: unknown, path: string): unknown => {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return current;
};

export const pyprojectDependenciesAlphabeticalOrder = async (
  context: RuleContext,
  ruleOptions: PyprojectDependenciesAlphabeticalOrderOptions = {},
) => {
  const errors: string[] = [];

  let sanitizedRuleOptions: z.output<typeof PyprojectDependenciesAlphabeticalOrderOptionsSchema>;
  try {
    sanitizedRuleOptions = PyprojectDependenciesAlphabeticalOrderOptionsSchema.parse(ruleOptions);
  } catch (error) {
    throw new Error(
      `Invalid rule options: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }

  const { path, sections } = sanitizedRuleOptions;

  let content: string;
  try {
    content = await context.getFileContent(path);
  } catch (error) {
    errors.push(
      `${path}: ${error instanceof Error ? error.message : 'failed to read file'}`,
    );
    return { errors };
  }

  let pyproject: PyprojectToml;
  try {
    pyproject = parseToml(content) as PyprojectToml;
  } catch (error) {
    errors.push(
      `${path}: failed to parse TOML: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
    return { errors };
  }

  for (const sectionPath of sections) {
    const sectionValue = getNestedValue(pyproject, sectionPath);

    if (sectionValue === undefined) {
      continue;
    }

    if (sectionPath === 'project.dependencies') {
      if (Array.isArray(sectionValue)) {
        const deps = sectionValue as string[];
        if (deps.length > 0) {
          errors.push(...checkAlphabeticalOrder(deps, `${path}:${sectionPath}`));
        }
      }
    } else if (sectionPath === 'project.optional-dependencies') {
      if (sectionValue && typeof sectionValue === 'object') {
        const optionalDeps = sectionValue as Record<string, string[]>;
        for (const [groupName, deps] of Object.entries(optionalDeps)) {
          if (Array.isArray(deps) && deps.length > 0) {
            errors.push(
              ...checkAlphabeticalOrder(deps, `${path}:${sectionPath}.${groupName}`),
            );
          }
        }
      }
    } else if (sectionPath === 'tool.poetry.dependencies') {
      if (sectionValue && typeof sectionValue === 'object') {
        const poetryDeps = sectionValue as Record<string, unknown>;
        const depNames = Object.keys(poetryDeps).filter(
          (key) => key !== 'python',
        );
        if (depNames.length > 0) {
          const sorted = [...depNames].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
          for (let i = 0; i < depNames.length; i++) {
            if (depNames[i] !== sorted[i]) {
              errors.push(
                `${path}:${sectionPath}: dependencies are not in alphabetical order. Expected "${sorted[i]}" but found "${depNames[i]}"`,
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
