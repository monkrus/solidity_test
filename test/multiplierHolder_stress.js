const expectedExceptionPromise = require("../utils/expectedException.js");
web3.eth.getTransactionReceiptMined = require("../utils/getTransactionReceiptMined.js");
const Promise = require("bluebird");
Promise.allSeq = require("../utils/sequentialPromise.js");
Promise.allNamed = require("../utils/sequentialPromiseNamed.js");
if (typeof web3.version.getNodePromise === "undefined") {
  Promise.promisifyAll(web3.version, { suffix: "Promise" });
}
if (typeof web3.eth.getAccountsPromise === "undefined") {
  Promise.promisifyAll(web3.eth, { suffix: "Promise" });
}
const allArtifacts = {
  MultiplierHolder: artifacts.require("./MultiplierHolder.sol"),
  TollBoothOperator: artifacts.require("./TollBoothOperator.sol")
}
const constructors = {
    MultiplierHolder: (owner, paused) => allArtifacts.MultiplierHolder.new({ from: owner }),
  TollBoothOperator: (owner, paused) => allArtifacts.TollBoothOperator.new(paused, 1, owner, { from: owner })
};
contract('MultiplierHolder - stress', function(accounts) {
  let isTestRPC;
  let owner0, owner1, holder;
  const type0 = Math.floor(Math.random() * 1000) + 1;
  const type1 = type0 + Math.floor(Math.random() * 1000) + 1;
  const multiplier0 = Math.floor(Math.random() * 1000) + 1;
  const multiplier1 = multiplier0 + Math.floor(Math.random() * 1000) + 1;
  before("should prepare", function() {
    assert.isAtLeast(accounts.length, 2);
    owner0 = accounts[0];
    owner1 = accounts[1];
    return web3.version.getNodePromise()
      .then(node => isTestRPC = node.indexOf("TestRPC") > -1)
  .then(() => web3.eth.getBalancePromise(owner0))
  .then(balance => assert.isAtLeast(web3.fromWei(balance).toNumber(), 10));
  });
  Object.keys(constructors).forEach(name => {
    describe(name, function() {
      beforeEach("should deploy a new un-paused " + name, function() {
        return constructors[name](owner0, false)
          .then(instance => holder = instance);
      });
      describe("stress test", function() {
        const count = 500;
        it("should be possible to set and unset " + count + " multipliers", function() {
          if (!isTestRPC) this.skip();
          this.timeout(1800000);
          this.slow(300000);
          const setting = [], unsetting = [];
          for (let i = 1; i <= count; i++) {
            setting.push(() => {
              process.stderr.write("setting " + i + "          " + '\r');
            return holder.setMultiplier(i, 2 * i, { from: owner0 });
          });
            unsetting.push(() => {
              process.stderr.write("unsetting " + i + "          " + '\r');
            return holder.setMultiplier(i, 0, { from: owner0 });
          });
          }
          return Promise.allSeq(setting)
            .then(txs => Promise.allSeq(txs.map((tx, i) => () => {
            process.stderr.write("querying after set " + i + "          " + '\r');
          return holder.getMultiplier(i + 1);
        })))
        .then(multipliers => {
            assert.strictEqual(multipliers.length, count);
          multipliers.forEach((multiplier, index) =>
          assert.strictEqual(multiplier.toNumber(), 2 * (index + 1)));
        })
        .then(() => Promise.allSeq(unsetting))
        .then(txs => Promise.allSeq(txs.map((tx, i) => () => {
            process.stderr.write("querying after unset " + i + "          " + '\r');
          return holder.getMultiplier(i + 1);
        })))
        .then(multipliers => {
            assert.strictEqual(multipliers.length, count);
          multipliers.forEach(multiplier =>
          assert.strictEqual(multiplier.toNumber(), 0));
        });
        });
      });
    });
});
});