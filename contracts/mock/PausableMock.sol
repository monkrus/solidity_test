pragma solidity ^0.5.1;

import "../Pausable.sol";

contract PausableMock is Pausable {

    mapping(bool => uint) public counters;

    function PausableMock(bool paused) Pausable(paused) public {
    }

    function countUpWhenPaused()
        whenPaused public {
        counters[isPaused()]++;
    }

    function countUpWhenNotPaused()
        whenNotPaused public {
        counters[isPaused()]++;
    }
}