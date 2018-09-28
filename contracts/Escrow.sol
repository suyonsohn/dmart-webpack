pragma solidity ^0.4.24;

contract Escrow {
    address public buyer;
    address public seller;
    address public arbiter;
    address public owner;
    
    uint public productId;
    uint public amount;
    
    uint public approveReleaseFundCount;
    uint public approveRefundCount;
    
    bool public fundDisbursed;
    
    mapping(address => bool) releaseFund;
    mapping(address => bool) refund;
    
    constructor(address _buyer, address _seller, address _arbiter, uint _productId) payable public {
        owner = msg.sender;
        buyer = _buyer;
        seller = _seller;
        arbiter = _arbiter;
        productId = _productId;
        fundDisbursed = false;
        amount = msg.value;
    }
    
    function escrowInfo() view public returns(address, address, address, uint, uint, bool) {
        return (buyer, seller, arbiter, approveReleaseFundCount, approveRefundCount, fundDisbursed);
    }
    
    function releaseFundToSeller(address caller) public {
        require(msg.sender == owner);
        require(fundDisbursed == false);
        if ((caller == buyer || caller == seller || caller == arbiter) && releaseFund[caller] == false) {
            releaseFund[caller] = true;
            approveReleaseFundCount++;
        }
        
        if (approveReleaseFundCount == 2) {
            seller.transfer(amount);
            fundDisbursed = true;
        }
    }
    
    function refundToBuyer(address caller) public {
        require(msg.sender == owner); 
        require(fundDisbursed == false);
        if((caller == buyer || caller == seller || caller == arbiter) && refund[caller] == false) {
            refund[caller] = true;
            approveRefundCount++;
        }
        
        if (approveRefundCount == 2) {
            buyer.transfer(amount);
            fundDisbursed = true;
        }
    }
}