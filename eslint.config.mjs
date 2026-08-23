import { FlatCompat } from '@eslint/eslintrc';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const directory = path.dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: directory });

const config = [
  { ignores: ['.next/**', 'out/**', 'build/**', 'dist/**', 'para-taynara/**', 'whatsapp-auth-*/**', 'scripts/**', 'test-memory.ts', 'next-env.d.ts'] },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  { files: ['**/*.ts', '**/*.tsx'], rules: { '@typescript-eslint/no-explicit-any': 'off' } },
  { files: ['whatsapp-service/**/*.ts'], rules: { 'react-hooks/rules-of-hooks': 'off' } },
];

export default config;
