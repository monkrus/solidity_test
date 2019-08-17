pragma solidity ^0.5.1;
import "./Owned.sol";
import "./Pausable.sol";
import "./Regulated.sol";
import "./DepositHolder.sol";
import "./TollBoothHolder.sol";
import "./RoutePriceHolder.sol";
import "./MultiplierHolder.sol";
import "./interfaces/TollBoothOperatorI.sol";

contract TollBoothOperator is TollBoothOperatorI, Owned, Pausable, Regulated, DepositHolder, MultiplierHolder, RoutePriceHolder {

  uint collectedFees;

  struct DriverInfo {
    address car;
    address entryBooth;
    uint256 deposit;
  }



  mapping(bytes32 => DriverInfo) driversMap;
  mapping(bytes32 => bytes32[]) pendingPayments;
  mapping(address => uint) cashBack;

//Defining constructors as functions with the same name as the contract is deprecated. But i have problems in vagrant if tried to use "constructor" instead of function
  function TollBoothOperator(bool isPaused, uint depositWeis, address regulator) Pausable(isPaused) Regulated(regulator) DepositHolder(depositWeis) public {}

  //better view, but the interface already used constant
  function hashSecret(bytes32 secret)
  view
  public
  returns (bytes32 hashedSecret)
  {
    return keccak256(secret);
  }

  function enterRoad(address entryBooth, bytes32 exitSecretHashed) whenNotPaused public payable returns (bool success){

    require(isTollBooth(entryBooth));
    uint vehicleType = getRegulator().getVehicleType(msg.sender);
    require(vehicleType != 0);
    require(driversMap[exitSecretHashed].entryBooth != msg.sender);
    require(msg.value >= getMultiplier(vehicleType) * getDeposit());
    require(driversMap[exitSecretHashed].car == 0);
    driversMap[exitSecretHashed] = DriverInfo({
      car : msg.sender,
      entryBooth : entryBooth,
      deposit : msg.value
      });
    emit LogRoadEntered(msg.sender, entryBooth, exitSecretHashed, msg.value);
    return true;
  }

  function reportExitRoad(bytes32 exitSecretClear)
  whenNotPaused
  public
  returns (uint status)
  {
    require(isTollBooth(msg.sender));
    bytes32 driveKey = hashSecret(exitSecretClear);
    DriverInfo storage tempInfo = driversMap[driveKey];
    require(tempInfo.entryBooth != msg.sender);
    require(tempInfo.deposit != 0);
    uint routePrice = getRoutePrice(tempInfo.entryBooth, msg.sender);

    if (routePrice > 0) {
      uint finalPrice = routePrice * getMultiplier(getRegulator().getVehicleType(tempInfo.car));
      uint tempCashBack;
      if (tempInfo.deposit >= finalPrice) {

        tempCashBack = tempInfo.deposit - finalPrice;
        collectedFees += finalPrice;
      } else {
        finalPrice = tempInfo.deposit;
        collectedFees += finalPrice;
      }
      driversMap[driveKey].deposit = 0;
      if (tempCashBack > 0) {
        tempInfo.car.transfer(tempCashBack);
      }
      emit LogRoadExited(msg.sender, driveKey, finalPrice, tempCashBack);
      return 1;
    }
    else {
      pendingPayments[keccak256(tempInfo.entryBooth, msg.sender)].push(driveKey);
      emit LogPendingPayment(driveKey, tempInfo.entryBooth, msg.sender);
      return 2;
    }
  }

  function clearSomePendingPayments(
    address entryBooth,
    address exitBooth,
    uint count
  )
  whenNotPaused
  public
  returns (bool _success)
  {
    require(count != 0);
    require(isTollBooth(entryBooth));
    require(isTollBooth(exitBooth));
    uint routePrice = getRoutePrice(entryBooth, exitBooth);
    require(routePrice != 0);
    bytes32 tempHash = keccak256(entryBooth, exitBooth);
    bytes32[] storage tempPayment = pendingPayments[tempHash];
    uint unsolvedPaymentsCount = getPendingPaymentCount(entryBooth, exitBooth);
    require(count <= unsolvedPaymentsCount);
    for (uint i = 0; i < count; i++) {
      bytes32 hashedSecret = tempPayment[0];
      DriverInfo storage tempInfo = driversMap[hashedSecret];
      uint tempCashBack;
      uint finalFee = routePrice * getMultiplier(getRegulator().getVehicleType(tempInfo.car));

      if (tempInfo.deposit > finalFee) {
        tempCashBack = tempInfo.deposit - finalFee;
      } else {
        finalFee = tempInfo.deposit;
      }

      collectedFees += finalFee;
      driversMap[hashedSecret].deposit = 0;
      emit LogRoadExited(
      exitBooth,
      hashedSecret,
      finalFee,
      tempCashBack
      );
      if (tempCashBack > 0) {
        tempInfo.car.transfer(tempCashBack);
      }
    }
    tempPayment[0] = tempPayment[tempPayment.length - 1];
    delete tempPayment[tempPayment.length - 1];
    tempPayment.length--;
    pendingPayments[tempHash] = tempPayment;
    return true;
  }

  function withdrawCollectedFees()
  fromOwner
  public
  returns (bool success)
  {
    require(collectedFees > 0);
    address owner = getOwner();
    emit LogFeesCollected(owner, collectedFees);
    owner.transfer(collectedFees);
    collectedFees = 0;
    return true;
  }

  function setRoutePrice(
    address entryBooth,
    address exitBooth,
    uint priceWeis)
  public
  returns (bool success){
    super.setRoutePrice(entryBooth, exitBooth, priceWeis);
    if (getPendingPaymentCount(entryBooth, exitBooth) == 0) {
      return true;
    } else {
      clearSomePendingPayments(entryBooth, exitBooth, 1);
      return true;
    }
  }


  function getVehicleEntry(bytes32 exitSecretHashed)
 view
  public
  returns (
    address vehicle,
    address entryBooth,
    uint depositedWeis
  )
  {
    DriverInfo storage tempInf = driversMap[exitSecretHashed];
    return (tempInf.car, tempInf.entryBooth, tempInf.deposit);
  }

  function getPendingPaymentCount(address entryBooth, address exitBooth)
view
  public
  returns (uint count)
  {
    bytes32[] storage tempPayment = pendingPayments[keccak256(entryBooth, exitBooth)];
    return tempPayment.length;
  }

  function getCollectedFeesAmount()
  view
  public
  returns (uint amount)
  {
    return collectedFees;
  }
}