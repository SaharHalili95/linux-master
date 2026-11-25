// The course downloads after the first screen has painted, so the load event no longer means it has arrived.
// page.goto and page.reload wait for it here, as the load event used to, so tests can drive the whole course right away.
const base = require('@playwright/test');

exports.test = base.test.extend({
  page: async ({ page }, use) => {
    for (const name of ['goto', 'reload']) {
      const navigate = page[name].bind(page);
      page[name] = async (...args) => {
        const response = await navigate(...args);
        await page.waitForFunction(() => window.courseReady !== false || window.courseLoadFailed);
        return response;
      };
    }
    await use(page);
  }
});
exports.expect = base.expect;
