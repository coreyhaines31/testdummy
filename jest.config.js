module.exports = {
    testEnvironment: 'jsdom',
    testMatch: ['**/tests/**/*.test.js'],
    collectCoverageFrom: [
        'utils/**/*.js',
        '!utils/**/*.min.js'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1'
    },
    transform: {
        '^.+\\.js$': 'babel-jest'
    },
    setupFiles: ['<rootDir>/tests/setup.js']
};