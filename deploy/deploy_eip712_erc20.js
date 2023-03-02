module.exports = async ({getNamedAccounts, deployments}) => {
  const {deploy} = deployments;
  const {deployer} = await getNamedAccounts();
  const initAmount = 10000000000000;
  await deploy('EIP712BackupToken', {
    from: deployer,
    args: [initAmount],
    log: true,
  });
};
module.exports.tags = ['EIP712BackupToken'];
