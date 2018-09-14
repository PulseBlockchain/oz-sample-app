pragma solidity ^0.4.23;

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';
import './ECRecovery.sol';

contract TestPlatform is Ownable {

    ERC20 public testToken;


    constructor(ERC20 _testToken) Ownable() public {
        testToken = _testToken;
    }


    using ECRecovery for bytes32;
    function recover(bytes32 hash, bytes sig) public pure returns (address) {
        return hash.recover(sig);
    }

    event DebugEvent(string _message, uint256 _value);
    event DebugEventAddress(string _message, address _sender);

    function sendBid(address _bidder, uint256 bidCost, bytes32 _bidHash,bytes _signedBidMessage)  external returns (bool success) {
        require(_bidHash.recover(_signedBidMessage) == _bidder);
        require(testToken.balanceOf(_bidder) > bidCost);
        address me = address(this);
        uint256 allowance = testToken.allowance(_bidder, me);
        require(allowance > bidCost);
        emit DebugEvent("Sender Sender Allowance is", allowance);
        //TODO: this is throwing a revert even if caller has allowance
        testToken.transferFrom(_bidder, me, bidCost);
        testToken.transfer(msg.sender,bidCost);
        return true;
    }


}
