module.exports = {
  projects: [
    {
      displayName: "unit",
      testMatch: ["<rootDir>/tests/unit/**/*.test.js"],
    },
    {
      displayName: "integration",
      testMatch: ["<rootDir>/tests/integration/**/*.test.js"],
    },
    {
      displayName: "e2e",
      testMatch: ["<rootDir>/tests/e2e/**/*.e2e.test.js"],
    },
  ],
};
