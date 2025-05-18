import { run } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const network = process.env.HARDHAT_NETWORK || "sepolia";
  console.log(`Verifying contracts on ${network}...`);

  // Load the latest deployment file
  const deploymentPath = path.join(__dirname, "../deployments", `${network}-latest.json`);
  
  if (!fs.existsSync(deploymentPath)) {
    console.error(`Deployment file not found at ${deploymentPath}`);
    console.error(`Make sure you have deployed contracts to ${network} first.`);
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const contracts = deployment.contracts;

  // Wait between verifications to avoid rate limiting
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // SilicaToken verification
  try {
    console.log(`\nVerifying SilicaToken at ${contracts.SilicaToken}`);
    await run("verify:verify", {
      address: contracts.SilicaToken,
      constructorArguments: []
    });
    console.log("SilicaToken verified successfully");
  } catch (error: any) {
    console.error(`Error verifying SilicaToken: ${error.message}`);
  }
  await wait(5000);

  // SilicaTimelock verification
  try {
    console.log(`\nVerifying SilicaTimelock at ${contracts.SilicaTimelock}`);
    await run("verify:verify", {
      address: contracts.SilicaTimelock,
      constructorArguments: [86400, [], []]
    });
    console.log("SilicaTimelock verified successfully");
  } catch (error: any) {
    console.error(`Error verifying SilicaTimelock: ${error.message}`);
  }
  await wait(5000);

  // SilicaTreasury verification
  try {
    console.log(`\nVerifying SilicaTreasury at ${contracts.SilicaTreasury}`);
    await run("verify:verify", {
      address: contracts.SilicaTreasury,
      constructorArguments: [contracts.SilicaTimelock]
    });
    console.log("SilicaTreasury verified successfully");
  } catch (error: any) {
    console.error(`Error verifying SilicaTreasury: ${error.message}`);
  }
  await wait(5000);

  // SilicaAIOracle verification
  try {
    console.log(`\nVerifying SilicaAIOracle at ${contracts.SilicaAIOracle}`);
    await run("verify:verify", {
      address: contracts.SilicaAIOracle,
      constructorArguments: []
    });
    console.log("SilicaAIOracle verified successfully");
  } catch (error: any) {
    console.error(`Error verifying SilicaAIOracle: ${error.message}`);
  }
  await wait(5000);

  // SilicaAIController verification
  try {
    console.log(`\nVerifying SilicaAIController at ${contracts.SilicaAIController}`);
    await run("verify:verify", {
      address: contracts.SilicaAIController,
      constructorArguments: [
        contracts.SilicaToken,
        contracts.SilicaTreasury
      ]
    });
    console.log("SilicaAIController verified successfully");
  } catch (error: any) {
    console.error(`Error verifying SilicaAIController: ${error.message}`);
  }
  await wait(5000);

  // SilicaModelRegistry verification
  try {
    console.log(`\nVerifying SilicaModelRegistry at ${contracts.SilicaModelRegistry}`);
    await run("verify:verify", {
      address: contracts.SilicaModelRegistry,
      constructorArguments: []
    });
    console.log("SilicaModelRegistry verified successfully");
  } catch (error: any) {
    console.error(`Error verifying SilicaModelRegistry: ${error.message}`);
  }
  await wait(5000);

  // SilicaExecutionEngine verification
  try {
    console.log(`\nVerifying SilicaExecutionEngine at ${contracts.SilicaExecutionEngine}`);
    await run("verify:verify", {
      address: contracts.SilicaExecutionEngine,
      constructorArguments: [
        contracts.SilicaModelRegistry,
        contracts.SilicaToken,
        contracts.SilicaTreasury
      ]
    });
    console.log("SilicaExecutionEngine verified successfully");
  } catch (error: any) {
    console.error(`Error verifying SilicaExecutionEngine: ${error.message}`);
  }

  console.log("\nVerification process completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Verification error:", error);
    process.exit(1);
  }); 