// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "../Calendar.sol";

library Library {
  function compareString(string memory a, string memory b) public pure returns(bool) {
    return keccak256(abi.encodePacked(a))  == keccak256(abi.encodePacked(b));
  }

  function getLengthOfEventStore(Calendar.EventStore[] storage eventStores) public view returns(uint256) {
    return eventStores.length;
  }

  function getLengthOfString(string memory str) public pure returns (uint256) {
    bytes memory stringBytes = bytes(str);
    return stringBytes.length;
  }
}