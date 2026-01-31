module.exports = {
  timeout: 30000,
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10000,
    ignoreHTTPSErrors: true,
  },
  testDir: 'tests',
  reporter: [['list'], ['html', { outputFolder: 'playwright-report' }]],
};
