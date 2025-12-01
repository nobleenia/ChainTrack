// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ProductRegistry
 * @dev Smart contract for registering and tracking products on the blockchain
 * @author ChainTrack Team
 */
contract ProductRegistry is Ownable, ReentrancyGuard {
    
    // ============ Structs ============
    
    struct Product {
        bytes32 productHash;        // SHA256 hash of product data
        address manufacturer;       // Address of the manufacturer
        uint256 registeredAt;       // Timestamp of registration
        bool isRegistered;          // Registration status
        uint256 transferCount;      // Number of transfers
    }
    
    struct TransferRecord {
        address from;               // Sender address
        address to;                 // Receiver address
        string transferType;        // Type of transfer (shipped, received, etc.)
        string location;            // Current location
        uint256 timestamp;          // Transfer timestamp
        bytes32 previousHash;       // Hash of previous transfer (chain integrity)
    }
    
    // ============ State Variables ============
    
    // Mapping from product ID to Product
    mapping(string => Product) public products;
    
    // Mapping from product ID to array of transfers
    mapping(string => TransferRecord[]) public productTransfers;
    
    // Mapping of authorized manufacturers
    mapping(address => bool) public authorizedManufacturers;
    
    // Total products registered
    uint256 public totalProducts;
    
    // Total transfers recorded
    uint256 public totalTransfers;
    
    // ============ Events ============
    
    event ProductRegistered(
        string indexed productId,
        bytes32 productHash,
        address indexed manufacturer,
        uint256 timestamp
    );
    
    event ProductTransferred(
        string indexed productId,
        address indexed from,
        address indexed to,
        string transferType,
        string location,
        uint256 timestamp
    );
    
    event ManufacturerAuthorized(address indexed manufacturer);
    event ManufacturerRevoked(address indexed manufacturer);
    
    // ============ Modifiers ============
    
    modifier onlyAuthorizedManufacturer() {
        require(
            authorizedManufacturers[msg.sender] || msg.sender == owner(),
            "Not an authorized manufacturer"
        );
        _;
    }
    
    modifier productExists(string memory productId) {
        require(products[productId].isRegistered, "Product not registered");
        _;
    }
    
    modifier productNotExists(string memory productId) {
        require(!products[productId].isRegistered, "Product already registered");
        _;
    }
    
    // ============ Constructor ============
    
    constructor() Ownable(msg.sender) {
        // Owner is automatically an authorized manufacturer
        authorizedManufacturers[msg.sender] = true;
    }
    
    // ============ External Functions ============
    
    /**
     * @dev Register a new product on the blockchain
     * @param productId Unique identifier for the product
     * @param productHash SHA256 hash of product data
     */
    function registerProduct(
        string calldata productId,
        bytes32 productHash
    ) external onlyAuthorizedManufacturer productNotExists(productId) nonReentrant {
        products[productId] = Product({
            productHash: productHash,
            manufacturer: msg.sender,
            registeredAt: block.timestamp,
            isRegistered: true,
            transferCount: 0
        });
        
        totalProducts++;
        
        emit ProductRegistered(productId, productHash, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Record a product transfer on the blockchain
     * @param productId Unique identifier for the product
     * @param to Address of the receiver
     * @param transferType Type of transfer
     * @param location Current location
     */
    function recordTransfer(
        string calldata productId,
        address to,
        string calldata transferType,
        string calldata location
    ) external productExists(productId) nonReentrant {
        require(to != address(0), "Invalid receiver address");
        
        // Get previous hash for chain integrity
        bytes32 previousHash;
        TransferRecord[] storage transfers = productTransfers[productId];
        
        if (transfers.length > 0) {
            TransferRecord storage lastTransfer = transfers[transfers.length - 1];
            previousHash = keccak256(
                abi.encodePacked(
                    lastTransfer.from,
                    lastTransfer.to,
                    lastTransfer.timestamp
                )
            );
        } else {
            previousHash = products[productId].productHash;
        }
        
        // Record the transfer
        transfers.push(TransferRecord({
            from: msg.sender,
            to: to,
            transferType: transferType,
            location: location,
            timestamp: block.timestamp,
            previousHash: previousHash
        }));
        
        products[productId].transferCount++;
        totalTransfers++;
        
        emit ProductTransferred(
            productId,
            msg.sender,
            to,
            transferType,
            location,
            block.timestamp
        );
    }
    
    /**
     * @dev Verify a product's authenticity
     * @param productId Unique identifier for the product
     * @return isAuthentic Whether the product is registered
     * @return product The product details
     */
    function verifyProduct(string calldata productId) 
        external 
        view 
        returns (bool isAuthentic, Product memory product) 
    {
        product = products[productId];
        isAuthentic = product.isRegistered;
        return (isAuthentic, product);
    }
    
    /**
     * @dev Get all transfers for a product
     * @param productId Unique identifier for the product
     * @return Array of transfer records
     */
    function getProductTransfers(string calldata productId)
        external
        view
        productExists(productId)
        returns (TransferRecord[] memory)
    {
        return productTransfers[productId];
    }
    
    /**
     * @dev Get transfer count for a product
     * @param productId Unique identifier for the product
     * @return Number of transfers
     */
    function getTransferCount(string calldata productId)
        external
        view
        productExists(productId)
        returns (uint256)
    {
        return productTransfers[productId].length;
    }
    
    /**
     * @dev Verify chain integrity for a product
     * @param productId Unique identifier for the product
     * @return isValid Whether the transfer chain is valid
     */
    function verifyChainIntegrity(string calldata productId)
        external
        view
        productExists(productId)
        returns (bool isValid)
    {
        TransferRecord[] storage transfers = productTransfers[productId];
        
        if (transfers.length == 0) {
            return true;
        }
        
        // Check first transfer links to product hash
        if (transfers[0].previousHash != products[productId].productHash) {
            return false;
        }
        
        // Check subsequent transfers
        for (uint256 i = 1; i < transfers.length; i++) {
            bytes32 expectedHash = keccak256(
                abi.encodePacked(
                    transfers[i - 1].from,
                    transfers[i - 1].to,
                    transfers[i - 1].timestamp
                )
            );
            
            if (transfers[i].previousHash != expectedHash) {
                return false;
            }
        }
        
        return true;
    }
    
    // ============ Admin Functions ============
    
    /**
     * @dev Authorize a new manufacturer
     * @param manufacturer Address to authorize
     */
    function authorizeManufacturer(address manufacturer) external onlyOwner {
        require(manufacturer != address(0), "Invalid address");
        require(!authorizedManufacturers[manufacturer], "Already authorized");
        
        authorizedManufacturers[manufacturer] = true;
        emit ManufacturerAuthorized(manufacturer);
    }
    
    /**
     * @dev Revoke a manufacturer's authorization
     * @param manufacturer Address to revoke
     */
    function revokeManufacturer(address manufacturer) external onlyOwner {
        require(authorizedManufacturers[manufacturer], "Not authorized");
        
        authorizedManufacturers[manufacturer] = false;
        emit ManufacturerRevoked(manufacturer);
    }
    
    /**
     * @dev Check if an address is an authorized manufacturer
     * @param manufacturer Address to check
     * @return Whether the address is authorized
     */
    function isAuthorizedManufacturer(address manufacturer) external view returns (bool) {
        return authorizedManufacturers[manufacturer];
    }
}
