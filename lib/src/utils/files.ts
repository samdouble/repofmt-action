import { minimatch } from "minimatch";
import { RuleContext } from "./context";

export const isGlobPattern = (path: string): boolean => {
  return /[*?[\]{}]/.test(path);
};

export const findMatchingFiles = async (
  context: RuleContext,
  pattern: string,
  caseSensitive: boolean,
): Promise<string[]> => {
  const allFiles = await context.getAllFiles();

  return allFiles
    .filter(entry => entry.type === 'file')
    .filter(entry =>
      minimatch(entry.path, pattern, {
        nocase: !caseSensitive,
        dot: true,
      }),
    )
    .map(entry => entry.path);
};
