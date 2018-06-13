pragma solidity ^0.4.23;


import 'openzeppelin-solidity/contracts/token/ERC20/BurnableToken.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/PausableToken.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol';

contract TestToken is  BurnableToken, PausableToken, MintableToken {
    string public name = "Test Token";
    string public symbol = "TEST";
    uint8 public decimals = 18;
}
