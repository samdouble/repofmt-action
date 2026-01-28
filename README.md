[![CI](https://github.com/samdouble/repofmt-action/actions/workflows/checks.yml/badge.svg)](https://github.com/samdouble/repofmt-action/actions/workflows/checks.yml)
[![Coverage Status](https://coveralls.io/repos/samdouble/repofmt-action/badge.svg?branch=master&service=github)](https://coveralls.io/github/samdouble/repofmt-action?branch=master)

[![Node.js](https://img.shields.io/badge/Node.js-6DA55F?logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff)](https://www.typescriptlang.org/)
[![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?logo=github-actions&logoColor=white)](https://github.com/features/actions)
[![Jest](https://img.shields.io/badge/Jest-C21325?logo=jest&logoColor=fff)](https://jestjs.io/)

# repofmt-action

This tool checks consistency across repositories.

## Usage

### GitHub Action

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

See [repofmt](./lib/README.md) for more details on the configuration options.
