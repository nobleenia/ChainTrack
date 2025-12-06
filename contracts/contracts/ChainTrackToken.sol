// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/**
 * @title ChainTrackToken (CTK)
 * @dev ERC-20 Reward Token for ChainTrack Supply Chain Platform
 * 
 * Users earn points through platform activities:
 * - Registering products
 * - Completing transfers
 * - Verifying products
 * - Successful shipments
 * - Referrals
 * 
 * Points accumulate off-chain in the database, and users can
 * claim/convert them to CTK tokens when they connect a wallet.
 * 
 * Features:
 * - Mintable by authorized minters (backend service)
 * - Burnable by token holders
 * - Permit for gasless approvals
 * - Role-based access control
 */
contract ChainTrackToken is ERC20, ERC20Burnable, AccessControl, ERC20Permit {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    // Conversion rate: 100 points = 1 CTK token (with 18 decimals)
    uint256 public constant POINTS_PER_TOKEN = 100;
    
    // Maximum supply cap: 100 million tokens
    uint256 public constant MAX_SUPPLY = 100_000_000 * 10**18;
    
    // Track claimed points per user to prevent double claims
    mapping(address => uint256) public claimedPoints;
    
    // Events
    event TokensClaimed(address indexed user, uint256 points, uint256 tokens);
    event PointsConversionRateInfo(uint256 pointsPerToken);

    constructor(address defaultAdmin, address minter)
        ERC20("ChainTrack Token", "CTK")
        ERC20Permit("ChainTrack Token")
    {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(MINTER_ROLE, minter);
    }

    /**
     * @dev Mint tokens to a user when they claim their points
     * @param to Address to receive tokens
     * @param points Number of points being converted to tokens
     * 
     * Called by the backend when a user claims their accumulated points.
     * The backend verifies the user's point balance before calling this.
     */
    function claimTokens(address to, uint256 points) external onlyRole(MINTER_ROLE) {
        require(to != address(0), "Cannot mint to zero address");
        require(points >= POINTS_PER_TOKEN, "Not enough points to claim");
        
        // Calculate tokens (points / 100, but keeping 18 decimals)
        uint256 tokens = (points * 10**18) / POINTS_PER_TOKEN;
        
        require(totalSupply() + tokens <= MAX_SUPPLY, "Would exceed max supply");
        
        claimedPoints[to] += points;
        _mint(to, tokens);
        
        emit TokensClaimed(to, points, tokens);
    }

    /**
     * @dev Direct mint function for admin purposes (airdrops, etc.)
     * @param to Address to receive tokens
     * @param amount Amount of tokens to mint (in wei, 18 decimals)
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        require(totalSupply() + amount <= MAX_SUPPLY, "Would exceed max supply");
        _mint(to, amount);
    }

    /**
     * @dev Get the total points claimed by an address
     */
    function getClaimedPoints(address user) external view returns (uint256) {
        return claimedPoints[user];
    }

    /**
     * @dev Calculate how many tokens a given amount of points would yield
     */
    function calculateTokens(uint256 points) external pure returns (uint256) {
        return (points * 10**18) / POINTS_PER_TOKEN;
    }

    /**
     * @dev Calculate how many points are needed for a given amount of tokens
     */
    function calculatePoints(uint256 tokens) external pure returns (uint256) {
        return (tokens * POINTS_PER_TOKEN) / 10**18;
    }
}
