const expectedExceptionPromise = require("../utils/expectedException.js");
web3.eth.getTransactionReceiptMined = require("../utils/getTransactionReceiptMined.js");
Promise = require("bluebird");
Promise.allNamed = require("../utils/sequentialPromiseNamed.js");
const randomIntIn = require("../utils/randomIntIn.js");
const toBytes32 = require("../utils/toBytes32.js");

if (typeof web3.eth.getAccountsPromise === "undefined") {
  Promise.promisifyAll(web3.eth, { suffix: "Promise" });
}

const Regulator = artifacts.require("./Regulator.sol");
const TollBoothOperator = artifacts.require("./TollBoothOperator.sol");

contract('TollBoothOperator', function(accounts) {



  const deposit = 10;
  const vehicleType1 = 1;
  const multiplier1 = 1;
  let tempBalance;

  const vehicle1Secret = toBytes32(3);
  const vehicle2Secret = toBytes32(4);
  let hash1;
  let hash2;
  let owner1 = accounts[0];
  let owner2 = accounts[1];
  let booth1 = accounts[2];
  let booth2 = accounts[3];
  let vehicle1 = accounts[4];
  let vehicle2 = accounts[5];




  describe("Vehicle Operations", function() {

    beforeEach("Regulator & Operator init", function() {
      return Regulator.new({ from: owner1 })
        .then(instance => regulator = instance)
    .then(() => regulator.setVehicleType(vehicle1, vehicleType1, { from: owner1 }))
    .then(() => regulator.setVehicleType(vehicle2, vehicleType1, { from: owner1 }))
    .then(tx => regulator.createNewOperator(owner2, 10, { from: owner1 }))
    .then(tx => operator = TollBoothOperator.at(tx.logs[1].args.newOperator))
    .then(() => operator.addTollBooth(booth1, { from: owner2 }))
    .then(tx => operator.addTollBooth(booth2, { from: owner2 }))
    .then(tx => operator.setMultiplier(vehicleType1, multiplier1, { from: owner2 }))
    .then(tx => operator.setPaused(false, { from: owner2 }))
    .then(tx => operator.hashSecret(vehicle1Secret))
    .then(hash => hash1 = hash)
    .then(tx => operator.hashSecret(vehicle2Secret))
    .then(hash => hash2 = hash)
    });

    describe("Scenario №1", function () {
      it('price equal to deposited', function () {

            routePrice= 10;
            finalPrice= 10;
            cashBack= 0;


      return operator.setRoutePrice(booth1, booth2, routePrice, {from: owner2})
      .then(() => operator.enterRoad(
          booth1, hash1, {from: vehicle1, value: deposit}))
      .then(tx => {
          const logEntered = tx.logs[0];
        assert.strictEqual(logEntered.event, "LogRoadEntered");
        assert.strictEqual(logEntered.args.vehicle, vehicle1);
        assert.strictEqual(logEntered.args.entryBooth, booth1);
        assert.strictEqual(logEntered.args.exitSecretHashed, hash1);
        assert.strictEqual(logEntered.args.depositedWeis.toNumber(), deposit);
        return web3.eth.getBalancePromise(vehicle1);
      })
      .then(balance => {
          tempBalance = balance
          return operator.reportExitRoad(vehicle1Secret, {from: booth2});
      })
      .then(tx => {
          assert.strictEqual(tx.receipt.logs.length, 1);
        assert.strictEqual(tx.logs.length, 1);
        const logEntered = tx.logs[0];
        assert.strictEqual(logEntered.event, "LogRoadExited");
        assert.strictEqual(logEntered.args.exitBooth, booth2);
        assert.strictEqual(logEntered.args.finalFee.toNumber(), finalPrice);
        assert.strictEqual(logEntered.args.exitSecretHashed, hash1);
        assert.strictEqual(logEntered.args.refundWeis.toNumber(), cashBack);
        return operator.getCollectedFeesAmount();
      })
      .then(collectedAmount =>  {
          assert.strictEqual(collectedAmount.toNumber(), finalPrice);
        return web3.eth.getBalancePromise(vehicle1);
      })
      .then(balance => assert.strictEqual(balance.toString(10), tempBalance.add(cashBack).toString(10)))
      });
    });
    describe("Scenario №2", function () {
      it('price more than the deposit', function () {
            vehicleDeposit= 10;
            routePrice =15;
            finalPrice= 10;
            cashBack= 0;

        return operator.enterRoad.call(
          booth1, hash1, {from: vehicle1, value: vehicleDeposit})
          .then(success => assert.isTrue(success))
      .then(tx => operator.setRoutePrice(booth1, booth2, routePrice, {from: owner2}))
      .then(() => operator.enterRoad(
          booth1, hash1, {from: vehicle1, value: vehicleDeposit}))//enter road
      .then(tx => {
          const logEntered = tx.logs[0];
        assert.strictEqual(logEntered.event, "LogRoadEntered");
        assert.strictEqual(logEntered.args.vehicle, vehicle1);
        assert.strictEqual(logEntered.args.entryBooth, booth1);
        assert.strictEqual(logEntered.args.exitSecretHashed, hash1);
        assert.strictEqual(logEntered.args.depositedWeis.toNumber(), vehicleDeposit);
        return web3.eth.getBalancePromise(vehicle1);
      })
      .then(balance => {
          tempBalance = balance
          return operator.reportExitRoad(vehicle1Secret, {from: booth2});
      })
      .then(tx => {
          assert.strictEqual(tx.receipt.logs.length, 1);
        assert.strictEqual(tx.logs.length, 1);
        const logEntered = tx.logs[0];
        assert.strictEqual(logEntered.event, "LogRoadExited");
        assert.strictEqual(logEntered.args.exitBooth, booth2);
        assert.strictEqual(logEntered.args.finalFee.toNumber(), finalPrice);
        assert.strictEqual(logEntered.args.exitSecretHashed, hash1);
        assert.strictEqual(logEntered.args.refundWeis.toNumber(), cashBack);
        return operator.getCollectedFeesAmount(); //check fee
      })
      .then(collectedAmount =>  {
          assert.strictEqual(collectedAmount.toNumber(), finalPrice);
        return web3.eth.getBalancePromise(vehicle1);
      })
      .then(balance => assert.strictEqual(balance.toString(10), tempBalance.add(cashBack).toString(10)))
      });
    });
    describe("Scenario №3", function () {
      it(' price less than the deposit', function () {
        vehicleDeposit= 10;
        routePrice =6;
        finalPrice= 6;
        cashBack= 4;

        return operator.enterRoad.call(
          booth1, hash1, {from: vehicle1, value: vehicleDeposit})
          .then(success => assert.isTrue(success))
      .then(tx => operator.setRoutePrice(booth1, booth2, routePrice, {from: owner2}))
      .then(() => operator.enterRoad(
          booth1, hash1, {from: vehicle1, value: vehicleDeposit}))
      .then(tx => {
          const logEntered = tx.logs[0];
        assert.strictEqual(logEntered.event, "LogRoadEntered");
        assert.strictEqual(logEntered.args.vehicle, vehicle1);
        assert.strictEqual(logEntered.args.entryBooth, booth1);
        assert.strictEqual(logEntered.args.exitSecretHashed, hash1);
        assert.strictEqual(logEntered.args.depositedWeis.toNumber(), vehicleDeposit);
        return web3.eth.getBalancePromise(vehicle1);
      })
      .then(balance => {
          tempBalance = balance
          return operator.reportExitRoad(vehicle1Secret, {from: booth2});
      })
      .then(tx => {
          assert.strictEqual(tx.receipt.logs.length, 1);
        assert.strictEqual(tx.logs.length, 1);
        const logEntered = tx.logs[0];
        assert.strictEqual(logEntered.event, "LogRoadExited");
        assert.strictEqual(logEntered.args.exitBooth, booth2);
        assert.strictEqual(logEntered.args.finalFee.toNumber(), finalPrice);
        assert.strictEqual(logEntered.args.exitSecretHashed, hash1);
        assert.strictEqual(logEntered.args.refundWeis.toNumber(), cashBack);
        return operator.getCollectedFeesAmount(); //check fee
      })
      .then(collectedAmount =>  {
          assert.strictEqual(collectedAmount.toNumber(), finalPrice);
        return web3.eth.getBalancePromise(vehicle1);
      })
      .then(balance => assert.strictEqual(balance.toString(10), tempBalance.add(cashBack).toString(10)))
      });
    });
    describe("Scenario №4", function () {
      it(' price equal the deposit', function () {
        let currDeposit= 14;
        let routePrice= 10;
        let finalPrice= 10;
        let cashBack= 4;

        return operator.enterRoad.call(
          booth1, hash1, {from: vehicle1, value: currDeposit})
          .then(success => assert.isTrue(success))
      .then(tx => operator.setRoutePrice(booth1, booth2, routePrice, {from: owner2}))
      .then(() => operator.enterRoad(
          booth1, hash1, {from: vehicle1, value: currDeposit}))
      .then(tx => {
          const logEntered = tx.logs[0];
        assert.strictEqual(logEntered.event, "LogRoadEntered");
        assert.strictEqual(logEntered.args.vehicle, vehicle1);
        assert.strictEqual(logEntered.args.entryBooth, booth1);
        assert.strictEqual(logEntered.args.exitSecretHashed, hash1);
        assert.strictEqual(logEntered.args.depositedWeis.toNumber(), currDeposit);
        return web3.eth.getBalancePromise(vehicle1);
      })
      .then(balance => {
          tempBalance = balance
          return operator.reportExitRoad(vehicle1Secret, {from: booth2});
      })
      .then(tx => {
          assert.strictEqual(tx.receipt.logs.length, 1);
        assert.strictEqual(tx.logs.length, 1);
        const logEntered = tx.logs[0];
        assert.strictEqual(logEntered.event, "LogRoadExited");
        assert.strictEqual(logEntered.args.exitBooth, booth2);
        assert.strictEqual(logEntered.args.finalFee.toNumber(), finalPrice);
        assert.strictEqual(logEntered.args.exitSecretHashed, hash1);
        assert.strictEqual(logEntered.args.refundWeis.toNumber(), cashBack);
        return operator.getCollectedFeesAmount(); //check fee
      })
      .then(collectedAmount =>  {
          assert.strictEqual(collectedAmount.toNumber(), finalPrice);
        return web3.eth.getBalancePromise(vehicle1);
      })
      .then(balance => assert.strictEqual(balance.toString(10), tempBalance.add(cashBack).toString(10)))
      });
    });

    describe("Scenario №5", function () {
      it('firstRoad price less than the deposited, second unknown', function () {
        let currDeposit = 14;
        let routePrice= 11;
        let cashBack= 3;
        return operator.enterRoad(
          booth1, hash1, {from: vehicle1, value: currDeposit})
          .then(tx => web3.eth.getBalancePromise(vehicle1))
      .then(balance => {
          tempBalance = balance;
        return operator.reportExitRoad(vehicle1Secret, {from: booth2});
      })
      .then(tx => {
          assert.strictEqual(tx.receipt.logs.length, 1);
        assert.strictEqual(tx.logs.length, 1);
        const logEntered = tx.logs[0];
        assert.strictEqual(logEntered.event, "LogPendingPayment");
        assert.strictEqual(logEntered.args.entryBooth, booth1);
        assert.strictEqual(logEntered.args.exitBooth, booth2);
        assert.strictEqual(logEntered.args.exitSecretHashed, hash1);
        return operator.getPendingPaymentCount(booth1, booth2);
      })
      .then(count => {
          assert.strictEqual(count.toNumber(), 1);
        return operator.setRoutePrice(booth1, booth2, routePrice, {from: owner2});
      })
      .then(tx => {
          assert.strictEqual(tx.receipt.logs.length, 2);
        assert.strictEqual(tx.logs.length, 2);

        assert.strictEqual(tx.logs[0].event, "LogRoutePriceSet");
        const logEntered = tx.logs[1];
        assert.strictEqual(logEntered.event, "LogRoadExited");
        assert.strictEqual(logEntered.args.exitBooth, booth2);
        assert.strictEqual(logEntered.args.finalFee.toNumber(), routePrice);
        assert.strictEqual(logEntered.args.exitSecretHashed, hash1);
        assert.strictEqual(logEntered.args.refundWeis.toNumber(), cashBack);
        return Promise.allNamed({
          pendingAmount: () =>  operator.getPendingPaymentCount(booth1, booth2),
          collectedAmount: () => operator.getCollectedFeesAmount.call(),
          balanceAmount: () => web3.eth.getBalancePromise(vehicle1),
      })}).then(balances => {

        assert.strictEqual(balances.pendingAmount.toNumber(), 0);
        assert.strictEqual(balances.collectedAmount.toNumber(), routePrice);
        assert.strictEqual(balances.balanceAmount.toString(10), tempBalance.add(cashBack).toString(10));

      })

      })
    });

      describe("Scenario №6", function () {
    it(`2 vehicles enter the 2 roads, first price less then deposited; second - unknown`, function () {
      let currDeposit = 14;
      let driver = accounts[6];
      let secondTempBalance;
      let finalPrice = 6;

      return operator.enterRoad(booth1, hash1, {from: vehicle1, value: currDeposit})
        .then(tx => web3.eth.getBalancePromise(vehicle1))
    .then(balance => {
        tempBalance = balance;
      return operator.reportExitRoad(vehicle1Secret, {from: booth2});
    })
    .then(tx => operator.enterRoad(booth1, hash2, {from: vehicle2, value: deposit}))
    .then(tx => web3.eth.getBalancePromise(vehicle2))
    .then(balance => {
        secondTempBalance = balance;
      return operator.reportExitRoad(vehicle2Secret, {from: booth2});
    })
    .then(tx => operator.getPendingPaymentCount(booth1, booth2))
    .then(count => {
        assert.strictEqual(count.toNumber(), 2);
      return operator.setRoutePrice(booth1, booth2, finalPrice, {from: owner2});
    })
    .then(tx => operator.getCollectedFeesAmount())
    .then(collectedAmount =>  {
        assert.strictEqual(collectedAmount.toNumber(), finalPrice);
      return operator.getPendingPaymentCount(booth1, booth2);
    })
    .then(count => {
        assert.strictEqual(count.toNumber(), 1);
      return operator.clearSomePendingPayments(booth1, booth2, 1, {from: driver});
    })
    .then(tx => {
        assert.strictEqual(tx.receipt.logs.length, 1);
      assert.strictEqual(tx.logs.length, 1);

      const logEntered = tx.logs[0];
      assert.strictEqual(logEntered.event, "LogRoadExited");
      assert.strictEqual(logEntered.args.exitBooth, booth2);
      assert.strictEqual(logEntered.args.finalFee.toNumber(), finalPrice);
      assert.strictEqual(logEntered.args.exitSecretHashed, hash2);
      assert.strictEqual(logEntered.args.refundWeis.toNumber(), 4);

      return Promise.allNamed({
        collectedAmount: () =>  operator.getCollectedFeesAmount(),
        balanceFistAmount: () => web3.eth.getBalancePromise(vehicle1),
        balanceSecondAmount:()=> web3.eth.getBalancePromise(vehicle2),
    })}).then(balances => {
        assert.strictEqual(balances.collectedAmount.toNumber(), finalPrice * 2);
        assert.strictEqual(balances.balanceFistAmount.toString(10), tempBalance.add(currDeposit - finalPrice).toString(10));

      assert.strictEqual(balances.balanceSecondAmount.toString(10), secondTempBalance.add(deposit - finalPrice).toString(10));
      })

      });

    });

  });

});
