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
const maxGas = 5000000;
const constructors = {
    MultiplierHolder: (owner, paused, value) => allArtifacts.MultiplierHolder.new(
  { from: owner, value: value || 0 }),
  TollBoothOperator: (owner, paused, value) => allArtifacts.TollBoothOperator.new(
  paused, 1, owner, { from: owner, value: value || 0 })
};
contract('MultiplierHolder', function(accounts) {
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
    it("should fail to deploy a " + name + " if pass value", function() {
      return constructors[name](owner0, false, 1)
        .then(
          () => assert.throw("should not have reached here"),
        e => assert.isAtLeast(e.message.indexOf("non-payable constructor"), 0));
    });
  describe(name, function() {
    beforeEach("should deploy a new un-paused " + name, function() {
      return constructors[name](owner0, false)
        .then(instance => holder = instance);
    });
    describe("getMultiplier", function() {
      it("should have correct initial value", function() {
        return Promise.allNamed({
          type0: () => holder.getMultiplier(type0),
          type1: () => holder.getMultiplier(type1)
      })
      .then(multipliers => {
          assert.strictEqual(multipliers.type0.toNumber(), 0);
        assert.strictEqual(multipliers.type1.toNumber(), 0);
      });
      });
      it("should be possible to ask for multiplier from any address", function() {
        return holder.getMultiplier(type0, { from: owner1 })
          .then(multiplier => assert.strictEqual(multiplier.toNumber(), 0));
      });
      it("should be possible to send a transaction to getMultiplier", function() {
        return holder.getMultiplier.sendTransaction(type0, { from: owner1 })
          .then(tx => web3.eth.getTransactionReceiptMined(tx))
      .then(receipt => assert.strictEqual(receipt.logs.length, 0))
      .then(() => holder.getMultiplier(type0))
      .then(multiplier => assert.strictEqual(multiplier.toNumber(), 0));
      });
      it("should not be possible to send a transaction with value to getMultiplier", function() {
        return holder.getMultiplier.sendTransaction(type0, { from: owner1, value: 1 })
          .then(
            () => assert.throw("should not have reached here"),
          e => assert.isAtLeast(e.message.indexOf("non-payable function"), 0));
      });
    });
    describe("setMultiplier", function() {
      it("should not be possible to set multiplier if asking from wrong owner", function() {
        return expectedExceptionPromise(
          () => holder.setMultiplier(type0, multiplier0, { from: owner1, gas: maxGas }),
          maxGas);
      });
      it("should not be possible to set multiplier if type is 0", function() {
        return expectedExceptionPromise(
          () => holder.setMultiplier(0, multiplier0, { from: owner0, gas: maxGas }),
          maxGas);
      });
      it("should not be possible to set multiplier if no change", function() {
        return holder.setMultiplier(type0, multiplier0, { from: owner0 })
          .then(tx => expectedExceptionPromise(
          () => holder.setMultiplier(type0, multiplier0, { from: owner0, gas: maxGas }),
          maxGas));
      });
      it("should not be possible to set multiplier if pass value", function() {
        return holder.setMultiplier(type0, multiplier0, { from: owner0, value: 1 })
          .then(
            () => assert.throw("should not have reached here"),
          e => assert.isAtLeast(e.message.indexOf("non-payable function"), 0));
      });
      it("should be possible to set 1 multipliers", function() {
        return holder.setMultiplier.call(type0, multiplier0, { from: owner0 })
          .then(success => assert.isTrue(success))
      .then(() => holder.setMultiplier(type0, multiplier0, { from: owner0 }))
      .then(tx => {
          assert.strictEqual(tx.receipt.logs.length, 1);
        assert.strictEqual(tx.logs.length, 1);
        const logChanged = tx.logs[0];
        assert.strictEqual(logChanged.event, "LogMultiplierSet");
        assert.strictEqual(logChanged.args.sender, owner0);
        assert.strictEqual(logChanged.args.vehicleType.toNumber(), type0);
        assert.strictEqual(logChanged.args.multiplier.toNumber(), multiplier0);
        // console.log(tx.receipt.gasUsed);
        return Promise.allNamed({
          type0: () => holder.getMultiplier(type0),
          type1: () => holder.getMultiplier(type1)
      });
      })
      .then(multipliers => {
          assert.strictEqual(multipliers.type0.toNumber(), multiplier0);
        assert.strictEqual(multipliers.type1.toNumber(), 0);
      });
      });
    });
    if (name == "TollBoothOperator") {
      describe("setMultiplier in TollBoothOperator is not pausable", function() {
        beforeEach("should pause holder", function() {
          return holder.setMultiplier(type0, multiplier0, { from: owner0 })
            .then(tx => holder.setPaused(true, { from: owner0 }));
        });
        it("should be possible to check getMultiplier if paused", function() {
          return holder.getMultiplier(type0)
            .then(multiplier => assert.strictEqual(multiplier.toNumber(), multiplier0));
        });
        it("should be possible to set multiplier if paused", function() {
          return holder.setMultiplier.call(type0, multiplier1, { from: owner0 })
            .then(success => assert.isTrue(success))
        .then(() => holder.setMultiplier(type0, multiplier1, { from: owner0 }))
        .then(tx => {
            assert.strictEqual(tx.receipt.logs.length, 1);
          assert.strictEqual(tx.logs.length, 1);
          const logChanged = tx.logs[0];
          assert.strictEqual(logChanged.event, "LogMultiplierSet");
          assert.strictEqual(logChanged.args.sender, owner0);
          assert.strictEqual(logChanged.args.vehicleType.toNumber(), type0);
          assert.strictEqual(logChanged.args.multiplier.toNumber(), multiplier1);
          // console.log(tx.receipt.gasUsed);
          return Promise.allNamed({
            type0: () => holder.getMultiplier(type0),
            type1: () => holder.getMultiplier(type1)
        });
        })
        .then(multipliers => {
            assert.strictEqual(multipliers.type0.toNumber(), multiplier1);
          assert.strictEqual(multipliers.type1.toNumber(), 0);
        });
        });
      });
    }
    describe("setMultiplier a second time", function() {
      const parameters = [
        // Not this one because it is same as beforeEach "t0 - m0"
        { name: "type0 - zero", type: type0, multiplier: 0 },
        { name: "type0 - multiplier1", type: type0, multiplier: multiplier1 },
        { name: "type1 - multiplier0", type: type1, multiplier: multiplier0 },
        { name: "type1 - multiplier1", type: type1, multiplier: multiplier1 },
      ];
      beforeEach("should set first multiplier", function() {
        return holder.setMultiplier(type0, multiplier0, { from: owner0 });
      });
      parameters.forEach(arg => {
        it("should be possible to set another multiplier with values " + arg.name, function() {
          return holder.setMultiplier.call(arg.type, arg.multiplier, { from: owner0 })
            .then(success => assert.isTrue(success))
        .then(() => holder.setMultiplier(arg.type, arg.multiplier, { from: owner0 }))
        .then(tx => {
            assert.strictEqual(tx.receipt.logs.length, 1);
          assert.strictEqual(tx.logs.length, 1);
          const logChanged = tx.logs[0];
          assert.strictEqual(logChanged.event, "LogMultiplierSet");
          assert.strictEqual(logChanged.args.sender, owner0);
          assert.strictEqual(logChanged.args.vehicleType.toNumber(), arg.type);
          assert.strictEqual(logChanged.args.multiplier.toNumber(), arg.multiplier);
          return Promise.allNamed({
            type0: () => holder.getMultiplier(type0),
            type1: () => holder.getMultiplier(type1)
        });
        })
        .then(multipliers => {
            assert.strictEqual(multipliers.type0.toNumber(), arg.type == type0 ? arg.multiplier : multiplier0)
          assert.strictEqual(multipliers.type1.toNumber(), arg.type == type1 ? arg.multiplier : 0);
        });
        });
    });
    });
    describe("setMultiplier a second time after an owner change", function() {
      beforeEach("should set multiplier then change owners", function() {
        return holder.setMultiplier(type0, multiplier0, { from: owner0 })
          .then(tx => holder.setOwner(owner1, { from: owner0 }));
      });
      it("should not be possible to set another multiplier if old owner", function() {
        return expectedExceptionPromise(
          () => holder.setMultiplier(type1, multiplier1, { from: owner0, gas: maxGas }),
          maxGas);
      });
      it("should not be possible to set multiplier if same", function() {
        return expectedExceptionPromise(
          () => holder.setMultiplier(type0, multiplier0, { from: owner1, gas: maxGas }),
          maxGas);
      });
      it("should be possible to set another multiplier", function() {
        return holder.setMultiplier.call(type1, multiplier1, { from: owner1 })
          .then(success => assert.isTrue(success))
      .then(() => holder.setMultiplier(type1, multiplier1, { from: owner1 }))
      .then(tx => {
          assert.strictEqual(tx.receipt.logs.length, 1);
        assert.strictEqual(tx.logs.length, 1);
        const logChanged = tx.logs[0];
        assert.strictEqual(logChanged.event, "LogMultiplierSet");
        assert.strictEqual(logChanged.args.sender, owner1);
        assert.strictEqual(logChanged.args.vehicleType.toNumber(), type1);
        assert.strictEqual(logChanged.args.multiplier.toNumber(), multiplier1);
        return Promise.allNamed({
          type0: () => holder.getMultiplier(type0),
          type1: () => holder.getMultiplier(type1)
      });
      })
      .then(multipliers => {
          assert.strictEqual(multipliers.type0.toNumber(), multiplier0);
        assert.strictEqual(multipliers.type1.toNumber(), multiplier1);
      });
      });
    });
  });
});

  it("should have correct number of functions", function() {
    return constructors.MultiplierHolder(owner0, false)
      .then(holder => assert.strictEqual(Object.keys(holder).length, 14));
    // Expected: ["constructor","abi","contract","setOwner","setMultiplier","getOwner",
    // "getMultiplier","LogMultiplierSet","LogOwnerSet","sendTransaction","send","allEvents",
    // "address","transactionHash"]
  });
});