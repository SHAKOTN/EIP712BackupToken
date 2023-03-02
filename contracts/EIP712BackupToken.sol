pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "hardhat/console.sol";

contract EIP712BackupToken is ERC20 {
    bytes32 public DOMAIN_TYPEHASH =
        keccak256(
            "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        );
    bytes32 public constant TRANSFER_TYPEHASH =
        keccak256("EmergencyTransfer(address account,address backupAddress)");

    event BackupRegistered(address indexed account, address backupAddress);
    event EmergencyTransfer(
        address indexed account,
        address indexed backupAddress
    );

    mapping(address => address) private backups;
    mapping(address => bool) private blacklisted;

    modifier onlyNonBlacklisted(address recipient) {
        require(!blacklisted[recipient], "Recipient is blacklisted");
        _;
    }

    constructor(uint256 initialSupply) ERC20("Backup Token", "BTT") {
        _mint(msg.sender, initialSupply);
    }

    function backupAddressOf(address account) external view returns (address) {
        return backups[account];
    }

    // Register backup address for account. Can be changed as many times as needed
    // Blacklisted accounts cannot register or change backup address anymore
    function registerBackupAddress(
        address backupAddress
    ) external onlyNonBlacklisted(msg.sender) {
        backups[msg.sender] = backupAddress;
        emit BackupRegistered(msg.sender, backupAddress);
    }

    /**
     * Move tokens from `account` to `backupAddress` using EIP712 signature that can be sent from arbitrary wallet
     & @param account Address of the account that owns the tokens
        * @param backupAddress Address of the backup account
        * @param v Signature parameter
        * @param r Signature parameter
        * @param s Signature parameter
     */
    function transferViaSignature(
        address account,
        address backupAddress,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external onlyNonBlacklisted(account) {
        require(backups[account] == backupAddress, "Invalid backup address");
        // Check that account balance is not zero
        require(
            balanceOf(account) > 0,
            "Account balance is zero, nothing to transfer"
        );
        // Generate EIP712 signature
        bytes32 messageHash = _sign(account, backupAddress);
        // Recover signer address from signature
        address signer = ecrecover(messageHash, v, r, s);
        require(signer == account, "Invalid signature");
        // Transfer all tokens from account to backup address
        require(
            _emergencyTransferFrom(account, backupAddress, balanceOf(account)),
            "Transfer failed"
        );
        // Blacklist account to prevent further transfers
        blacklisted[account] = true;
        emit EmergencyTransfer(account, backupAddress);
    }

    /**
     * @dev Generate EIP712 signature
     * @param account Address of the account that owns the tokens
     * @param backupAddress Address of the backup account
     */
    function _sign(
        address account,
        address backupAddress
    ) private view returns (bytes32) {
        bytes32 domainSeparator = keccak256(
            abi.encode(
                DOMAIN_TYPEHASH,
                keccak256(bytes("Backup Token")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
        bytes32 structHash = keccak256(
            abi.encode(TRANSFER_TYPEHASH, account, backupAddress)
        );
        bytes32 messageHash = keccak256(
            abi.encodePacked("\x19\x01", domainSeparator, structHash)
        );
        return messageHash;
    }

    /**
     * @dev Moves all tokens from `from` to `to` and skipping the allowance
     *
     * This internal function is equivalent to {transfer}, and can be used to
     * perform emergency transfer
     *
     * Emits a {Transfer} event.
     *
     * Requirements:
     *
     * - `from` cannot be the zero address.
     * - `to` cannot be the zero address.
     * - `from` amount tokens to transfer
     */
    function _emergencyTransferFrom(
        address from,
        address to,
        uint256 amount
    ) private onlyNonBlacklisted(from) returns (bool) {
        _transfer(from, to, amount);
        return true;
    }
}
