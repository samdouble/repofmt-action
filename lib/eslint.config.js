import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(['jest.config.ts', 'dist/*', 'node_modules/*']),
  tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.cts', '**.*.mts'],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      'comma-dangle': ['error', 'always-multiline'],
      'no-var': 'error',
      'prefer-const': 'error',
			semi: 'error',
		},
	},
]);
