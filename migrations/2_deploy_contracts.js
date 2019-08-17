var Regulator = artifacts.require('./Regulator.sol')

module.exports = function (deployer) {
  deployer.deploy(Regulator)
}