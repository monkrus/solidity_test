//Mock data for pausable
pragma solidity ^0.5.0;

import "../Pausable.sol";

contract PausableMockContract is Pausable {

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