pragma solidity ^0.5.1;

import "./Owned.sol";
import "./TollBoothOperator.sol";
import "./interfaces/TollBoothOperatorI.sol";
import "./interfaces/RegulatorI.sol";




contract Regulator is RegulatorI, Owned {

  mapping(address => uint) vehicleTypes;
  mapping(address => bool) operatorsMap;

  function Regulator () public {
    currOwner = msg.sender;
  }

  function setVehicleType(address vehicle, uint vehicleType) fromOwner public returns(bool success){
    require(vehicle != 0);
    require(vehicleTypes[vehicle] != vehicleType);
    vehicleTypes[vehicle] = vehicleType;
    emit LogVehicleTypeSet(msg.sender, vehicle, vehicleType);

    return true;
  }

  //better view, but the interface already used constant
  function getVehicleType(address vehicle) constant public returns(uint vehicleType){
    return vehicleTypes[vehicle];
  }

  function createNewOperator(address owner, uint deposit)  public returns(TollBoothOperatorI newOperator){
    //It should roll back if the rightful owner argument is the current owner of the regulator.
    require(owner!=getOwner());
    TollBoothOperator operator = new TollBoothOperator(true, deposit, address(this));
    operator.setOwner(owner);
    operatorsMap[address(operator)] = true;
    emit LogTollBoothOperatorCreated(msg.sender, address(operator), owner, deposit);
    return operator;
  }

  function removeOperator(address operator) fromOwner public returns(bool success){
    require(operatorsMap[operator]);
    operatorsMap[operator] = false;
    emit LogTollBoothOperatorRemoved(msg.sender, operator);
    return true;
  }



  function isOperator(address operator) constant public returns(bool indeed){
    return operatorsMap[operator];
  }

}
© 2019 GitHub, Inc.