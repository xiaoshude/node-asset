module.exports = {
  extends: ['@tencent/eslint-config-tencent', '@tencent/eslint-config-tencent/ts'],
  globals: {
    describe: true,
    it: true,
  },
  rules: {
    'max-len': ['warn'],
  },
};
