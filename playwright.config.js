const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./e2e", // folder containing your test files
  testMatch: ["home.spec.js"], // run only this file by default
  use: {
    browserName: "chromium", // or 'firefox' or 'webkit'
    headless: true, // set false if you want to see browser,
    baseURL: process.env.BASE_URL || "http://localhost:3000",
  },
});
