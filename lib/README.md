[![CI](https://github.com/samdouble/repofmt-action/actions/workflows/checks.yml/badge.svg)](https://github.com/samdouble/repofmt-action/actions/workflows/checks.yml)
[![Coverage Status](https://coveralls.io/repos/samdouble/repofmt-action/badge.svg?branch=master&service=github)](https://coveralls.io/github/samdouble/repofmt-action?branch=master)

[![Node.js](https://img.shields.io/badge/Node.js-6DA55F?logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff)](https://www.typescriptlang.org/)
[![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?logo=github-actions&logoColor=white)](https://github.com/features/actions)
[![Jest](https://img.shields.io/badge/Jest-C21325?logo=jest&logoColor=fff)](https://jestjs.io/)

# repofmt

This tool checks consistency across repositories.

## Usage

### GitHub Action

See [repofmt-action](../README.md) for more details on how to use the GitHub action.

### CLI

```bash
npx repofmt run [options]
```

#### Options

| Option | Description | Required | Default |
|--------|-------------|----------|---------|
| `--config <path>` | Path to the config file. | No | `repofmt.config.ts` |
| `--token <token>` | GitHub token (can also use GITHUB_TOKEN env var). | No |  |

## Configuration

### Inputs

#### `github-token`

`github-token` is the GitHub token to use for API access. It is optional and must be a personal access token with the `repo` scope. If not provided, the action will use the default GitHub token.

### repofmt.config.ts

The action can be configured by creating a `repofmt.config.ts` file at the root of your repository. `repofmt.config.js`, `repofmt.config.mjs`, and `repofmt.config.cjs` are also supported.

```ts
export default {
  filters: {
    archived: false,
    organizations: ['my-org', 'other-org'],
    visibility: 'public',
    include: ['^my-org-', '^other-org-'],
    exclude: ['^deprecated-'],
  },
  rules: [
    {
      name: 'file-exists',
      level: 'error',
      options: {
        caseSensitive: true,
        path: 'file.md',
      },
    },
  ],
};
```

### Filters

The `filters` option allows you to control which repositories are checked by the action.

```ts
{
  filters: {
    archived: false,
    organizations: ['my-org', 'other-org'],
    visibility: 'public',
    include: ['^my-org-', '^other-org-'],
    exclude: ['^deprecated-'],
  }
}
```

| Option           | Description                                                     | Required | Default      |
|------------------|-----------------------------------------------------------------|----------|--------------|
| `archived`      | Filter repositories by archived status: `true` (only archived), `false` (only not archived), or `undefined` (all). | No       | `undefined`  |
| `organizations` | Array of organization names to include. A repository must belong to **one of** the specified organizations to be included. | No       |              |
| `visibility`    | Filter repositories by visibility: `'public'`, `'private'`, or `'all'`. | No       | `'all'`      |
| `include`        | Array of regex patterns to match repository names (matches both `name` and `full_name`). A repository is included if it matches **any** pattern in the array. | No       |              |
| `exclude`        | Array of regex patterns to exclude repository names (matches both `name` and `full_name`). A repository is excluded if it matches **any** pattern in the array. | No       |              |

- A repository must pass all specified filters to be included.

### Rules

#### `file-contains`

<details>
<summary>file-contains</summary>

The `file-contains` rule checks if a file contains a specific string.

```json
{
  "name": "file-contains",
  "level": "error",
  "options": {
    "path": "README.md",
    "contains": "MIT License",
    "caseSensitive": false
  }
}
```

| Option          | Description                                                     | Required | Default      |
|-----------------|-----------------------------------------------------------------|----------|--------------|
| `path`          | The path to the file(s) to check, or an array of paths/glob patterns. | Yes      |              |
| `contains`      | The string that the file(s) must contain.                      | Yes      |              |
| `caseSensitive` | Whether the string matching should be case-sensitive.           | No       | `false`      |

The `path` option supports:
- Single file paths (e.g., `README.md`, `.github/workflows/ci.yml`)
- Glob patterns (e.g., `**/*.md`, `src/**/*.ts`)
- Arrays of paths/patterns (e.g., `['README.md', 'LICENSE']`, `['**/*.md', '**/*.txt']`)

When using glob patterns or arrays, **all** matching files must contain the specified string.

Example: Check if a README contains a license notice:

```json
{
  "name": "file-contains",
  "level": "error",
  "options": {
    "path": "README.md",
    "contains": "MIT License"
  }
}
```

Example: Check if all markdown files contain a license notice:

```json
{
  "name": "file-contains",
  "level": "error",
  "options": {
    "path": "**/*.md",
    "contains": "MIT License"
  }
}
```

Example: Check multiple specific files:

```json
{
  "name": "file-contains",
  "level": "error",
  "options": {
    "path": ["README.md", "LICENSE"],
    "contains": "MIT"
  }
}
```
</details>

#### `file-exists`

<details>
<summary>file-exists</summary>

The `file-exists` rule checks if a file exists in the repository.

```json
{
  "name": "file-exists",
  "level": "error",
  "options": {
    "caseSensitive": true,
    "path": "file.md"
  }
}
```

| Option          | Description                                                     | Required | Default      |
|-----------------|-----------------------------------------------------------------|----------|--------------|
| `caseSensitive` | Whether to check if the file exists in a case-sensitive manner. | No       | `false`      |
| `path`          | The path to the file, or an array of alternative paths.         | Yes      |              |
| `type`          | The type of entry to look for: `file`, `directory`, or `any`.   | No       | `file`       |

The `path` option supports nested paths (e.g., `.github/workflows/ci.yml`).

You can also provide an array of alternative paths. The rule passes if **at least one** of the entries exists:

```json
{
  "name": "file-exists",
  "level": "error",
  "options": {
    "path": ["config.yml", "config.yaml"]
  }
}
```

You can use the `type` option to check for directories instead of files:

```json
{
  "name": "file-exists",
  "level": "error",
  "options": {
    "path": "src",
    "type": "directory"
  }
}
```
</details>

#### `file-forbidden`

<details>
<summary>file-forbidden</summary>

The `file-forbidden` rule checks that a file does NOT exist in the repository. This is useful for enforcing that certain files (like `.DS_Store`, `.env`, etc.) are not committed.

```json
{
  "name": "file-forbidden",
  "level": "error",
  "options": {
    "caseSensitive": true,
    "path": ".DS_Store"
  }
}
```

| Option          | Description                                                     | Required | Default      |
|-----------------|-----------------------------------------------------------------|----------|--------------|
| `caseSensitive` | Whether to check if the file exists in a case-sensitive manner. | No       | `false`      |
| `path`          | The path to the file(s) that should not exist.                  | Yes      |              |
| `type`          | The type of entry to look for: `file`, `directory`, or `any`.   | No       | `file`       |

The `path` option supports nested paths (e.g., `src/config/secrets.json`).

You can provide an array of paths to forbid multiple files:

```json
{
  "name": "file-forbidden",
  "level": "error",
  "options": {
    "path": [".env", ".env.local", ".env.production"]
  }
}
```

You can use the `type` option to forbid directories instead of files:

```json
{
  "name": "file-forbidden",
  "level": "error",
  "options": {
    "path": "node_modules",
    "type": "directory"
  }
}
```
</details>

#### `file-not-contains`

<details>
<summary>file-not-contains</summary>

The `file-not-contains` rule checks that a file does NOT contain a specific string. This is useful for enforcing that certain content (like secrets, deprecated code, etc.) is not present in files. **If you use this rule to look for secrets, do NOT enter a specific secret (as you don't want your committed config to contain a secret), but instead use common secret patterns, such as the "sk_" prefix for example.**.

```json
{
  "name": "file-not-contains",
  "level": "error",
  "options": {
    "path": "README.md",
    "contains": "SECRET",
    "caseSensitive": false
  }
}
```

| Option          | Description                                                     | Required | Default      |
|-----------------|-----------------------------------------------------------------|----------|--------------|
| `path`          | The path to the file(s) to check, or an array of paths/glob patterns. | Yes      |              |
| `contains`      | The string that the file(s) must NOT contain.                  | Yes      |              |
| `caseSensitive` | Whether the string matching should be case-sensitive.           | No       | `false`      |

The `path` option supports:
- Single file paths (e.g., `README.md`, `.github/workflows/ci.yml`)
- Glob patterns (e.g., `**/*.md`, `src/**/*.ts`)
- Arrays of paths/patterns (e.g., `['README.md', 'LICENSE']`, `['**/*.md', '**/*.txt']`)

When using glob patterns or arrays, **all** matching files must not contain the specified string.

Example: Check that a README does not contain a secret:

```json
{
  "name": "file-not-contains",
  "level": "error",
  "options": {
    "path": "README.md",
    "contains": "SECRET_KEY"
  }
}
```

Example: Check that all markdown files do not contain deprecated content:

```json
{
  "name": "file-not-contains",
  "level": "error",
  "options": {
    "path": "**/*.md",
    "contains": "DEPRECATED"
  }
}
```

Example: Check multiple specific files:

```json
{
  "name": "file-not-contains",
  "level": "error",
  "options": {
    "path": [".env", ".env.local"],
    "contains": "password"
  }
}
```
</details>

#### `github-actions/timeout-minutes`

<details>
<summary>github-actions/timeout-minutes</summary>

The `github-actions/timeout-minutes` rule checks if the GitHub Actions timeout is set.

```json
{
  "name": "github-actions/timeout-minutes",
  "level": "error",
  "options": {
    "maximum": 30
  }
}
```

| Option           | Description                                                     | Required | Default      |
|------------------|-----------------------------------------------------------------|----------|--------------|
| `maximum`        | Maximum allowed timeout value in minutes. If provided, the rule will check that all timeout values are lower than this maximum. | No       |              |
</details>

#### `license/exists`

<details>
<summary>license/exists</summary>

The `license/exists` rule checks if a LICENSE file exists in the repository.

```json
{
  "name": "license/exists",
  "level": "error",
  "options": {
    "caseSensitive": true,
    "path": "LICENSE.md"
  }
}
```

| Option          | Description                                                     | Required | Default      |
|-----------------|-----------------------------------------------------------------|----------|--------------|
| `caseSensitive` | Whether to check if the file exists in a case-sensitive manner. | No       | `false`      |
| `path`          | The path to the file, or an array of alternative paths.         | No       | `LICENSE.md` |

You can provide an array of alternative paths:

```json
{
  "name": "license/exists",
  "level": "error",
  "options": {
    "path": ["LICENSE", "LICENSE.md", "LICENSE.txt"]
  }
}
```
</details>

#### `python/pyproject-dependencies-alphabetical-order`

<details>
<summary>python/pyproject-dependencies-alphabetical-order</summary>

The `python/pyproject-dependencies-alphabetical-order` rule checks if dependencies in `pyproject.toml` are in alphabetical order.

```json
{
  "name": "python/pyproject-dependencies-alphabetical-order",
  "level": "error",
  "options": {
    "path": "pyproject.toml",
    "sections": ["project.dependencies", "project.optional-dependencies", "tool.poetry.dependencies"]
  }
}
```

| Option          | Description                                                     | Required | Default      |
|-----------------|-----------------------------------------------------------------|----------|--------------|
| `path`          | The path to the pyproject.toml file.                            | No       | `pyproject.toml` |
| `sections`      | Array of dependency sections to check. Supported sections: `project.dependencies`, `project.optional-dependencies`, `tool.poetry.dependencies`. | No       | `["project.dependencies", "project.optional-dependencies", "tool.poetry.dependencies"]` |

The rule checks that dependencies are sorted alphabetically by package name (ignoring version specifiers and extras). For `project.optional-dependencies`, it checks each optional dependency group separately.

Example: Check if dependencies are in alphabetical order:

```json
{
  "name": "python/pyproject-dependencies-alphabetical-order",
  "level": "error",
  "options": {}
}
```

Example: Check only Poetry dependencies:

```json
{
  "name": "python/pyproject-dependencies-alphabetical-order",
  "level": "error",
  "options": {
    "sections": ["tool.poetry.dependencies"]
  }
}
```
</details>

#### `python/requirements-txt-dependencies-alphabetical-order`

<details>
<summary>python/requirements-txt-dependencies-alphabetical-order</summary>

The `python/requirements-txt-dependencies-alphabetical-order` rule checks if dependencies in `requirements.txt` are in alphabetical order.

```json
{
  "name": "python/requirements-txt-dependencies-alphabetical-order",
  "level": "error",
  "options": {
    "path": "requirements.txt"
  }
}
```

| Option          | Description                                                     | Required | Default      |
|-----------------|-----------------------------------------------------------------|----------|--------------|
| `path`          | The path to the requirements.txt file.                         | No       | `requirements.txt` |

The rule checks that dependencies are sorted alphabetically by package name (ignoring version specifiers, extras, and comments). It handles:
- Standard packages: `package`, `package==1.0.0`, `package>=1.0.0`, `package[extra]>=1.0.0`
- Editable installs: `-e .`, `-e ./local-package`
- Git URLs: `git+https://github.com/user/repo.git`, `git+https://github.com/user/repo.git@branch#egg=package-name`
- File paths: `./local-package`, `/path/to/package`
- Comments and empty lines are ignored

Example: Check if dependencies are in alphabetical order:

```json
{
  "name": "python/requirements-txt-dependencies-alphabetical-order",
  "level": "error",
  "options": {}
}
```

Example: Check a custom requirements file:

```json
{
  "name": "python/requirements-txt-dependencies-alphabetical-order",
  "level": "error",
  "options": {
    "path": "requirements-dev.txt"
  }
}
```
</details>

#### `readme/exists`

<details>
<summary>readme/exists</summary>

The `readme/exists` rule checks if a README file exists in the repository.

```json
{
  "name": "readme/exists",
  "level": "error",
  "options": {
    "caseSensitive": true,
    "path": "README.md"
  }
}
```

| Option          | Description                                                     | Required | Default     |
|-----------------|-----------------------------------------------------------------|----------|-------------|
| `caseSensitive` | Whether to check if the file exists in a case-sensitive manner. | No       | `false`     |
| `path`          | The path to the file, or an array of alternative paths.         | No       | `README.md` |

You can provide an array of alternative paths:

```json
{
  "name": "readme/exists",
  "level": "error",
  "options": {
    "path": ["README.md", "README.rst", "README.txt"]
  }
}
```
</details>
