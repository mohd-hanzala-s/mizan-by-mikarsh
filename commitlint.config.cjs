/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // The CHANGELOG.md phase reports (see apps/web/CHANGELOG.md,
    // apps/web/docs/PHASE*_REPORT.md) are historically longer than
    // commitlint's default 100-char subject limit tolerates for a
    // merge/squash commit title — relax slightly rather than fight the
    // existing history's style.
    'header-max-length': [2, 'always', 120],
  },
}
