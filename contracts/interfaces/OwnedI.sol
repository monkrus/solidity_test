/*
1) Modifier fromOwner
2) Defined what is owned
3) Sets owner
3) Gets/read owner
*/

pragma solidity ^0.5.0;

import "../interfaces/OwnedI.sol";


contract OwnedI {

    address currOwner;

    modifier fromOwner {
        require(msg.sender == currOwner);
        _;
    }

    function OwnedBy() public {
        currOwner = msg.sender;
    }

    function setOwner(address newOwner)
    fromOwner
    public
    returns (bool success)
    {
        require(newOwner != 0);
        require(newOwner != currOwner);
        emit LogOwnerSet(currOwner, newOwner);
        currOwner = newOwner;
        return true;
    }


    //Starting with solc 0.4.17, constant is depricated in favor of two new and more specific modifiers.
    function getOwner()
    view
    public
    returns (address owner)
    {
        return currOwner;
    }
}
