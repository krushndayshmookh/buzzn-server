module.exports = {
  env: {
    commonjs: true,
    node: true,
  },
  extends: ['eslint:recommended', 'plugin:prettier/recommended'],
  globals: {},
  parserOptions: {
    ecmaVersion: '2021',
    parser: '@babel/eslint-parser',
  },
  rules: {
    'no-unused-vars': 'warn',
  },
}
