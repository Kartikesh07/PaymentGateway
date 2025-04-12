// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DecentralizedPaymentGateway {
    struct Merchant {
        address merchantAddress;
        uint256 registrationTime;
        uint256 totalReceived;
    }

    // Mapping of merchant wallet address to their registration details and balance.
    mapping(address => Merchant) public merchants;

    // Events to log registration and payments.
    event MerchantRegistered(address indexed merchant, uint256 registrationTime);
    event PaymentReceived(address indexed merchant, address indexed sender, uint256 amount);

    /// @notice Register as a merchant. Must be called from the merchant's own wallet.
    function registerMerchant() external {
        require(merchants[msg.sender].merchantAddress == address(0), "Already registered");
        merchants[msg.sender] = Merchant({
            merchantAddress: msg.sender,
            registrationTime: block.timestamp,
            totalReceived: 0
        });
        emit MerchantRegistered(msg.sender, block.timestamp);
    }

    /// @notice Make a payment to a registered merchant.
    /// @param merchant The wallet address of the registered merchant.
    function payMerchant(address merchant) external payable {
        require(merchants[merchant].merchantAddress != address(0), "Merchant not registered");
        require(msg.value > 0, "Payment must be > 0");
        merchants[merchant].totalReceived += msg.value;
        emit PaymentReceived(merchant, msg.sender, msg.value);
    }

    /// @notice Withdraw accumulated funds. Only callable by the merchant.
    function withdrawFunds() external {
        Merchant storage m = merchants[msg.sender];
        require(m.merchantAddress != address(0), "Merchant not registered");
        uint256 amount = m.totalReceived;
        require(amount > 0, "No funds available");
        m.totalReceived = 0;
        payable(msg.sender).transfer(amount);
    }
}
