const tseslint = require('typescript-eslint');

module.exports = tseslint.config({
  files: ['**/*.ts'],
  extends: [
    ...tseslint.configs.recommended,
  ],
  rules: {
    // Disable unsafe rules for Prisma/NestJS
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/require-await': 'off',
    '@typescript-eslint/await-thenable': 'off',
    
    // Keep unused vars check
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    
    // Disable other strict rules
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
  },
  ignores: ['dist', 'node_modules', '.eslintrc.js', 'prisma'],
});
