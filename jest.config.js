module.exports = {
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.esm.json",
    },
  },
  preset: "ts-jest",
  testTimeout: 10000,
  verbose: true,
};
