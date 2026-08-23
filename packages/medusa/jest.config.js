module.exports = {
  //moduleNameMapper: {
  //  "^highlight.js$": `<rootDir>/node_modules/highlight.js/lib/index.js`,
  //},
  //snapshotSerializers: [`jest-serializer-path`],
  // collectCoverageFrom: coverageDirs,
  //reporters: process.env.CI
  //  ? [[`jest-silent-reporter`, { useDots: true }]].concat(
  //      useCoverage ? `jest-junit` : []
  //    )
  //  : [`default`].concat(useCoverage ? `jest-junit` : []),
  transform: { "^.+\\.[jt]s?$": ["@swc/jest", { sourceMaps: true }] },
  coverageProvider: "v8",
  modulePathIgnorePatterns: ["__fixtures__", "node_modules", "dist"],
  testEnvironment: `node`,
  moduleFileExtensions: [`js`, `ts`],
  setupFilesAfterEnv: ["<rootDir>/setupTests.js"],
  collectCoverageFrom: [
    "src/utils/**/*.ts",
    "src/api/utils/validators.ts",
  ],
  coverageReporters: ["text", "lcov"],
}
