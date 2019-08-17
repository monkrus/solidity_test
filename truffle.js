// Allows us to use ES6 in our migrations and tests.
require('babel-register')

module.exports = {
  contracts_build_directory: __dirname + "/src/build",
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*' // Match any network id
    }
  }
}
