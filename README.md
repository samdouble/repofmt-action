[![CI](https://github.com/samdouble/repolint-action/actions/workflows/checks.yml/badge.svg)](https://github.com/samdouble/repolint-action/actions/workflows/checks.yml)
[![Coverage Status](https://coveralls.io/repos/samdouble/repolint-action/badge.svg?branch=master&service=github)](https://coveralls.io/github/samdouble/repolint-action?branch=master)

[![Node.js](https://img.shields.io/badge/Node.js-6DA55F?logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff)](https://www.typescriptlang.org/)
[![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?logo=github-actions&logoColor=white)](https://github.com/features/actions)
[![Jest](https://img.shields.io/badge/Jest-C21325?logo=jest&logoColor=fff)](https://jestjs.io/)

# repolint-action

## Usage

Create a repository in your organization with a `repolint.json` file at the root with the following contents:

```yaml

permissions:
  contents: read

on:
  schedule:
    - cron: 0 0 * * *

- name: repolint
  uses: samdouble/repolint-action@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
```

![GitHub token](./docs/token.png)

## Configuration

### Inputs

#### `github-token`

`github-token` is the GitHub token to use for API access. It is optional and must be a personal access token with the `repo` scope. If not provided, the action will use the default GitHub token.

### repolint.json

The action can be configured by creating a `repolint.json` file at the root of your repository.

```json
{
  "repos": ["repo1", "repo2", "repo3"]
}
```

### Rules

#### `file-exists`

The `file-exists` rule checks if a file exists in the repository.

```json
{
  "file-exists": {
    "caseSensitive": true,
    "path": "file.md"
  }
}
```

| Option | Description | Required | Default |
|--------|-------------|----------|---------|
| `caseSensitive` | Whether to check if the file exists in a case-sensitive manner. | No | `false` |
| `path` | The path to the file. | Yes |  |

#### `readme/exists`

The `readme/exists` rule checks if a README file exists in the repository.

```json
{
  "readme/exists": {
    "caseSensitive": true,
    "path": "README.md"
  }
}
```

| Option | Description | Required | Default |
|--------|-------------|----------|---------|
| `caseSensitive` | Whether to check if the file exists in a case-sensitive manner. | No | `false` |
| `path` | The path to the file. | No | `README.md` |
