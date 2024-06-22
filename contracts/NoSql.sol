// SPDX-License-Identifier: MIT

import "hardhat/console.sol";

pragma solidity ^0.8.9;

contract NoSql {
  struct Document {
    string key;
    int value;
  }
  mapping(string => Document[]) private documents;

  function _sameString(
    string memory a, 
    string memory b
  ) private pure returns (bool) {
    return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
  }

  function addDoc(
    string memory colName,
    uint index,
    string memory key,
    int value
  ) public {
    if (index == 0) {
      Document memory document = Document(key, value);
      documents[colName].push(document);
    }
  }

  function updateDoc(
    string memory colName,
    string memory key,
    int value
  ) public {
    Document[] storage doc = documents[colName];

    for (uint256 i = 0; i < doc.length; i++) {
      bool checkKey = _sameString(doc[i].key, key);

      if (checkKey) {
        doc[i].value = value;
      }
    } 
  }

  function getDocValue(
    string memory colName,
    string memory key
  ) public view returns (int[] memory values) {
    Document[] storage doc = documents[colName];
    uint256 count = 0;
    for (uint256 i = 0; i < doc.length; i++) {
      if (_sameString(doc[i].key, key)) {
        count++;
      }
    }

    values = new int[](count);
    uint256 index = 0;

    for (uint256 i = 0; i < doc.length; i++) {
      if (_sameString(doc[i].key, key)) {
        values[index] = doc[i].value;
        index++;
      }
    }

    return values;
  }

    function getDocValueIndex(
    string memory colName,
    string memory key,
    uint indexValue
  ) public view returns (int values) {
    return getDocValue(colName, key)[indexValue];
  }

  function delDoc(
    string memory colName, 
    string memory key
  ) public {
    Document[] storage doc = documents[colName];
    uint256 i = 0;

    while (i < doc.length) {
      if (_sameString(doc[i].key, key)) {
        if (i != doc.length - 1) {
          doc[i] = doc[doc.length - 1];
        }
        doc.pop();
      } 
      else {
        i++;
      }
    }
  }

  function getCol(string memory colName) public view returns(Document[] memory) {
    return documents[colName];
  }

  function len(string memory colName) public view returns(uint256) {
    return documents[colName].length;
  }


}