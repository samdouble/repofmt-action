
const extractPackageNameFromUrl = (url: string): string => {
  const eggMatch = url.match(/#egg=([a-zA-Z0-9_-]+)/);
  if (eggMatch) {
    return eggMatch[1].toLowerCase();
  }

  const urlMatch = url.match(/(?:github\.com|gitlab\.com|bitbucket\.org)[/:]([^/]+)\/([^/]+?)(?:\.git|@|#|$)/);
  if (urlMatch) {
    return urlMatch[2].toLowerCase();
  }

  return url.toLowerCase();
};

export const getDependencyName = (line: string): string => {
  const trimmed = line.trim();

  // Editable installs (-e . or -e ./local-package)
  if (trimmed.startsWith('-e ')) {
    const rest = trimmed.slice(3).trim();
    if (rest.startsWith('.') || rest.startsWith('/')) {
      const parts = rest.split(/[/\\]/);
      const lastPart = parts[parts.length - 1];
      return lastPart.toLowerCase();
    }
    return extractPackageNameFromUrl(rest);
  }

  // git URLs: git+https://..., git+ssh://..., etc.
  if (trimmed.includes('git+') || trimmed.includes('@git+')) {
    return extractPackageNameFromUrl(trimmed);
  }

  // File paths: ./local-package or /path/to/package
  if (trimmed.startsWith('.') || trimmed.startsWith('/')) {
    const parts = trimmed.split(/[/\\]/);
    const lastPart = parts[parts.length - 1];
    return lastPart.toLowerCase();
  }

  // Standard format: package, package==1.0.0, package>=1.0.0, package[extra]>=1.0.0
  const match = trimmed.match(/^([a-zA-Z0-9_-]+(?:\[[^\]]+\])?)/);
  return match ? match[1].toLowerCase() : trimmed.toLowerCase();
};

export const parseRequirementsFile = (content: string): string[] => {
  const lines = content.split('\n');
  const dependencies: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === '' || trimmed.startsWith('#')) {
      continue;
    }

    const commentIndex = trimmed.indexOf('#');
    const lineContent = commentIndex >= 0 ? trimmed.slice(0, commentIndex).trim() : trimmed;

    if (lineContent === '') {
      continue;
    }

    dependencies.push(lineContent);
  }
  return dependencies;
};
