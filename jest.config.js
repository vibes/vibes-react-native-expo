/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/src", "<rootDir>/plugin/src"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  clearMocks: true,
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          module: "commonjs",
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          strict: true,
          skipLibCheck: true,
          jsx: "react",
        },
      },
    ],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  moduleNameMapper: {
    "^react-native$": "<rootDir>/src/__tests__/mocks/react-native.ts",
    "^vibes-react-native$": "<rootDir>/../react-native/src/index.tsx",
  },
  transformIgnorePatterns: ["node_modules/(?!(vibes-react-native)/)"],
};
