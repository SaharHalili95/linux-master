const { defineConfig, devices } = require('@playwright/test');

const PORT = 8765;

module.exports = defineConfig({
  testDir: '.',
  timeout: 120000,
  workers: process.env.CI ? 2 : 4,
  reporter: process.env.CI ? [['list'], ['github']] : [['list']],
  use: { baseURL: process.env.BASE_URL || `http://localhost:${PORT}/` },
  webServer: process.env.BASE_URL ? undefined : {
    command: `python3 -m http.server ${PORT} --directory ..`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: true,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'iphone-webkit', use: { ...devices['iPhone 13'] }, grepInvert: /@content/ },
    { name: 'android-chrome', use: { ...devices['Pixel 7'] }, grepInvert: /@content/, testMatch: ['site.spec.js', 'learning.spec.js', 'a11y.spec.js', 'english.spec.js'] },
    { name: 'iphone-se', use: { ...devices['iPhone SE'] }, grepInvert: /@content/, testMatch: ['site.spec.js', 'a11y.spec.js', 'bandit.spec.js'] },
  ],
});
