import { parse as parseYaml } from 'yaml';
import { z } from 'zod';
import { AlertLevelSchema } from '../utils/types';
import type { RuleContext } from '../utils/context';

export const GithubActionsTimeoutMinutesOptionsSchema = z.object({});

export const GithubActionsTimeoutMinutesSchema = z.object({
  name: z.literal('github-actions/timeout-minutes'),
  level: AlertLevelSchema,
  options: GithubActionsTimeoutMinutesOptionsSchema.optional(),
});

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
  _ruleOptions: GithubActionsTimeoutMinutesOptions = {},
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
        if (job?.['timeout-minutes'] === undefined) {
          errors.push(`${filePath}: job "${jobName}" is missing timeout-minutes`);
        }
      }
    }
  }

  return { errors };
};
