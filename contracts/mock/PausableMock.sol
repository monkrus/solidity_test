//Mock data for pausable
pragma solidity ^0.5.0;

import "../interfaces/PausableI.sol";


contract PausableMockContract is PausableI {

    mapping(bool => uint) public counters;



    function PausableMockI(bool paused) PausableI(paused) public {
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
