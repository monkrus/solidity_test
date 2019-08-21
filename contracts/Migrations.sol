/*
1) function migration????
2) Checks for migration completion
3) Checks for migration upgrade
*/

pragma solidity ^0.5.0;

contract Migrations {
    address public owner;
    uint public last_completed_migration;
    modifier restricted() {
        if (msg.sender == owner) _;
    }
    function Migration() public {
        owner = msg.sender;
    }

    function setCompleted(uint completed) restricted public {
        last_completed_migration = completed;
    }

    function upgrade(address new_address) restricted public {
        Migrations upgraded = Migrations(new_address);
        upgraded.setCompleted(last_completed_migration);
    }
}
