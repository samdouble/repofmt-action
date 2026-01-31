import { z } from 'zod';
import { AlertLevelSchema } from './types';

const regexPatternSchema = z.string().refine(
  (pattern) => {
    try {
      new RegExp(pattern);
      return true;
    } catch {
      return false;
    }
  },
  {
    message: 'Invalid regex pattern',
  },
);

const exceptionsSchema = z.array(regexPatternSchema).optional();

export function createRuleSchema<
  TName extends string,
  TOptions extends z.ZodTypeAny,
>(name: TName, optionsSchema: TOptions) {
  return z.object({
    name: z.literal(name),
    level: AlertLevelSchema,
    exceptions: exceptionsSchema,
    options: optionsSchema,
  });
}
