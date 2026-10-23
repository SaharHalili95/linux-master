const { defineConfig, devices } = require('@playwright/test');

const PORT = 8766;

module.exports = defineConfig({
  testDir: '.',
  timeout: 120000,
  workers: process.env.CI ? 2 : 4,
  reporter: process.env.CI ? [['list'], ['github']] : [['list']],
  use: { baseURL: process.env.BASE_URL || `http://localhost:${PORT}/` },
  webServer: process.env.BASE_URL ? undefined : {
    command: `node serve.js ${PORT}`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'iphone-webkit', use: { ...devices['iPhone 13'] }, grepInvert: /@content/ },
    { name: 'android-chrome', use: { ...devices['Pixel 7'] }, grepInvert: /@content/, testMatch: ['site.spec.js', 'learning.spec.js', 'a11y.spec.js', 'english.spec.js', 'layout.spec.js'] },
    { name: 'iphone-se', use: { ...devices['iPhone SE'] }, grepInvert: /@content/, testMatch: ['site.spec.js', 'a11y.spec.js', 'bandit.spec.js', 'layout.spec.js', 'missions.spec.js'] },
  ],
});
