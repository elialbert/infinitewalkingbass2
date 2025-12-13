module.exports = {
  transform: {
    '^.+\\.svelte$': 'svelte-jester',
    '^.+\\.js$': 'babel-jest',
  },
  moduleFileExtensions: ['js', 'svelte'],
  testEnvironment: 'jsdom',
  roots: [
    '<rootDir>'
  ],
  modulePaths: [
    '<rootDir>'
  ],
  moduleDirectories: [
    'node_modules'
  ],
}