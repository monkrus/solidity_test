/*
1) Calls routePriceholder
2) Sets route price
3) Gets/reads route price
*/


pragma solidity ^0.5.0;

import "./TollBoothHolder.sol";
import "./interfaces/RoutePriceHolderI.sol";


contract RoutePriceHolderContract is RoutePriceHolderI, Owned, TollBoothHolder {

    mapping(address => mapping(address => uint)) routeMap;

    function RoutePriceHolder() public {}

    function setRoutePrice(address entryBooth, address exitBooth, uint priceWeis) fromOwner   public returns(bool success){
        require(entryBooth != exitBooth);
        require(entryBooth != 0 && exitBooth != 0);
        require(isTollBooth(entryBooth) && isTollBooth(exitBooth));
        require(routeMap[entryBooth][exitBooth] != priceWeis);
        routeMap[entryBooth][exitBooth] = priceWeis;
        emit  LogRoutePriceSet(msg.sender, entryBooth, exitBooth, priceWeis);
        return true;
    }

    function getRoutePrice(address entryBooth, address exitBooth) view public returns(uint priceWeis){
        return routeMap[entryBooth][exitBooth];
    }

}