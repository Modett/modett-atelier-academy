/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['reflect-metadata', '<rootDir>/test/setup-env.ts'],
  roots: ['<rootDir>/src', '<rootDir>/test'],
};
