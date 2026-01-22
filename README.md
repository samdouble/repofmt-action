[![CI](https://github.com/samdouble/repofmt-action/actions/workflows/checks.yml/badge.svg)](https://github.com/samdouble/repofmt-action/actions/workflows/checks.yml)
[![Coverage Status](https://coveralls.io/repos/samdouble/repofmt-action/badge.svg?branch=master&service=github)](https://coveralls.io/github/samdouble/repofmt-action?branch=master)

[![Node.js](https://img.shields.io/badge/Node.js-6DA55F?logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff)](https://www.typescriptlang.org/)
[![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?logo=github-actions&logoColor=white)](https://github.com/features/actions)
[![Jest](https://img.shields.io/badge/Jest-C21325?logo=jest&logoColor=fff)](https://jestjs.io/)

# repofmt-action

This tool checks consistency across repositories.

## Usage

Create a repository in your organization with a `repofmt.config.ts`. Then, add the following to your repository's `.github/workflows/repofmt.yml` file:

```yaml

permissions:
  contents: read

on:
  schedule:
    - cron: 0 0 * * *

- name: repofmt
  uses: samdouble/repofmt-action@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
```

![GitHub token](./docs/token.png)

### CLI

```bash
npx repofmt run [options]
```

#### Options

| Option | Description | Required | Default |
|--------|-------------|----------|---------|
| `--config <path>` | Path to the config file. | No | `repofmt.config.ts` |
| `--token <token>` | GitHub token (can also use GITHUB_TOKEN env var). | No |  |

### GitHub Action

TODO

## Configuration

### Inputs

#### `github-token`

`github-token` is the GitHub token to use for API access. It is optional and must be a personal access token with the `repo` scope. If not provided, the action will use the default GitHub token.

### repofmt.config.ts

The action can be configured by creating a `repofmt.config.ts` file at the root of your repository. `repofmt.config.js`, `repofmt.config.mjs`, and `repofmt.config.cjs` are also supported.

```ts
export default {
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

### Rules

#### `file-exists`

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
| `path`          | The path to the file.                                           | Yes      |              |

#### `file-forbidden`

The `file-forbidden` rule checks that a file does NOT exist in the repository. This is useful for enforcing that certain files (like `.DS_Store`, `node_modules`, etc.) are not committed.

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
| `path`          | The path to the file that should not exist.                     | Yes      |              |

#### `license/exists`

The `license/exists` rule checks if a LICENSE file exists in the repository.

```json
{
  "rule": "license/exists",
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
| `path`          | The path to the file.                                           | No       | `LICENSE.md` |

#### `readme/exists`

The `readme/exists` rule checks if a README file exists in the repository.

```json
{
  "rule": "readme/exists",
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
| `path`          | The path to the file.                                           | No       | `README.md` |
