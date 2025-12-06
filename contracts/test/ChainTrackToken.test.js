const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ChainTrackToken", function () {
  let token;
  let owner;
  let minter;
  let user1;
  let user2;

  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
  const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";

  beforeEach(async function () {
    [owner, minter, user1, user2] = await ethers.getSigners();

    const ChainTrackToken = await ethers.getContractFactory("ChainTrackToken");
    token = await ChainTrackToken.deploy(owner.address, minter.address);
    await token.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await token.name()).to.equal("ChainTrack Token");
      expect(await token.symbol()).to.equal("CTK");
    });

    it("Should set the correct admin and minter roles", async function () {
      expect(await token.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await token.hasRole(MINTER_ROLE, minter.address)).to.be.true;
    });

    it("Should have 0 initial supply", async function () {
      expect(await token.totalSupply()).to.equal(0);
    });

    it("Should have correct constants", async function () {
      expect(await token.POINTS_PER_TOKEN()).to.equal(100);
      expect(await token.MAX_SUPPLY()).to.equal(ethers.parseEther("100000000"));
    });
  });

  describe("Token Claims", function () {
    it("Should allow minter to claim tokens for user", async function () {
      const points = 1000; // 1000 points = 10 tokens
      
      await token.connect(minter).claimTokens(user1.address, points);
      
      expect(await token.balanceOf(user1.address)).to.equal(ethers.parseEther("10"));
      expect(await token.claimedPoints(user1.address)).to.equal(points);
    });

    it("Should reject claims from non-minters", async function () {
      await expect(
        token.connect(user1).claimTokens(user1.address, 1000)
      ).to.be.reverted;
    });

    it("Should reject claims with insufficient points", async function () {
      await expect(
        token.connect(minter).claimTokens(user1.address, 50) // Less than 100
      ).to.be.revertedWith("Not enough points to claim");
    });

    it("Should correctly calculate tokens from points", async function () {
      // 100 points = 1 token
      expect(await token.calculateTokens(100)).to.equal(ethers.parseEther("1"));
      // 250 points = 2.5 tokens
      expect(await token.calculateTokens(250)).to.equal(ethers.parseEther("2.5"));
      // 1000 points = 10 tokens
      expect(await token.calculateTokens(1000)).to.equal(ethers.parseEther("10"));
    });

    it("Should correctly calculate points from tokens", async function () {
      // 1 token = 100 points
      expect(await token.calculatePoints(ethers.parseEther("1"))).to.equal(100);
      // 10 tokens = 1000 points
      expect(await token.calculatePoints(ethers.parseEther("10"))).to.equal(1000);
    });

    it("Should track cumulative claimed points", async function () {
      await token.connect(minter).claimTokens(user1.address, 500);
      await token.connect(minter).claimTokens(user1.address, 300);
      
      expect(await token.getClaimedPoints(user1.address)).to.equal(800);
      expect(await token.balanceOf(user1.address)).to.equal(ethers.parseEther("8"));
    });

    it("Should emit TokensClaimed event", async function () {
      await expect(token.connect(minter).claimTokens(user1.address, 500))
        .to.emit(token, "TokensClaimed")
        .withArgs(user1.address, 500, ethers.parseEther("5"));
    });
  });

  describe("Direct Minting", function () {
    it("Should allow minter to mint directly", async function () {
      const amount = ethers.parseEther("100");
      
      await token.connect(minter).mint(user1.address, amount);
      
      expect(await token.balanceOf(user1.address)).to.equal(amount);
    });

    it("Should reject direct mint from non-minters", async function () {
      await expect(
        token.connect(user1).mint(user1.address, ethers.parseEther("100"))
      ).to.be.reverted;
    });
  });

  describe("Max Supply", function () {
    it("Should not allow minting beyond max supply", async function () {
      const maxSupply = await token.MAX_SUPPLY();
      
      await expect(
        token.connect(minter).mint(user1.address, maxSupply + 1n)
      ).to.be.revertedWith("Would exceed max supply");
    });
  });

  describe("Burning", function () {
    it("Should allow token holders to burn their tokens", async function () {
      await token.connect(minter).mint(user1.address, ethers.parseEther("100"));
      
      await token.connect(user1).burn(ethers.parseEther("30"));
      
      expect(await token.balanceOf(user1.address)).to.equal(ethers.parseEther("70"));
    });
  });

  describe("Transfers", function () {
    beforeEach(async function () {
      await token.connect(minter).mint(user1.address, ethers.parseEther("100"));
    });

    it("Should allow transfers between users", async function () {
      await token.connect(user1).transfer(user2.address, ethers.parseEther("25"));
      
      expect(await token.balanceOf(user1.address)).to.equal(ethers.parseEther("75"));
      expect(await token.balanceOf(user2.address)).to.equal(ethers.parseEther("25"));
    });
  });

  describe("Role Management", function () {
    it("Should allow admin to grant minter role", async function () {
      await token.connect(owner).grantRole(MINTER_ROLE, user2.address);
      
      expect(await token.hasRole(MINTER_ROLE, user2.address)).to.be.true;
      
      // New minter should be able to mint
      await token.connect(user2).mint(user1.address, ethers.parseEther("50"));
      expect(await token.balanceOf(user1.address)).to.equal(ethers.parseEther("50"));
    });

    it("Should allow admin to revoke minter role", async function () {
      await token.connect(owner).revokeRole(MINTER_ROLE, minter.address);
      
      await expect(
        token.connect(minter).mint(user1.address, ethers.parseEther("100"))
      ).to.be.reverted;
    });
  });
});
