async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const provider = ethers.provider;
  const balance = await provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance));

  const DecentralizedPaymentGateway = await ethers.getContractFactory("DecentralizedPaymentGateway");
  const contract = await DecentralizedPaymentGateway.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("Contract deployed to address:", contractAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });