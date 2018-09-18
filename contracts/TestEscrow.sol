pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";




contract TestEscrow is Ownable {
    bytes12 public birId;
    address public buyer;

    event CreateEscrow(bytes12 _birId, address _buyer);

    constructor(bytes12 _birId, address _buyer)  Ownable() public {
        birId = _birId;
        buyer = _buyer;
        emit CreateEscrow(_birId, _buyer);
    }

    function info() external view returns  (bytes12, address) {
        return (birId, buyer);
    }


}
