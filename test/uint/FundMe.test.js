const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name) //Only run on development chain
  ? describe.skip
  : describe("FundMe Unit Tests", function () {
      let fundMe
      let deployer
      let MockV3Aggregator
      let sendValue = ethers.utils.parseEther("1") // 1 ETH
      beforeEach(async () => {
        //deploy contract
        deployer = (await getNamedAccounts()).deployer
        await deployments.fixture(["all"])
        fundMe = await ethers.getContract("FundMe", deployer)
        MockV3Aggregator = await ethers.getContract(
          "MockV3Aggregator",
          deployer
        )
      })

      //First test constructor
      describe("constructor", async () => {
        it("sets the msg.sender to owner correctly", async () => {
          const response = await fundMe.getOwner()
          assert.equal(response, deployer)
        })
        it("sets the aggregator addresses correctly", async () => {
          const response = await fundMe.getPricefeed()
          assert.equal(response, MockV3Aggregator.address)
        })
      })
      //Second test fund
      describe("fund", async () => {
        it("Fails if you don't send enough ETH", async () => {
          await expect(fundMe.fund()).to.be.revertedWithCustomError(
            fundMe,
            "fund_NotEnoughEth"
          )
        })
        it("funders array updated", async () => {
          await fundMe.fund({ value: sendValue })
          const respone = await fundMe.getFunder(0)
          assert.equal(respone, deployer)
        })
        it("updated the amount funed data structure", async () => {
          await fundMe.fund({ value: sendValue })
          const respone = await fundMe.getAdressToAmountFunded(deployer)
          assert.equal(respone.toString(), sendValue.toString())
        })
      })
      //Third test withdraw
      describe("withdraw", async () => {
        beforeEach(async () => {
          await fundMe.fund({ value: sendValue })
        })
        it("Withdraw ETH from a single founder", async () => {
          //Arrange
          const startingFundMeBalance = await fundMe.provider.getBalance(
            //We Could of used ethers.provider also
            fundMe.address
          )
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )

          //Act
          const transactionResponse = await fundMe.withdraw()
          const transactionReceipt = await transactionResponse.wait(1) //Gas used is in transactionReceipt - effectiveGasPrice * gasUsed = gas

          //Getting gas used
          const { effectiveGasPrice, gasUsed } = transactionReceipt
          const gasCost = effectiveGasPrice.mul(gasUsed)

          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          ) 
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )

          //Assert
          assert.equal(endingFundMeBalance, 0)
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          )
        })
        it("Withdraw ETH from a multiple founders", async () => {
          //Arrange
          
          // Deploy multiple founders and deposit 1 ether into contract accounts
          const accounts = await ethers.getSigners()
          for (let i = 1; i < 6; i++) {
            const fundMeConnectedContract = await fundMe.connect(accounts[i])
            await fundMeConnectedContract.fund({ value: sendValue })
          }

          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          ) // 7 Ether
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          ) //0

          // Act
          const transactionResponse = await fundMe.withdraw()
          const transactionReceipt = await transactionResponse.wait(1)
          const { gasUsed, effectiveGasPrice } = transactionReceipt
          const gasCost = gasUsed.mul(effectiveGasPrice)

          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )

          //Assert
          assert.equal(endingFundMeBalance, 0)
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          )

          //Make sure that the funders are reset properly
          await expect(fundMe.getFunder(0)).to.be.reverted

          for (let i = 1; i < 6; i++) {
            assert.equal(
              await fundMe.getAdressToAmountFunded(accounts[i].address),
              0
            )
          }
        })

        it("Only allows the owners to withdraws", async function () {
          const accounts = await ethers.getSigners()
          const attacker = accounts[1]
          const attackerConnectedContract = await fundMe.connect(attacker)
          await expect(
            attackerConnectedContract.withdraw()
          ).to.be.revertedWithCustomError(fundMe, "onlyOwner_NotOwner")
        })
      })
    })

