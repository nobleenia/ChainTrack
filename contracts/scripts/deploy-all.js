const hre = require("hardhat");
const fs = require("fs");

/**
 * Deploy all ChainTrack contracts
 * - ProductRegistry: For product registration and verification
 * - ShipmentRegistry: For P2P delivery tracking
 * - ChainTrackToken: ERC-20 reward token (CTK)
 */
async function main() {
  console.log("=== ChainTrack Contract Deployment ===\n");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer account:", deployer.address);

  // Get the balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  const deployments = {};
  const isLocalNetwork = hre.network.name === "hardhat" || hre.network.name === "localhost";

  // ===== Deploy ProductRegistry =====
  console.log("1. Deploying ProductRegistry...");
  const ProductRegistry = await hre.ethers.getContractFactory("ProductRegistry");
  const productRegistry = await ProductRegistry.deploy();
  await productRegistry.waitForDeployment();
  const productRegistryAddress = await productRegistry.getAddress();
  console.log("   ProductRegistry deployed to:", productRegistryAddress);

  deployments.ProductRegistry = {
    address: productRegistryAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  // ===== Deploy ShipmentRegistry =====
  console.log("2. Deploying ShipmentRegistry...");
  const ShipmentRegistry = await hre.ethers.getContractFactory("ShipmentRegistry");
  const shipmentRegistry = await ShipmentRegistry.deploy();
  await shipmentRegistry.waitForDeployment();
  const shipmentRegistryAddress = await shipmentRegistry.getAddress();
  console.log("   ShipmentRegistry deployed to:", shipmentRegistryAddress);

  deployments.ShipmentRegistry = {
    address: shipmentRegistryAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  // ===== Deploy ChainTrackToken =====
  console.log("3. Deploying ChainTrackToken (CTK)...");
  const ChainTrackToken = await hre.ethers.getContractFactory("ChainTrackToken");
  // deployer is both admin and initial minter
  const chainTrackToken = await ChainTrackToken.deploy(deployer.address, deployer.address);
  await chainTrackToken.waitForDeployment();
  const chainTrackTokenAddress = await chainTrackToken.getAddress();
  console.log("   ChainTrackToken deployed to:", chainTrackTokenAddress);

  deployments.ChainTrackToken = {
    address: chainTrackTokenAddress,
    deployer: deployer.address,
    admin: deployer.address,
    minter: deployer.address,
    timestamp: new Date().toISOString(),
  };

  // Wait for block confirmations
  if (!isLocalNetwork) {
    console.log("\n4. Waiting for block confirmations...");
    await productRegistry.deploymentTransaction().wait(5);
    await shipmentRegistry.deploymentTransaction().wait(5);
    await chainTrackToken.deploymentTransaction().wait(5);
    console.log("   Confirmations received.");
  } else {
    await productRegistry.deploymentTransaction().wait(1);
    await shipmentRegistry.deploymentTransaction().wait(1);
    await chainTrackToken.deploymentTransaction().wait(1);
  }

  // Verify on Etherscan (only on public networks)
  if (!isLocalNetwork) {
    console.log("\n5. Verifying contracts on Etherscan...");
    
    try {
      await hre.run("verify:verify", {
        address: productRegistryAddress,
        constructorArguments: [],
      });
      console.log("   ProductRegistry verified!");
    } catch (error) {
      console.log("   ProductRegistry verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: shipmentRegistryAddress,
        constructorArguments: [],
      });
      console.log("   ShipmentRegistry verified!");
    } catch (error) {
      console.log("   ShipmentRegistry verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: chainTrackTokenAddress,
        constructorArguments: [deployer.address, deployer.address],
      });
      console.log("   ChainTrackToken verified!");
    } catch (error) {
      console.log("   ChainTrackToken verification failed:", error.message);
    }
  }

  // Log deployment summary
  console.log("\n=== Deployment Summary ===");
  console.log("Network:", hre.network.name);
  console.log("Block Number:", await hre.ethers.provider.getBlockNumber());
  console.log("\nContracts:");
  console.log("  ProductRegistry:", productRegistryAddress);
  console.log("  ShipmentRegistry:", shipmentRegistryAddress);
  console.log("  ChainTrackToken:", chainTrackTokenAddress);
  console.log("========================\n");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
    contracts: deployments,
  };

  // Ensure deployments directory exists
  if (!fs.existsSync("./deployments")) {
    fs.mkdirSync("./deployments");
  }

  fs.writeFileSync(
    `./deployments/${hre.network.name}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log(`Deployment info saved to ./deployments/${hre.network.name}.json`);

  // Generate contract addresses for backend config
  const backendConfig = `# Contract Addresses (${hre.network.name})
# Generated: ${new Date().toISOString()}
PRODUCT_REGISTRY_ADDRESS=${productRegistryAddress}
SHIPMENT_REGISTRY_ADDRESS=${shipmentRegistryAddress}
CHAINTRACK_TOKEN_ADDRESS=${chainTrackTokenAddress}
`;

  fs.writeFileSync(
    `./deployments/${hre.network.name}.env`,
    backendConfig
  );
  console.log(`Backend config saved to ./deployments/${hre.network.name}.env`);

  return deployments;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
