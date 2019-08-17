pragma solidity ^0.4.2;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/Owned.sol";
import "../contracts/Pausable.sol";
import "../contracts/Regulator.sol";
import "../contracts/DepositHolder.sol";
import "../contracts/MultiplierHolder.sol";
import "../contracts/TollBoothHolder.sol";

contract TestOwnedA {

    uint instanceCount = 6;

    function createInstance(uint index) private returns(OwnedI) {
        if (index == 0) {
            return new Owned();
        } else if (index == 1) {
            return new Pausable(false);
        } else if (index == 2) {
            return new Regulator();
        } else if (index == 3) {
            return new DepositHolder(1);
        } else if (index == 4) {
            return new MultiplierHolder();
        } else if (index == 5) {
            return new TollBoothHolder();
        } else {
            revert();
        }
    }

    function testInitialOwner() public {
        OwnedI owned;
        for(uint index = 0; index < instanceCount; index++) {
            owned = createInstance(index);
            Assert.equal(owned.getOwner(), this, "Should have set owner");
        }
    }

    function testCanChangeOwner() public {
        OwnedI owned;
        for(uint index = 0; index < instanceCount; index++) {
            owned = createInstance(index);
            address newOwner = 0x0123456789abcDEF0123456789abCDef01234567;
            Assert.isTrue(owned.setOwner(newOwner), "Should have changed owner");
            Assert.equal(owned.getOwner(), newOwner, "Should have changed owner");
        }
    }
}
