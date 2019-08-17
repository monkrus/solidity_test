const expectedExceptionPromise = require("../utils/expectedException.js");
web3.eth.getTransactionReceiptMined = require("../utils/getTransactionReceiptMined.js");
const Promise = require("bluebird");
Promise.allNamed = require("../utils/sequentialPromiseNamed.js");
const randomIntIn = require("../utils/randomIntIn.js");
const toBytes32 = require("../utils/toBytes32.js");
if (typeof web3.eth.getAccountsPromise === "undefined") {
  Promise.promisifyAll(web3.eth, { suffix: "Promise" });
}
const Regulator = artifacts.require("./Regulator.sol");
const TollBoothOperator = artifacts.require("./TollBoothOperator.sol");
const maxGas = 5000000;
contract('TollBoothOperator', function(accounts) {
  let owner0, owner1,
    booth0, booth1, booth2,
    vehicle0, vehicle1,
    regulator, operator;
  const price01 = randomIntIn(1, 1000);
  const deposit0 = price01 + randomIntIn(1, 1000);
  const deposit1 = deposit0 + randomIntIn(1, 1000);
  const vehicleType0 = randomIntIn(1, 1000);
  const vehicleType1 = vehicleType0 + randomIntIn(1, 1000);
  const multiplier0 = randomIntIn(1, 1000);
  const multiplier1 = multiplier0 + randomIntIn(1, 1000);
  const tmpSecret = randomIntIn(1, 1000);
  const secret0 = toBytes32(tmpSecret);
  const secret1 = toBytes32(tmpSecret + randomIntIn(1, 1000));
  let hashed0, hashed1;
  before("should prepare", function() {
    assert.isAtLeast(accounts.length, 8);
    owner0 = accounts[0];
    owner1 = accounts[1];
    booth0 = accounts[2];
    booth1 = accounts[3];
    booth2 = accounts[4];
    vehicle0 = accounts[5];
    vehicle1 = accounts[6];
    return web3.eth.getBalancePromise(owner0)
      .then(balance => assert.isAtLeast(web3.fromWei(balance).toNumber(), 10));
  });
  describe("deploy", function() {
    it("should not be possible to deploy a TollBoothOperator with deposit 0 - 1", function() {
      return expectedExceptionPromise(
        () => TollBoothOperator.new(false, 0, owner0, { from: owner1, gas: maxGas }),
        maxGas);
    });
    it("should be possible to deploy a TollBoothOperator with parameters - 1", function() {
      return TollBoothOperator.new(false, deposit0, owner0, { from: owner1 })
        .then(instance => operator = instance)
    .then(() => operator.isPaused())
    .then(paused => assert.isFalse(paused))
    .then(() => operator.getDeposit())
    .then(deposit => assert.strictEqual(deposit.toNumber(), deposit0));
    });
  });
  describe("Vehicle Operations", function() {
    beforeEach("should deploy regulator and operator", function() {
      return Regulator.new({ from: owner0 })
        .then(instance => regulator = instance)
    .then(() => regulator.setVehicleType(vehicle0, vehicleType0, { from: owner0 }))
    .then(tx => regulator.setVehicleType(vehicle1, vehicleType1, { from: owner0 }))
    .then(tx => regulator.createNewOperator(owner1, deposit0, { from: owner0 }))
    .then(tx => operator = TollBoothOperator.at(tx.logs[1].args.newOperator))
    .then(() => operator.addTollBooth(booth0, { from: owner1 }))
    .then(tx => operator.addTollBooth(booth1, { from: owner1 }))
    .then(tx => operator.addTollBooth(booth2, { from: owner1 }))
    .then(tx => operator.setMultiplier(vehicleType0, multiplier0, { from: owner1 }))
    .then(tx => operator.setMultiplier(vehicleType1, multiplier1, { from: owner1 }))
    .then(tx => operator.setRoutePrice(booth0, booth1, price01, { from: owner1 }))
    .then(tx => operator.setPaused(false, { from: owner1 }))
    .then(tx => operator.hashSecret(secret0))
    .then(hash => hashed0 = hash)
    .then(tx => operator.hashSecret(secret1))
    .then(hash => hashed1 = hash);
    });
    describe("enterRoad", function() {
      it("should not be possible to enter road if paused", function() {
        return operator.setPaused(true, { from: owner1 })
          .then(tx => expectedExceptionPromise(
          () => operator.enterRoad(
          booth0, hashed0,
          { from: vehicle0, value: deposit0 * multiplier0, gas: maxGas }),
          maxGas));
      });
      it("should be possible to enter road with more than required deposit", function() {
        return operator.enterRoad.call(
          booth0, hashed0, { from: vehicle0, value: (deposit0 * multiplier0) + 1 })
          .then(success => assert.isTrue(success))
      .then(() => operator.enterRoad(
          booth0, hashed0, { from: vehicle0, value: (deposit0 * multiplier0) + 1 }))
      .then(tx => {
          assert.strictEqual(tx.receipt.logs.length, 1);
        assert.strictEqual(tx.logs.length, 1);
        const logEntered = tx.logs[0];
        assert.strictEqual(logEntered.event, "LogRoadEntered");
        assert.strictEqual(logEntered.args.vehicle, vehicle0);
        assert.strictEqual(logEntered.args.entryBooth, booth0);
        assert.strictEqual(logEntered.args.exitSecretHashed, hashed0);
        assert.strictEqual(logEntered.args.depositedWeis.toNumber(), (deposit0 * multiplier0) + 1);
        // console.log(tx.receipt.gasUsed);
        return operator.getVehicleEntry(hashed0);
      })
      .then(info => {
          assert.strictEqual(info[0], vehicle0);
        assert.strictEqual(info[1], booth0);
        assert.strictEqual(info[2].toNumber(), (deposit0 * multiplier0) + 1);
        return web3.eth.getBalancePromise(operator.address);
      })
      .then(balance => assert.strictEqual(balance.toNumber(), deposit0 * multiplier0 + 1));
      });
    });
    describe("reportExitRoad with excessive deposited", function() {
      const extraDeposit = randomIntIn(1, 1000);
      const extraPrice = extraDeposit + randomIntIn(1, 1000);
      let vehicleInitBal;
      beforeEach("should enter road with excessive deposit", function() {
        return operator.enterRoad(
          booth0, hashed0, { from: vehicle0, value: (deposit0 + extraDeposit) * multiplier0 })
          .then(tx => web3.eth.getBalancePromise(vehicle0))
      .then(balance => vehicleInitBal = balance);
      });
      it("should be possible to report exit road on route with known price below deposited", function() {
        return operator.setRoutePrice(booth0, booth1, deposit0, { from: owner1 })
          .then(tx => operator.reportExitRoad.call(secret0, { from: booth1 }))
      .then(result => assert.strictEqual(result.toNumber(), 1))
      .then(() => operator.reportExitRoad(secret0, { from: booth1 }))
      .then(tx => {
          assert.strictEqual(tx.receipt.logs.length, 1);
        assert.strictEqual(tx.logs.length, 1);
        const logExited = tx.logs[0];
        assert.strictEqual(logExited.event, "LogRoadExited");
        assert.strictEqual(logExited.args.exitBooth, booth1);
        assert.strictEqual(logExited.args.exitSecretHashed, hashed0);
        assert.strictEqual(logExited.args.finalFee.toNumber(), deposit0 * multiplier0);
        assert.strictEqual(logExited.args.refundWeis.toNumber(), extraDeposit * multiplier0);
        // console.log(tx.receipt.gasUsed);
        return Promise.allNamed({
          hashed0: () => operator.getVehicleEntry(hashed0),
          pendingCount01: () => operator.getPendingPaymentCount(booth0, booth1),
          pendingCount02: () => operator.getPendingPaymentCount(booth0, booth2)
      });
      })
      .then(info => {
          assert.strictEqual(info.hashed0[0], vehicle0);
        assert.strictEqual(info.hashed0[1], booth0);
        assert.strictEqual(info.hashed0[2].toNumber(), 0);
        assert.strictEqual(info.pendingCount01.toNumber(), 0);
        assert.strictEqual(info.pendingCount02.toNumber(), 0);
        return Promise.allNamed({
          operator: () => web3.eth.getBalancePromise(operator.address),
          collected: () => operator.getCollectedFeesAmount(),
          vehicle0: () => web3.eth.getBalancePromise(vehicle0)
      });
      })
      .then(balances => {
          assert.strictEqual(balances.operator.toNumber(), deposit0 * multiplier0);
        assert.strictEqual(balances.collected.toNumber(), deposit0 * multiplier0);
        assert.strictEqual(
          balances.vehicle0.toString(10),
          vehicleInitBal.plus(extraDeposit * multiplier0).toString(10));
      });
      });
      it("should be possible to report exit road on route with unknown price", function() {
        return operator.reportExitRoad.call(secret0, { from: booth2 })
          .then(result => assert.strictEqual(result.toNumber(), 2))
      .then(() => operator.reportExitRoad(secret0, { from: booth2 }))
      .then(tx => {
          assert.strictEqual(tx.receipt.logs.length, 1);
        assert.strictEqual(tx.logs.length, 1);
        const logPending = tx.logs[0];
        assert.strictEqual(logPending.event, "LogPendingPayment");
        assert.strictEqual(logPending.args.exitSecretHashed, hashed0);
        assert.strictEqual(logPending.args.entryBooth, booth0);
        assert.strictEqual(logPending.args.exitBooth, booth2);
        // console.log(tx.receipt.gasUsed);
        return Promise.allNamed({
          hashed0: () => operator.getVehicleEntry(hashed0),
          pendingCount01: () => operator.getPendingPaymentCount(booth0, booth1),
          pendingCount02: () => operator.getPendingPaymentCount(booth0, booth2)
      });
      })
      .then(info => {
          assert.strictEqual(info.hashed0[0], vehicle0);
        assert.strictEqual(info.hashed0[1], booth0);
        assert.strictEqual(info.hashed0[2].toNumber(), (deposit0 + extraDeposit) * multiplier0);
        assert.strictEqual(info.pendingCount01.toNumber(), 0);
        assert.strictEqual(info.pendingCount02.toNumber(), 1);
        return Promise.allNamed({
          operator: () => web3.eth.getBalancePromise(operator.address),
          collected: () => operator.getCollectedFeesAmount(),
          vehicle0: () => web3.eth.getBalancePromise(vehicle0)
      });
      })
      .then(balances => {
          assert.strictEqual(balances.operator.toNumber(), (deposit0 + extraDeposit) * multiplier0);
        assert.strictEqual(balances.collected.toNumber(), 0);
        assert.strictEqual(balances.vehicle0.toString(10), vehicleInitBal.toString(10));
      });
      });
    });
    describe("Pending payments with vehicles on same route, then setRoutePrice", function() {
      const extraDeposit0 = deposit0 + randomIntIn(1, 1000);
      const extraDeposit1 = deposit0 + randomIntIn(1, 1000);
      let vehicle0InitBal, vehicle1InitBal;
      beforeEach("should have 2 vehicles enter and exit road on same unknown route", function() {
        return operator.enterRoad(
          booth0, hashed0, { from: vehicle0, value: extraDeposit0 * multiplier0 })
          .then(tx => operator.enterRoad(
          booth0, hashed1, { from: vehicle1, value: extraDeposit1 * multiplier1 }))
      .then(tx => web3.eth.getBalancePromise(vehicle0))
      .then(balance => vehicle0InitBal = balance)
      .then(() => web3.eth.getBalancePromise(vehicle1))
      .then(balance => vehicle1InitBal = balance)
      .then(() => operator.reportExitRoad(secret1, { from: booth2 }))
      .then(tx => operator.reportExitRoad(secret0, { from: booth2 }));
      });
      it("should be possible to set the base route price below both deposits and reduce count by 1", function() {
        return operator.setRoutePrice.call(booth0, booth2, deposit0, { from: owner1 })
          .then(success => assert.isTrue(success))
      .then(() => operator.setRoutePrice(booth0, booth2, deposit0, { from: owner1 }))
      .then(tx => {
          assert.strictEqual(tx.receipt.logs.length, 2);
        assert.strictEqual(tx.logs.length, 2);
        const logPriceSet = tx.logs[0];
        assert.strictEqual(logPriceSet.event, "LogRoutePriceSet");
        assert.strictEqual(logPriceSet.args.sender, owner1);
        assert.strictEqual(logPriceSet.args.entryBooth, booth0);
        assert.strictEqual(logPriceSet.args.exitBooth, booth2);
        assert.strictEqual(logPriceSet.args.priceWeis.toNumber(), deposit0);
        const logExited = tx.logs[1];
        assert.strictEqual(logExited.event, "LogRoadExited");
        assert.strictEqual(logExited.args.exitBooth, booth2);
        assert.strictEqual(logExited.args.exitSecretHashed, hashed1);
        assert.strictEqual(logExited.args.finalFee.toNumber(), deposit0 * multiplier1);
        assert.strictEqual(
          logExited.args.refundWeis.toNumber(),
          (extraDeposit1 - deposit0) * multiplier1);
        // console.log(tx.receipt.gasUsed);
        return Promise.allNamed({
          hashed0: () => operator.getVehicleEntry(hashed0),
          hashed1: () => operator.getVehicleEntry(hashed1),
          pendingCount01: () => operator.getPendingPaymentCount(booth0, booth1),
          pendingCount02: () => operator.getPendingPaymentCount(booth0, booth2)
      });
      })
      .then(info => {
          assert.strictEqual(info.hashed0[0], vehicle0);
        assert.strictEqual(info.hashed0[1], booth0);
        assert.strictEqual(info.hashed0[2].toNumber(), extraDeposit0 * multiplier0);
        assert.strictEqual(info.hashed1[0], vehicle1);
        assert.strictEqual(info.hashed1[1], booth0);
        assert.strictEqual(info.hashed1[2].toNumber(), 0);
        assert.strictEqual(info.pendingCount01.toNumber(), 0);
        assert.strictEqual(info.pendingCount02.toNumber(), 1);
        return Promise.allNamed({
          operator: () => web3.eth.getBalancePromise(operator.address),
          collected: () => operator.getCollectedFeesAmount(),
          vehicle0: () => web3.eth.getBalancePromise(vehicle0),
          vehicle1: () => web3.eth.getBalancePromise(vehicle1)
      });
      })
      .then(balances => {
          assert.strictEqual(
          balances.operator.toNumber(),
          extraDeposit0 * multiplier0 + deposit0 * multiplier1);
        assert.strictEqual(balances.collected.toNumber(), deposit0 * multiplier1);
        assert.strictEqual(balances.vehicle0.toString(10), vehicle0InitBal.toString(10));
        assert.strictEqual(
          balances.vehicle1.toString(10),
          vehicle1InitBal.plus((extraDeposit1 - deposit0) * multiplier1).toString(10));
      });
      });
      it("should be possible to set the base route price above both deposits and reduce count by 1", function() {
        return operator.setRoutePrice.call(booth0, booth2, extraDeposit0 + extraDeposit1, { from: owner1 })
          .then(success => assert.isTrue(success))
      .then(() => operator.setRoutePrice(booth0, booth2, extraDeposit0 + extraDeposit1, { from: owner1 }))
      .then(tx => {
          assert.strictEqual(tx.receipt.logs.length, 2);
        assert.strictEqual(tx.logs.length, 2);
        const logPriceSet = tx.logs[0];
        assert.strictEqual(logPriceSet.event, "LogRoutePriceSet");
        assert.strictEqual(logPriceSet.args.sender, owner1);
        assert.strictEqual(logPriceSet.args.entryBooth, booth0);
        assert.strictEqual(logPriceSet.args.exitBooth, booth2);
        assert.strictEqual(logPriceSet.args.priceWeis.toNumber(), extraDeposit0 + extraDeposit1);
        const logExited = tx.logs[1];
        assert.strictEqual(logExited.event, "LogRoadExited");
        assert.strictEqual(logExited.args.exitBooth, booth2);
        assert.strictEqual(logExited.args.exitSecretHashed, hashed1);
        assert.strictEqual(logExited.args.finalFee.toNumber(), extraDeposit1 * multiplier1);
        assert.strictEqual(logExited.args.refundWeis.toNumber(), 0);
        // console.log(tx.receipt.gasUsed);
        return Promise.allNamed({
          hashed0: () => operator.getVehicleEntry(hashed0),
          hashed1: () => operator.getVehicleEntry(hashed1),
          pendingCount01: () => operator.getPendingPaymentCount(booth0, booth1),
          pendingCount02: () => operator.getPendingPaymentCount(booth0, booth2)
      });
      })
      .then(info => {
          assert.strictEqual(info.hashed0[0], vehicle0);
        assert.strictEqual(info.hashed0[1], booth0);
        assert.strictEqual(info.hashed0[2].toNumber(), extraDeposit0 * multiplier0);
        assert.strictEqual(info.hashed1[0], vehicle1);
        assert.strictEqual(info.hashed1[1], booth0);
        assert.strictEqual(info.hashed1[2].toNumber(), 0);
        assert.strictEqual(info.pendingCount01.toNumber(), 0);
        assert.strictEqual(info.pendingCount02.toNumber(), 1);
        return Promise.allNamed({
          operator: () => web3.eth.getBalancePromise(operator.address),
          collected: () => operator.getCollectedFeesAmount(),
          vehicle0: () => web3.eth.getBalancePromise(vehicle0),
          vehicle1: () => web3.eth.getBalancePromise(vehicle1)
      });
      })
      .then(balances => {
          assert.strictEqual(
          balances.operator.toNumber(),
          extraDeposit0 * multiplier0 + extraDeposit1 * multiplier1);
        assert.strictEqual(balances.collected.toNumber(), extraDeposit1 * multiplier1);
        assert.strictEqual(balances.vehicle0.toString(10), vehicle0InitBal.toString(10));
        assert.strictEqual(balances.vehicle1.toString(10), vehicle1InitBal.toString(10));
      });
      });
      describe("Clear one more pending payment", function() {
        it("should be possible to set the base route price below both deposits then clear the second by hand", function() {
          return operator.setRoutePrice(booth0, booth2, deposit0, { from: owner1 })
            .then(tx => operator.clearSomePendingPayments.call(booth0, booth2, 1, { from: owner0 }))
        .then(success => assert.isTrue(success))
        .then(() => operator.clearSomePendingPayments(booth0, booth2, 1, { from: owner0 }))
        .then(tx => {
            assert.strictEqual(tx.receipt.logs.length, 1);
          assert.strictEqual(tx.logs.length, 1);
          const logExited = tx.logs[0];
          assert.strictEqual(logExited.event, "LogRoadExited");
          assert.strictEqual(logExited.args.exitBooth, booth2);
          assert.strictEqual(logExited.args.exitSecretHashed, hashed0);
          assert.strictEqual(logExited.args.finalFee.toNumber(), deposit0 * multiplier0);
          assert.strictEqual(
            logExited.args.refundWeis.toNumber(),
            (extraDeposit0 - deposit0) * multiplier0);
          // console.log(tx.receipt.gasUsed);
          return Promise.allNamed({
            hashed0: () => operator.getVehicleEntry(hashed0),
            hashed1: () => operator.getVehicleEntry(hashed1),
            pendingCount01: () => operator.getPendingPaymentCount(booth0, booth1),
            pendingCount02: () => operator.getPendingPaymentCount(booth0, booth2)
        });
        })
        .then(info => {
            assert.strictEqual(info.hashed0[0], vehicle0);
          assert.strictEqual(info.hashed0[1], booth0);
          assert.strictEqual(info.hashed0[2].toNumber(), 0);
          assert.strictEqual(info.hashed1[0], vehicle1);
          assert.strictEqual(info.hashed1[1], booth0);
          assert.strictEqual(info.hashed1[2].toNumber(), 0);
          assert.strictEqual(info.pendingCount01.toNumber(), 0);
          assert.strictEqual(info.pendingCount02.toNumber(), 0);
          return Promise.allNamed({
            operator: () => web3.eth.getBalancePromise(operator.address),
            collected: () => operator.getCollectedFeesAmount(),
            vehicle0: () => web3.eth.getBalancePromise(vehicle0),
            vehicle1: () => web3.eth.getBalancePromise(vehicle1)
        });
        })
        .then(balances => {
            assert.strictEqual(
            balances.operator.toNumber(),
            deposit0 * (multiplier0 + multiplier1));
          assert.strictEqual(balances.collected.toNumber(), deposit0 * (multiplier0 + multiplier1));
          assert.strictEqual(
            balances.vehicle0.toString(10),
            vehicle0InitBal.plus((extraDeposit0 - deposit0) * multiplier0).toString(10));
          assert.strictEqual(
            balances.vehicle1.toString(10),
            vehicle1InitBal.plus((extraDeposit1 - deposit0) * multiplier1).toString(10));
        });
        });
      });
    });
  });
  describe("Withdraw from 2 vehicles", function() {
    const gasPrice = randomIntIn(1, 1000);
    let owner1InitBal;
    beforeEach("should deploy regulator and operator, and enter 2 vehicles", function() {
      return Regulator.new({ from: owner0 })
        .then(instance => regulator = instance)
    .then(() => regulator.setVehicleType(vehicle0, vehicleType0, { from: owner0 }))
    .then(() => regulator.setVehicleType(vehicle1, vehicleType1, { from: owner0 }))
    .then(tx => regulator.createNewOperator(owner1, deposit0, { from: owner0 }))
    .then(tx => operator = TollBoothOperator.at(tx.logs[1].args.newOperator))
    .then(() => operator.addTollBooth(booth0, { from: owner1 }))
    .then(tx => operator.addTollBooth(booth1, { from: owner1 }))
    .then(tx => operator.setMultiplier(vehicleType0, multiplier0, { from: owner1 }))
    .then(tx => operator.setMultiplier(vehicleType1, multiplier1, { from: owner1 }))
    .then(tx => operator.setRoutePrice(booth0, booth1, price01, { from: owner1 }))
    .then(tx => operator.setPaused(false, { from: owner1 }))
    .then(tx => operator.hashSecret(secret0))
    .then(hash => hashed0 = hash)
    .then(tx => operator.hashSecret(secret1))
    .then(hash => hashed1 = hash)
    .then(() => operator.enterRoad(booth0, hashed0, { from: vehicle0, value: deposit0 * multiplier0 }))
    .then(() => operator.enterRoad(booth0, hashed1, { from: vehicle1, value: deposit0 * multiplier1 }))
    .then(tx => web3.eth.getBalancePromise(owner1))
    .then(balance => owner1InitBal = balance);
    });
    it("should be possible to withdraw if second vehicle has exited", function() {
      return operator.reportExitRoad(secret1, { from: booth1 })
        .then(tx => operator.withdrawCollectedFees({ from: owner1, gasPrice: gasPrice }))
    .then(tx => {
        assert.strictEqual(tx.receipt.logs.length, 1);
      assert.strictEqual(tx.logs.length, 1);
      const logFeesCollected = tx.logs[0];
      assert.strictEqual(logFeesCollected.event, "LogFeesCollected");
      assert.strictEqual(logFeesCollected.args.owner, owner1);
      assert.strictEqual(logFeesCollected.args.amount.toNumber(), price01 * multiplier1);
      owner1InitBal = owner1InitBal.minus(tx.receipt.gasUsed * gasPrice);
      return Promise.allNamed({
        contract: () => web3.eth.getBalancePromise(operator.address),
        owner1: () => web3.eth.getBalancePromise(owner1)
    });
    })
    .then(balances => {
        assert.strictEqual(balances.contract.toNumber(), deposit0 * multiplier0);
      assert.strictEqual(
        balances.owner1.toString(10),
        owner1InitBal.plus(price01 * multiplier1).toString(10));
      return operator.getCollectedFeesAmount();
    })
    .then(amount => assert.strictEqual(amount.toNumber(), 0));
    });
  });
  it("should have correct number of functions", function() {
    return TollBoothOperator.new(true, deposit1, owner0, { from: owner0 })
      .then(instance => assert.strictEqual(Object.keys(instance).length, 43));
    // ["constructor","abi","contract","removeTollBooth","setOwner","setPaused","addTollBooth",
    // "setMultiplier","clearSomePendingPayments","reportExitRoad","getRoutePrice","isTollBooth",
    // "hashSecret","getVehicleEntry","getOwner","enterRoad","getCollectedFeesAmount",
    // "getMultiplier","isPaused","getDeposit","getPendingPaymentCount","setRegulator",
    // "withdrawCollectedFees","setRoutePrice","setDeposit","getRegulator","LogRoadEntered",
    // "LogRoadExited","LogPendingPayment","LogFeesCollected","LogRegulatorSet","LogRoutePriceSet",
    // "LogMultiplierSet","LogTollBoothAdded","LogTollBoothRemoved","LogDepositSet","LogPausedSet",
    // "LogOwnerSet","sendTransaction","send","allEvents","address","transactionHash"]
  });
});