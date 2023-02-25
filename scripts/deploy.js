const hre = require("hardhat");

async function main() {

  const initAmount = 10000000000000;

  const Token = await hre.ethers.getContractFactory("EIP712BackupToken");
  const token = await Token.deploy(initAmount);

  await token.deployed();

  console.log(
    `Token deployed to ${token.address}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
