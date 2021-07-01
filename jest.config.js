module.exports = {
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.jest.json",
    },
  },
  preset: "ts-jest",
  testTimeout: 10000,
  verbose: true,
};
