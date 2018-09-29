pragma solidity ^0.4.24;

import 'contracts/Escrow.sol';

contract EStore {
    
    enum ProductCondition {New, Used}
    
    uint public productIndex;

    address public arbiter;
    
    // Look up product by seller's address
    mapping (address => mapping (uint => Product)) stores;
    // Look up seller by product id
    mapping (uint => address) productIdInStore;
    // Look up escrow by product id
    mapping(uint => address) productEscrow;
    
    struct Product {
        uint id;
        string name;
        string category;
        string imageLink;
        string descLink;
        uint createdAt;
        uint price;
        ProductCondition condition;
        address buyer;
    }
    
    constructor(address _arbiter) public {
        productIndex = 0;
        arbiter = _arbiter;
    }

    function addProductToStore(string _name, string _category, string _imageLink, string _descLink, uint _createdAt, uint _price, uint _condition) public {
        productIndex += 1;
        Product memory product = Product(productIndex, _name, _category, _imageLink, _descLink, _createdAt, _price, ProductCondition(_condition), 0);
        stores[msg.sender][productIndex] = product;
        productIdInStore[productIndex] = msg.sender;    
    }
    
    function getProduct(uint _productId) public view returns (uint, string, string, string, string, uint, uint, ProductCondition, address) {
        Product memory product = stores[productIdInStore[_productId]][_productId];
        return (product.id, product.name, product.category, product.imageLink, product.descLink, product.createdAt, product.price, product.condition, product.buyer);
    }

    function buy(uint _productId) payable public {
        // Load product
        Product memory product = stores[productIdInStore[_productId]][_productId];
        // Check if anyone already bought the product
        require(product.buyer == address(0));
        // Check if the buyer sent enough fund
        require(msg.value >= product.price);
        product.buyer = msg.sender;
        // Update stores
        stores[productIdInStore[_productId]][_productId] = product;
        // Call Escrow contract
        Escrow escrow = (new Escrow).value(msg.value)(msg.sender, productIdInStore[_productId], arbiter, _productId);
        productEscrow[_productId] = escrow;
    }

    function getEscrowInfo(uint _productId) view public returns(address, address, address, uint, uint, bool) {
        return Escrow(productEscrow[_productId]).escrowInfo();
    }
}