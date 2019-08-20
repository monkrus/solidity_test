/*
1) Call MultiplierHolder function
2) Sets multiplier
3) Gets/read multiplier
*/

pragma solidity ^0.5.0;

import "./Owned.sol";
import "./interfaces/MultiplierHolderI.sol";


contract MultiplierHolderContract is MultiplierHolderI, Owned {
    mapping(uint => uint) vehicleTypesMap;

    function MultiplierHolder()  public {}

    function setMultiplier(uint vehicleType, uint multiplier) fromOwner public returns(bool success){
        require(vehicleType != 0);
        require(vehicleTypesMap[vehicleType] != multiplier);
        vehicleTypesMap[vehicleType] = multiplier;
        emit LogMultiplierSet(msg.sender, vehicleType, multiplier);
        return true;
    }

    function getMultiplier(uint vehicleType) view public returns(uint multiplier){
        return vehicleTypesMap[vehicleType];
    }
}