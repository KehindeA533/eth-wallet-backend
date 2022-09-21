// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "./PriceConverter.sol";

/**Custom Errors */
error onlyOwner_NotOwner();
error fund_NotEnoughEth();
error withdraw_WithdrawFailed();

/**@title A sample Funding Contract
 * @author Kehinde A
 * @notice This contract is for creating a sample funding contract
 * @dev This implements price feeds as our library
 */
contract FundMe {
    /**Custom Errors */
    using PriceConverter for uint256;

    /**State variables */
    uint256 public constant MINIMUM_USD = 50 * 1e18;
    address[] private s_funders;
    mapping(address => uint256) private s_addressToAmountFunded;
    address private immutable i_owner;
    AggregatorV3Interface private s_priceFeed;

    /**Events */
    event Funded(address indexed from, uint256 amount);

    /**Modifiers */
    modifier onlyOwner() {
        if (msg.sender != i_owner) {
            revert onlyOwner_NotOwner();
        }
        _;
    }

    /**Functions */
    /// @notice To consume price data, the smart contract reference AggregatorV3Interface, which defines the external functions implemented by Data Feeds.
    /// @param priceFeedAddress Chainlink Data Feed contracts address
    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    /// @notice Funds our contract based on the ETH/USD price
    /// @dev This implements price feed as our library
    function fund() public payable {
        if (msg.value.getConversionRate(s_priceFeed) < MINIMUM_USD) {
            revert fund_NotEnoughEth();
        }
        s_funders.push(msg.sender);
        s_addressToAmountFunded[msg.sender] = msg.value;
        emit Funded(msg.sender, msg.value);
    }

    /// @notice Withdraw from our contract based on the ETH/USD price that is requested
    function withdraw() public onlyOwner {
        address[] memory funders = s_funders;
        for (uint256 i = 0; i < s_funders.length; i++) {
            address funder = funders[i];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);

        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        if (!callSuccess) {
            revert withdraw_WithdrawFailed();
        }
    }

    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    /** @notice Gets the amount that an address has funded
     *  @param funder the address of the funder
     *  @return the amount funded
     */

    function getAdressToAmountFunded(address funder)
        public
        view
        returns (uint256)
    {
        return s_addressToAmountFunded[funder];
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getPricefeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
