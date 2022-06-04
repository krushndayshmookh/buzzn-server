module.exports = {
  env: {
    commonjs: true,
    es2021: true,
    node: true,
  },
  extends: ['eslint:recommended', 'airbnb-base', 'prettier'],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  plugins: ['prettier'],
  rules: {
    indent: ['error', 2],
    'linebreak-style': ['error', 'unix'],
    quotes: ['error', 'single'],
    semi: ['error', 'never'],
    'no-unused-vars': [
      'warn',
      { vars: 'all', args: 'after-used', ignoreRestSiblings: false },
    ],
    'no-use-before-define': ['warn', { functions: false, classes: true }],
    'no-underscore-dangle': ['warn', { allow: ['_id'] }],
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    'new-cap': [
      'warn',
      {
        newIsCapExceptions: ['moment', 'tz', 'jsPDF'],
        capIsNewExceptions: ['ObjectId', 'Router'],
      },
    ],
    'no-plusplus': 'off',
    'no-await-in-loop': 'off',
  },
}
