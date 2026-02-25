const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
  // Only run specific test files (exclude authService and integration tests)
  testMatch: [
    "**/tests/services/boardService.test.ts",
    "**/tests/services/columnService.test.ts",
    "**/tests/services/taskService.test.ts",
    "**/tests/repos/**/*.test.ts",
  ],
  // Exclude files from coverage that have unresolved dependencies
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/metrics.ts",
    "!src/websocket.ts",
    "!src/services/authService.ts",
  ],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "integration\\.test\\.ts",
    "authService\\.test\\.ts"
  ],
};