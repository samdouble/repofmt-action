import { z } from 'zod';
import type { RuleContext } from '../utils/context';
import { createRuleSchema } from '../utils/rule-schema';

export const ReadmeHasBadgesOptionsSchema = z.object({
  path: z.string().default('README.md'),
  minCount: z.number().int().min(0).optional(),
  patterns: z.array(z.string()).optional(),
});

export const ReadmeHasBadgesSchema = createRuleSchema('readme/has-badges', ReadmeHasBadgesOptionsSchema);

export type ReadmeHasBadgesOptions = z.input<typeof ReadmeHasBadgesOptionsSchema>;

const BADGE_PATTERN = /\[!\[([^\]]*)\]\(([^)]+)\)\]\(([^)]+)\)/g;

const findBadges = (content: string): Array<{ alt: string; imageUrl: string; linkUrl: string }> => {
  const badges: Array<{ alt: string; imageUrl: string; linkUrl: string }> = [];
  let match;

  while ((match = BADGE_PATTERN.exec(content)) !== null) {
    badges.push({
      alt: match[1],
      imageUrl: match[2],
      linkUrl: match[3],
    });
  }

  return badges;
};

const matchesPattern = (badge: { alt: string; imageUrl: string; linkUrl: string }, pattern: string): boolean => {
  const regex = new RegExp(pattern, 'i');
  return regex.test(badge.alt) || regex.test(badge.imageUrl) || regex.test(badge.linkUrl);
};

export const readmeHasBadges = async (
  context: RuleContext,
  ruleOptions: ReadmeHasBadgesOptions = {},
) => {
  const errors: string[] = [];

  let sanitizedRuleOptions: z.output<typeof ReadmeHasBadgesOptionsSchema>;
  try {
    sanitizedRuleOptions = ReadmeHasBadgesOptionsSchema.parse(ruleOptions);
  } catch (error) {
    throw new Error(
      `Invalid rule options: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }

  const { path, minCount, patterns } = sanitizedRuleOptions;

  let content: string;
  try {
    content = await context.getFileContent(path);
  } catch (error) {
    errors.push(
      `${path}: ${error instanceof Error ? error.message : 'failed to read file'}`,
    );
    return { errors };
  }

  const badges = findBadges(content);

  if (minCount !== undefined && badges.length < minCount) {
    errors.push(
      `${path}: found ${badges.length} badge(s), but expected at least ${minCount}`,
    );
  }

  if (patterns && patterns.length > 0) {
    for (const pattern of patterns) {
      const hasMatchingBadge = badges.some((badge) => matchesPattern(badge, pattern));
      if (!hasMatchingBadge) {
        errors.push(`${path}: no badge found matching pattern "${pattern}"`);
      }
    }
  }

  if (minCount === undefined && (!patterns || patterns.length === 0)) {
    if (badges.length === 0) {
      errors.push(`${path}: no badges found`);
    }
  }

  return { errors };
};
