import type { RuleContext } from './context';
import { findMatchingFiles, isGlobPattern } from './files';

export const getNestedValue = (obj: unknown, keyPath: string): unknown => {
  const parts = keyPath.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current && typeof current === 'object' && !Array.isArray(current) && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return current;
};

const hasKey = (obj: unknown, keyPath: string): boolean => {
  const value = getNestedValue(obj, keyPath);
  return value !== undefined;
};

export interface HasKeysOptions {
  path: string | string[];
  keys: string[];
}

export interface ParseFunction {
  (content: string): unknown;
}

export const checkHasKeys = async (
  context: RuleContext,
  options: HasKeysOptions,
  parse: ParseFunction,
  formatName: string,
): Promise<{ errors: string[] }> => {
  const errors: string[] = [];
  const { path, keys } = options;
  const paths = Array.isArray(path) ? path : [path];

  for (const pathPattern of paths) {
    const isPattern = isGlobPattern(pathPattern);
    let filesToCheck: string[];

    if (isPattern) {
      filesToCheck = await findMatchingFiles(context, pathPattern, false);
      if (filesToCheck.length === 0) {
        errors.push(`${pathPattern}: no files match pattern`);
        continue;
      }
    } else {
      filesToCheck = [pathPattern];
    }

    for (const filePath of filesToCheck) {
      let fileContent: string;
      try {
        fileContent = await context.getFileContent(filePath);
      } catch (error) {
        errors.push(
          `${filePath}: ${error instanceof Error ? error.message : 'failed to read file'}`,
        );
        continue;
      }

      let parsedContent: unknown;
      try {
        parsedContent = parse(fileContent);
      } catch (error) {
        errors.push(
          `${filePath}: failed to parse ${formatName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
        continue;
      }

      for (const key of keys) {
        if (!hasKey(parsedContent, key)) {
          errors.push(`${filePath}: missing key "${key}"`);
        }
      }
    }
  }

  return { errors };
};
