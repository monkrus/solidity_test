const expectedExceptionPromise = require("../utils/expectedException.js");
web3.eth.getTransactionReceiptMined = require("../utils/getTransactionReceiptMined.js");
const Promise = require("bluebird");
Promise.allNamed = require("../utils/sequentialPromiseNamed.js");
const isAddress = require("../utils/isAddress.js");

if (typeof web3.eth.getAccountsPromise === "undefined") {
    Promise.promisifyAll(web3.eth, { suffix: "Promise" });
}

const Regulator = artifacts.require("./Regulator.sol");
const TollBoothOperator = artifacts.require("./TollBoothOperator.sol");

contract('Regulator, Toll Booth Operator', function(accounts) {

    let owner0, owner1, owner2, operator0, operator1, regulator;
    const addressZero = "0x0000000000000000000000000000000000000000";
    const deposit0 = Math.floor(Math.random() * 1000) + 1;
    const deposit1 = deposit0 + Math.floor(Math.random() * 1000) + 1;
    const deposit2 = deposit1 + Math.floor(Math.random() * 1000) + 1;

    before("should prepare", function() {
        assert.isAtLeast(accounts.length, 3);
        owner0 = accounts[0];
        owner1 = accounts[1];
        owner2 = accounts[2];
        return web3.eth.getBalancePromise(owner0)
            .then(balance => assert.isAtLeast(web3.fromWei(balance).toNumber(), 10));
    });

    beforeEach("should deploy a new Regulator", function() {
        return Regulator.new({ from: owner0 })
            .then(instance => regulator = instance);
    });

    describe("isOperator", function() {

        it("should have correct initial value", function() {
            return Promise.allNamed({
                    regulator: () => regulator.isOperator(regulator.address),
                    owner0: () => regulator.isOperator(owner0),
                    owner1: () => regulator.isOperator(owner1),
                    zero: () => regulator.isOperator(addressZero)
                })
                .then(isIndeeds => {
                    assert.isFalse(isIndeeds.regulator);
                    assert.isFalse(isIndeeds.owner0);
                    assert.isFalse(isIndeeds.owner1);
                    assert.isFalse(isIndeeds.zero);
                });
        });

    });

    describe("createNewOperator", function() {

        it("should be possible to create an operator", function() {
            return regulator.createNewOperator.call(owner1, deposit0, { from: owner0 })
                .then(operator => assert.isTrue(isAddress(operator)))
                .then(() => regulator.createNewOperator(owner1, deposit0, { from: owner0 }))
                .then(tx => {
                    assert.strictEqual(tx.receipt.logs.length, 2);
                    assert.strictEqual(tx.logs.length, 2);
                    const logCreated = tx.logs[1];
                    assert.strictEqual(logCreated.event, "LogTollBoothOperatorCreated");
                    assert.strictEqual(logCreated.args.sender, owner0);
                    operator0 = logCreated.args.newOperator;
                    assert.strictEqual(logCreated.args.owner, owner1);
                    assert.strictEqual(logCreated.args.depositWeis.toNumber(), deposit0);

                    const logChangedOwner = tx.logs[0];
                    assert.strictEqual(logChangedOwner.event, "LogOwnerSet");
                    assert.strictEqual(logChangedOwner.address, operator0);
                    assert.strictEqual(logChangedOwner.args.previousOwner, regulator.address);
                    assert.strictEqual(logChangedOwner.args.newOwner, owner1);
                    // console.log(tx.receipt.gasUsed);
                    return Promise.allNamed({
                        regulator: () => regulator.isOperator(regulator.address),
                        operator0: () => regulator.isOperator(operator0),
                        owner0: () => regulator.isOperator(owner0),
                        owner1: () => regulator.isOperator(owner1),
                        owner2: () => regulator.isOperator(owner2),
                        zero: () => regulator.isOperator(addressZero),
                        owner: () => TollBoothOperator.at(operator0).getOwner(),
                        deposit: () => TollBoothOperator.at(operator0).getDeposit(),
                        regulated: () => TollBoothOperator.at(operator0).getRegulator()
                    });
                })
                .then(results => {
                    assert.isFalse(results.regulator);
                    assert.isTrue(results.operator0);
                    assert.isFalse(results.owner0);
                    assert.isFalse(results.owner1);
                    assert.isFalse(results.owner2);
                    assert.isFalse(results.zero);
                    assert.strictEqual(results.owner, owner1);
                    assert.strictEqual(results.deposit.toNumber(), deposit0);
                    assert.strictEqual(results.regulated, regulator.address);
                });
        });

    });

    describe("removeOperator", function() {

        beforeEach("should create an operator", function() {
            return regulator.createNewOperator(owner1, deposit0, { from: owner0 })
                .then(tx => operator0 = tx.logs[1].args.newOperator);
        });

        it("should be possible to remove an operator", function() {
            return regulator.removeOperator.call(operator0, { from: owner0 })
                .then(success => assert.isTrue(success))
                .then(() => regulator.removeOperator(operator0, { from: owner0 }))
                .then(tx => {
                    assert.strictEqual(tx.receipt.logs.length, 1);
                    assert.strictEqual(tx.logs.length, 1);
                    const logRemoved = tx.logs[0];
                    assert.strictEqual(logRemoved.event, "LogTollBoothOperatorRemoved");
                    assert.strictEqual(logRemoved.args.sender, owner0);
                    assert.strictEqual(logRemoved.args.operator, operator0);
                    // console.log(tx.receipt.gasUsed);
                    return Promise.allNamed({
                        regulator: () => regulator.isOperator(regulator.address),
                        operator0: () => regulator.isOperator(operator0),
                        owner0: () => regulator.isOperator(owner0),
                        owner1: () => regulator.isOperator(owner1),
                        owner2: () => regulator.isOperator(owner2),
                        zero: () => regulator.isOperator(addressZero),
                        owner: () => TollBoothOperator.at(operator0).getOwner(),
                        deposit: () => TollBoothOperator.at(operator0).getDeposit(),
                        regulated: () => TollBoothOperator.at(operator0).getRegulator()
                    });
                })
                .then(results => {
                    assert.isFalse(results.regulator);
                    assert.isFalse(results.operator0);
                    assert.isFalse(results.owner0);
                    assert.isFalse(results.owner1);
                    assert.isFalse(results.owner2);
                    assert.isFalse(results.zero);
                    assert.strictEqual(results.owner, owner1);
                    assert.strictEqual(results.deposit.toNumber(), deposit0);
                    assert.strictEqual(results.regulated, regulator.address);
                });
        });

    });

});
