pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';


contract TestEscrow is Ownable {
    bytes12 public birId;
    address public buyer;
    ERC20 public testToken;

    event CreateEscrow(bytes12 _birId, address _buyer);
    event EscrowDistributed(bytes12 _birId);

    constructor(bytes12 _birId, address _buyer, ERC20 _testToken)  Ownable() public {
        birId = _birId;
        buyer = _buyer;
        testToken = _testToken;
        emit CreateEscrow(_birId, _buyer);
    }

    function info() external view returns  (bytes12, address) {
        return (birId, buyer);
    }

    function distributeFunds(address [] _payees, uint256[] _payments, uint256 _buyerPayment)
            public returns (bool success) {
        require(_payees.length < 10, "Too many payess");
        require(_payments.length < 10, "Too many payments");
        for (uint i = 1; i < _payees.length; i++) {
            testToken.transfer(_payees[i],_payments[i]);
        }
        testToken.transfer(buyer,_buyerPayment);
        emit EscrowDistributed(birId);
        return true;
    }

}
