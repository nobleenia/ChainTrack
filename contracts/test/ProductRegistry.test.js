const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ProductRegistry", function () {
  let productRegistry;
  let owner;
  let manufacturer;
  let distributor;
  let retailer;

  const sampleProductId = "PRD-TEST-123456";
  const sampleProductHash = ethers.keccak256(ethers.toUtf8Bytes("test-product-data"));

  beforeEach(async function () {
    [owner, manufacturer, distributor, retailer] = await ethers.getSigners();

    const ProductRegistry = await ethers.getContractFactory("ProductRegistry");
    productRegistry = await ProductRegistry.deploy();
    await productRegistry.waitForDeployment();

    // Authorize the manufacturer
    await productRegistry.authorizeManufacturer(manufacturer.address);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await productRegistry.owner()).to.equal(owner.address);
    });

    it("Should have zero products initially", async function () {
      expect(await productRegistry.totalProducts()).to.equal(0);
    });

    it("Should authorize owner as manufacturer by default", async function () {
      expect(await productRegistry.isAuthorizedManufacturer(owner.address)).to.be.true;
    });
  });

  describe("Product Registration", function () {
    it("Should register a product successfully", async function () {
      await expect(
        productRegistry.connect(manufacturer).registerProduct(sampleProductId, sampleProductHash)
      )
        .to.emit(productRegistry, "ProductRegistered")
        .withArgs(sampleProductId, sampleProductHash, manufacturer.address, await getBlockTimestamp());

      expect(await productRegistry.totalProducts()).to.equal(1);

      const [isAuthentic, product] = await productRegistry.verifyProduct(sampleProductId);
      expect(isAuthentic).to.be.true;
      expect(product.manufacturer).to.equal(manufacturer.address);
      expect(product.productHash).to.equal(sampleProductHash);
    });

    it("Should not allow duplicate product registration", async function () {
      await productRegistry.connect(manufacturer).registerProduct(sampleProductId, sampleProductHash);

      await expect(
        productRegistry.connect(manufacturer).registerProduct(sampleProductId, sampleProductHash)
      ).to.be.revertedWith("Product already registered");
    });

    it("Should not allow unauthorized addresses to register", async function () {
      await expect(
        productRegistry.connect(retailer).registerProduct(sampleProductId, sampleProductHash)
      ).to.be.revertedWith("Not an authorized manufacturer");
    });
  });

  describe("Product Transfers", function () {
    beforeEach(async function () {
      await productRegistry.connect(manufacturer).registerProduct(sampleProductId, sampleProductHash);
    });

    it("Should record a transfer successfully", async function () {
      await expect(
        productRegistry
          .connect(manufacturer)
          .recordTransfer(sampleProductId, distributor.address, "shipped", "New York, USA")
      )
        .to.emit(productRegistry, "ProductTransferred")
        .withArgs(
          sampleProductId,
          manufacturer.address,
          distributor.address,
          "shipped",
          "New York, USA",
          await getBlockTimestamp()
        );

      expect(await productRegistry.totalTransfers()).to.equal(1);

      const transfers = await productRegistry.getProductTransfers(sampleProductId);
      expect(transfers.length).to.equal(1);
      expect(transfers[0].from).to.equal(manufacturer.address);
      expect(transfers[0].to).to.equal(distributor.address);
    });

    it("Should record multiple transfers", async function () {
      await productRegistry
        .connect(manufacturer)
        .recordTransfer(sampleProductId, distributor.address, "shipped", "Factory");

      await productRegistry
        .connect(distributor)
        .recordTransfer(sampleProductId, retailer.address, "delivered", "Warehouse");

      const transfers = await productRegistry.getProductTransfers(sampleProductId);
      expect(transfers.length).to.equal(2);
    });

    it("Should not allow transfer to zero address", async function () {
      await expect(
        productRegistry
          .connect(manufacturer)
          .recordTransfer(sampleProductId, ethers.ZeroAddress, "shipped", "Location")
      ).to.be.revertedWith("Invalid receiver address");
    });

    it("Should not allow transfer for non-existent product", async function () {
      await expect(
        productRegistry
          .connect(manufacturer)
          .recordTransfer("NON-EXISTENT", distributor.address, "shipped", "Location")
      ).to.be.revertedWith("Product not registered");
    });
  });

  describe("Chain Integrity", function () {
    beforeEach(async function () {
      await productRegistry.connect(manufacturer).registerProduct(sampleProductId, sampleProductHash);
    });

    it("Should verify chain integrity for product with no transfers", async function () {
      expect(await productRegistry.verifyChainIntegrity(sampleProductId)).to.be.true;
    });

    it("Should verify chain integrity after transfers", async function () {
      await productRegistry
        .connect(manufacturer)
        .recordTransfer(sampleProductId, distributor.address, "shipped", "Factory");

      await productRegistry
        .connect(distributor)
        .recordTransfer(sampleProductId, retailer.address, "delivered", "Warehouse");

      expect(await productRegistry.verifyChainIntegrity(sampleProductId)).to.be.true;
    });
  });

  describe("Manufacturer Authorization", function () {
    it("Should authorize a new manufacturer", async function () {
      await expect(productRegistry.authorizeManufacturer(distributor.address))
        .to.emit(productRegistry, "ManufacturerAuthorized")
        .withArgs(distributor.address);

      expect(await productRegistry.isAuthorizedManufacturer(distributor.address)).to.be.true;
    });

    it("Should revoke a manufacturer", async function () {
      await productRegistry.authorizeManufacturer(distributor.address);

      await expect(productRegistry.revokeManufacturer(distributor.address))
        .to.emit(productRegistry, "ManufacturerRevoked")
        .withArgs(distributor.address);

      expect(await productRegistry.isAuthorizedManufacturer(distributor.address)).to.be.false;
    });

    it("Should not allow non-owner to authorize", async function () {
      await expect(
        productRegistry.connect(manufacturer).authorizeManufacturer(distributor.address)
      ).to.be.revertedWithCustomError(productRegistry, "OwnableUnauthorizedAccount");
    });
  });

  describe("Product Verification", function () {
    it("Should return false for non-existent product", async function () {
      const [isAuthentic] = await productRegistry.verifyProduct("NON-EXISTENT");
      expect(isAuthentic).to.be.false;
    });

    it("Should return true for registered product", async function () {
      await productRegistry.connect(manufacturer).registerProduct(sampleProductId, sampleProductHash);

      const [isAuthentic, product] = await productRegistry.verifyProduct(sampleProductId);
      expect(isAuthentic).to.be.true;
      expect(product.productHash).to.equal(sampleProductHash);
    });
  });
});

async function getBlockTimestamp() {
  const block = await ethers.provider.getBlock("latest");
  return block.timestamp;
}
