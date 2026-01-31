import { parse as parseYaml } from 'yaml';
import { z } from 'zod';
import type { RuleContext } from '../utils/context';
import { createRuleSchema } from '../utils/rule-schema';

export const GithubActionsTimeoutMinutesOptionsSchema = z.object({
  maximum: z.number().positive().optional(),
});

export const GithubActionsTimeoutMinutesSchema = createRuleSchema(
  'github-actions/timeout-minutes',
  GithubActionsTimeoutMinutesOptionsSchema.optional(),
);

export type GithubActionsTimeoutMinutesOptions = z.input<typeof GithubActionsTimeoutMinutesOptionsSchema>;

interface WorkflowJob {
  'timeout-minutes'?: number;
  [key: string]: unknown;
}

interface Workflow {
  jobs?: Record<string, WorkflowJob>;
  [key: string]: unknown;
}

export const githubActionsTimeoutMinutes = async (
  context: RuleContext,
  ruleOptions: GithubActionsTimeoutMinutesOptions = {},
) => {
  const errors: string[] = [];
  const workflowsPath = '.github/workflows';

  let workflowFiles;
  try {
    const contents = await context.getContent(workflowsPath);
    if (!Array.isArray(contents)) {
      return { errors };
    }
    workflowFiles = contents.filter(
      (item) =>
        item.type === 'file' &&
        (item.name.endsWith('.yml') || item.name.endsWith('.yaml')),
    );
  } catch {
    return { errors };
  }

  for (const file of workflowFiles) {
    const filePath = `${workflowsPath}/${file.name}`;
    let content: string;

    try {
      content = await context.getFileContent(filePath);
    } catch (error) {
      errors.push(
        `${filePath}: failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      continue;
    }

    let workflow: Workflow;
    try {
      workflow = parseYaml(content) as Workflow;
    } catch (error) {
      errors.push(
        `${filePath}: failed to parse YAML: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      continue;
    }

    if (workflow?.jobs) {
      for (const jobName of Object.keys(workflow.jobs)) {
        const job = workflow.jobs[jobName];
        const timeoutMinutes = job?.['timeout-minutes'];
        if (timeoutMinutes === undefined) {
          errors.push(`${filePath}: job "${jobName}" is missing timeout-minutes`);
        } else if (
          ruleOptions.maximum !== undefined &&
          timeoutMinutes > ruleOptions.maximum
        ) {
          errors.push(
            `${filePath}: job "${jobName}" has timeout-minutes (${timeoutMinutes}) that is higher than ${ruleOptions.maximum}`,
          );
        }
      }
    }
  }

  return { errors };
};
