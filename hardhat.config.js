require('@nomicfoundation/hardhat-toolbox')
require('dotenv').config()
require('hardhat-gas-reporter')
require('solidity-coverage')
require('@nomiclabs/hardhat-etherscan')
require('hardhat-deploy')

const COINMARKET_API_KEY = process.env.COINMARKET_API_KEY // || 'key'

const LOCALHOST_RPC_URL = process.env.LOCALHOST_RPC_URL // || 'https://eth-rinkeby/example'

const RINKEBY_RPC_URL = process.env.RINKEBY_RPC_URL // || 'https://eth-rinkeby/example'
const RINKEBY_PRIVATE_KEY = process.env.RINKEBY_PRIVATE_KEY // || '0xkey'
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY // || 'key'

module.exports = {
  defaultNetwork: 'hardhat',
  networks: {
    rinkeby: {
      url: RINKEBY_RPC_URL,
      accounts: [RINKEBY_PRIVATE_KEY], //ethers.getSigners()
      chainId: 4,
      blockConfirmation: 6,
    },
    localhost: {
      url: LOCALHOST_RPC_URL,
      // accounts: [LOCALHOST_PRIVATE_KEY], HardHAt provides account automatically
      chainId: 31337,
    },
  },
  // solidity: '0.8.8',
  solidity: {
    compilers: [{ version: '0.8.8' }, { version: '0.6.6' }],
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  gasReporter: {
    enable: false,
    outputFile: 'gas-report.txt',
    noColors: true,
    currency: 'USD',
    coinmarketcap: COINMARKET_API_KEY,
    // toekn: 'MATIC',
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    user: {
      default: 1,
    },
  },
}
