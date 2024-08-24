// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                project: true,
                tsconfigRootDir: dirname(fileURLToPath(import.meta.url)),
            },
        },
    },
    {
        rules: {
            '@typescript-eslint/restrict-template-expressions': 'off',
        },
    },
);
