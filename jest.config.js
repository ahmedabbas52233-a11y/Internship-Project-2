module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/config/db.js'
  ]
};