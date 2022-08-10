const { networkConfig, developmentChains } = require('../helper-hardhat-config')
const { verify } = require('../utils/verify')
const { network } = require('hardhat')


module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log, get } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId = network.config.chainId

  let ethUsdPriceFeedAddress
  if (chainId == 31337) {
    const ethUsdAggregator = await get('MockV3Aggregator')
    ethUsdPriceFeedAddress = ethUsdAggregator.address
  } else {
    ethUsdPriceFeedAddress = networkConfig[chainId]['ethUsdPriceFeed']
  }

  //**deploying contract**
  const args = [ethUsdPriceFeedAddress]
  const fundMe = await deploy('FundMe', {
    from: deployer, 
    args: args, 
    log: true, 
    waitConfirmations: network.config.blockConfirmation || 1,
  })
  //verifying contract on etherscan
  if (chainId != 31337 && process.env.ETHERSCAN_API_KEY) {
    await verify(fundMe.address, args)
  }

  log('-----------------------------------------')
}

module.exports.tags = ['all', 'fundme']
