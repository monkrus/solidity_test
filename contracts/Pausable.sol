pragma solidity ^0.5.1;

import "./Owned.sol";
import "./interfaces/PausableI.sol";


contract Pausable is PausableI, Owned {

  bool paused;

  modifier whenPaused {
    require(paused);
    _;
  }

  modifier whenNotPaused {
    require(!paused);
    _;
  }

  function Pausable(bool isPaused) Owned() public {
    paused = isPaused;
  }

  function setPaused(bool newState) fromOwner public returns (bool success){
    require(newState != paused);

    paused = newState;

    emit LogPausedSet(msg.sender, paused);

    return true;
  }

  function isPaused() view public returns (bool isIndeed){
    return paused;
  }
}