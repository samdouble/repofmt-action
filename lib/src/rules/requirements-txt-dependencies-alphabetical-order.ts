import { z } from 'zod';
import type { RuleContext } from '../utils/context';
import { getDependencyName, parseRequirementsFile } from '../utils/python/requirements';
import { createRuleSchema } from '../utils/rule-schema';

export const RequirementsTxtDependenciesAlphabeticalOrderOptionsSchema = z.object({
  path: z.string().default('requirements.txt'),
});

export const RequirementsTxtDependenciesAlphabeticalOrderSchema = createRuleSchema(
  'python/requirements-txt-dependencies-alphabetical-order',
  RequirementsTxtDependenciesAlphabeticalOrderOptionsSchema.optional(),
);

export type RequirementsTxtDependenciesAlphabeticalOrderOptions = z.input<
  typeof RequirementsTxtDependenciesAlphabeticalOrderOptionsSchema
>;

const checkAlphabeticalOrder = (dependencies: string[], filePath: string): string[] => {
  const errors: string[] = [];
  const sorted = [...dependencies].sort((a, b) => {
    const nameA = getDependencyName(a);
    const nameB = getDependencyName(b);
    return nameA.localeCompare(nameB);
  });

  for (let i = 0; i < dependencies.length; i++) {
    if (dependencies[i] !== sorted[i]) {
      errors.push(
        `${filePath}: dependencies are not in alphabetical order. Expected "${sorted[i]}" but found "${dependencies[i]}"`,
      );
      break;
    }
  }
  return errors;
};

export const requirementsTxtDependenciesAlphabeticalOrder = async (
  context: RuleContext,
  ruleOptions: RequirementsTxtDependenciesAlphabeticalOrderOptions = {},
) => {
  const errors: string[] = [];

  let sanitizedRuleOptions: z.output<typeof RequirementsTxtDependenciesAlphabeticalOrderOptionsSchema>;
  try {
    sanitizedRuleOptions = RequirementsTxtDependenciesAlphabeticalOrderOptionsSchema.parse(ruleOptions);
  } catch (error) {
    throw new Error(
      `Invalid rule options: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }

  const { path } = sanitizedRuleOptions;

  let content: string;
  try {
    content = await context.getFileContent(path);
  } catch (error) {
    errors.push(
      `${path}: ${error instanceof Error ? error.message : 'failed to read file'}`,
    );
    return { errors };
  }

  const dependencies = parseRequirementsFile(content);
  if (dependencies.length === 0) {
    return { errors };
  }
  errors.push(...checkAlphabeticalOrder(dependencies, path));
  return { errors };
};
