module.exports = {
  env: {
    browser: true,
    es2021: true,
    webextensions: true,
    node: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    'no-console': 'off',
    'no-unused-vars': 'warn',
    'prefer-const': 'error',
    'no-var': 'error'
  },
  globals: {
    chrome: 'readonly',
    FieldDetector: 'readonly',
    InputSimulator: 'readonly',
    EmailGenerator: 'readonly',
    StorageManager: 'readonly',
    fieldDetector: 'readonly',
    inputSimulator: 'readonly',
    emailGenerator: 'readonly',
    storageManager: 'readonly',
    SmartFieldDetector: 'readonly',
    ValueGenerator: 'readonly'
  }
};
