
/*
1) Defines deposit hoolder
2) Sets deposit
3) Gets/read deposit
*/
pragma solidity ^0.5.0;

import "./Owned.sol";
import "./interfaces/DepositHolderI.sol";

contract DepositHolderContract is DepositHolderI, Owned {

    uint deposit;

        function DepositHolder(uint depositWeis) public {
        require(depositWeis > 0);
        deposit = depositWeis;
    }

    function setDeposit(uint depositWeis) fromOwner public returns(bool _success){
        require(depositWeis != 0);
        require(depositWeis != deposit);
        deposit = depositWeis;
        emit LogDepositSet(msg.sender, deposit);
        return true;
    }

    function getDeposit() view public returns(uint depositWeis){
        return deposit;
    }
}