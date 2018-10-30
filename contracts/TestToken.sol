pragma solidity ^0.4.24;


import 'openzeppelin-solidity/contracts/token/ERC20/ERC20Burnable.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20Pausable.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol';
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract TestToken is  ERC20Burnable, ERC20Pausable, ERC20Mintable, Ownable {
    string public name = "Test Token";
    string public symbol = "TEST";
    uint8 public decimals = 18;
}
