const expectedExceptionPromise = require("../utils/expectedException.js");
web3.eth.getTransactionReceiptMined = require("../utils/getTransactionReceiptMined.js");
const Promise = require("bluebird");
if (typeof web3.eth.getAccountsPromise === "undefined") {
  Promise.promisifyAll(web3.eth, { suffix: "Promise" });
}
const allArtifacts = {
  Owned: artifacts.require("./Owned.sol"),
  Pausable: artifacts.require("./Pausable.sol"),
  Regulator: artifacts.require("./Regulator.sol"),
  DepositHolder: artifacts.require("./DepositHolder.sol"),
  MultiplierHolder: artifacts.require("./MultiplierHolder.sol"),
  RoutePriceHolder: artifacts.require("./RoutePriceHolderMock.sol"),
  TollBoothHolder: artifacts.require("./TollBoothHolder.sol"),
  TollBoothOperator: artifacts.require("./TollBoothOperator.sol")
}
const maxGas = 5000000;
const constructors = {
    Owned: (owner, value) => allArtifacts.Owned.new(
  { from: owner, value: value || 0 }),
  Pausable: (owner, value) => allArtifacts.Pausable.new(
  false, { from: owner, value: value || 0 }),
  Regulator: (owner, value) => allArtifacts.Regulator.new(
  { from: owner, value: value || 0 }),
  DepositHolder: (owner, value) => allArtifacts.DepositHolder.new(
  105, { from: owner, value: value || 0 }),
  MultiplierHolder: (owner, value) => allArtifacts.MultiplierHolder.new(
  { from: owner, value: value || 0 }),
  RoutePriceHolder: (owner, value) => allArtifacts.RoutePriceHolder.new(
  { from: owner, value: value || 0 }),
  TollBoothHolder: (owner, value) => allArtifacts.TollBoothHolder.new(
  { from: owner, value: value || 0 }),
  TollBoothOperator: (owner, value) => allArtifacts.TollBoothOperator.new(
  false, 105, owner, { from: owner, value: value || 0 })
};
contract('Owned inheritance tree', function(accounts) {
  let owner0, owner1, owned;
  const addressZero = "0x0000000000000000000000000000000000000000";
  before("should prepare", function() {
    assert.isAtLeast(accounts.length, 2);
    owner0 = accounts[0];
    owner1 = accounts[1];
    return web3.eth.getBalancePromise(owner0)
      .then(balance => assert.isAtLeast(web3.fromWei(balance).toNumber(), 10));
  });
  Object.keys(constructors).forEach(name => {

    it("should fail to deploy a " + name + " if pass value", function() {
      return constructors[name](owner0, 1)
        .then(
          () => assert.throw("should not have reached here"),
        e => assert.isAtLeast(e.message.indexOf("non-payable constructor"), 0));
    });
  describe(name, function() {
    beforeEach("should deploy a new " + name, function() {
      return constructors[name](owner0)
        .then(instance => owned = instance);
    });
    describe("getOwner", function() {
      it("should have correct initial value", function() {
        return owned.getOwner()
          .then(owner => assert.strictEqual(owner, owner0));
      });
      it("should be possible to ask for owner from any address", function() {
        return owned.getOwner({ from: owner1 })
          .then(owner => assert.strictEqual(owner, owner0));
      });
      it("should be possible to send a transaction to getOwner", function() {
        return owned.getOwner.sendTransaction({ from: owner1 })
          .then(tx => web3.eth.getTransactionReceiptMined(tx))
      .then(receipt => assert.strictEqual(receipt.logs.length, 0))
      .then(() => owned.getOwner())
      .then(owner => assert.strictEqual(owner, owner0));
      });
      it("should not be possible to send a transaction with value to getOwner", function() {
        return owned.getOwner.sendTransaction({ from: owner1, value: 1 })
          .then(
            () => assert.throw("should not have reached here"),
          e => assert.isAtLeast(e.message.indexOf("non-payable function"), 0));
      });
    });
    describe("setOwner", function() {
      it("should not be possible to set owner if asking from wrong owner", function() {
        return expectedExceptionPromise(
          () => owned.setOwner(owner1, { from: owner1, gas: maxGas }),
          maxGas);
      });
      it("should not be possible to set owner if to 0", function() {
        return expectedExceptionPromise(
          () => owned.setOwner(addressZero, { from: owner0, gas: maxGas }),
          maxGas);
      });
      it("should not be possible to set owner if no change", function() {
        return expectedExceptionPromise(
          () => owned.setOwner(owner0, { from: owner0, gas: maxGas }),
          maxGas);
      });
      it("should not be possible to set owner if pass value", function() {
        return owned.setOwner(owner1, { from: owner0, value: 1 })
          .then(
            () => assert.throw("should not have reached here"),
          e => assert.isAtLeast(e.message.indexOf("non-payable function"), 0));
      });
      it("should be possible to set owner", function() {
        return owned.setOwner.call(owner1, { from: owner0 })
          .then(success => assert.isTrue(success))
      .then(() => owned.setOwner(owner1, { from: owner0 }))
      .then(tx => {
          assert.strictEqual(tx.receipt.logs.length, 1);
        assert.strictEqual(tx.logs.length, 1);
        const logChanged = tx.logs[0];
        assert.strictEqual(logChanged.event, "LogOwnerSet");
        assert.strictEqual(logChanged.args.previousOwner, owner0);
        assert.strictEqual(logChanged.args.newOwner, owner1);
        // console.log(tx.receipt.gasUsed);
        return owned.getOwner();
      })
      .then(owner => assert.strictEqual(owner, owner1));
      });
    });
    describe("setOwner a second time", function() {
      beforeEach("should set owner once", function() {
        return owned.setOwner(owner1, { from: owner0 });
      });
      it("should not be possible to set owner if asking from wrong one", function() {
        return expectedExceptionPromise(
          () => owned.setOwner(owner0, { from: owner0, gas: maxGas }),
          maxGas);
      });
      it("should be possible to set owner again", function() {
        return owned.setOwner.call(owner0, { from: owner1 })
          .then(success => assert.isTrue(success))
      .then(() => owned.setOwner(owner0, { from: owner1 }))
      .then(tx => {
          assert.strictEqual(tx.receipt.logs.length, 1);
        assert.strictEqual(tx.logs.length, 1);
        const logChanged = tx.logs[0];
        assert.strictEqual(logChanged.event, "LogOwnerSet");
        assert.strictEqual(logChanged.args.previousOwner, owner1);
        assert.strictEqual(logChanged.args.newOwner, owner0);
        return owned.getOwner();
      })
      .then(owner => assert.strictEqual(owner, owner0));
      });
    });
  });
});
  it("should have correct number of functions", function() {
    return constructors.Owned(owner0)
      .then(owned => assert.strictEqual(Object.keys(owned).length, 11));
    // Expected: ["constructor","abi","contract","getOwner","setOwner","LogOwnerSet",
    // "sendTransaction","send","allEvents","address","transactionHash"]
  });
});