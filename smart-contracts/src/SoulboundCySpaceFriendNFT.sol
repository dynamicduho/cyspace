// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "solmate/tokens/ERC721.sol";
import "solmate/auth/Owned.sol";
import "openzeppelin-contracts/utils/Strings.sol";

/**
 * @title SoulboundCySpaceFriendNFT
 * @dev ERC721 token with a single metadata field ("friend address"), nontransferable (soulbound) but burnable.
 */
contract SoulboundCySpaceFriendNFT is ERC721, Owned {
    using Strings for uint256;
    using Strings for address;

    // Token counter for new token IDs.
    uint256 private _tokenIdCounter;

    // Mapping for the friend address metadata for each token.
    mapping(uint256 => address) public friendAddresses;

    // Mapping for token creators.
    mapping(uint256 => address) public creators;

    // Mapping for authorized minters.
    mapping(address => bool) public authorizedMinters;

    // Events.
    event NFTMinted(address indexed creator, address indexed owner, uint256 indexed tokenId, address friendAddress);
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);

    // Custom errors.
    error NotAuthorized();
    error InvalidTokenId();
    error ZeroAddress();

    /**
     * @dev Constructor.
     * @param name_ Name of the NFT collection.
     * @param symbol_ Symbol of the NFT collection.
     * @param owner_ Owner of the contract.
     */
    constructor(
        string memory name_,
        string memory symbol_,
        address owner_
    ) ERC721(name_, symbol_) Owned(owner_) {
        // The contract owner is added as an authorized minter.
        authorizedMinters[owner_] = true;
        emit MinterAdded(owner_);
    }

    /**
     * @dev Modifier to check if the caller is authorized to mint.
     */
    modifier onlyAuthorized() {
        if (msg.sender != owner && !authorizedMinters[msg.sender]) {
            revert NotAuthorized();
        }
        _;
    }

    /**
     * @dev Add an authorized minter.
     * @param minter Address of the minter to add.
     */
    function addMinter(address minter) external onlyOwner {
        if (minter == address(0)) revert ZeroAddress();
        authorizedMinters[minter] = true;
        emit MinterAdded(minter);
    }

    /**
     * @dev Remove an authorized minter.
     * @param minter Address of the minter to remove.
     */
    function removeMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = false;
        emit MinterRemoved(minter);
    }

    /**
     * @dev Mint a new NFT.
     * @param to Address to mint the NFT to.
     * @param friend Address of the "friend" to record as metadata.
     * @return tokenId The ID of the newly minted token.
     */
    function mint(address to, address friend) external onlyAuthorized returns (uint256) {
        if (to == address(0) || friend == address(0)) revert ZeroAddress();

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _mint(to, tokenId);
        friendAddresses[tokenId] = friend;
        creators[tokenId] = msg.sender;

        emit NFTMinted(msg.sender, to, tokenId, friend);
        return tokenId;
    }

    /**
     * @dev Burn a token. Only the token owner may burn their token.
     * @param tokenId ID of the token to burn.
     */
    function burn(uint256 tokenId) external {
        if (ownerOf(tokenId) != msg.sender) {
            revert NotAuthorized();
        }
        _burn(tokenId);
        delete friendAddresses[tokenId];
        delete creators[tokenId];
    }

    /**
     * @dev Returns the token URI for a given token ID.
     * In this case, it returns the friend address as a hex string.
     * @param tokenId The token ID.
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        // Ensure the token exists.
        if (ownerOf(tokenId) == address(0)) revert InvalidTokenId();
        // Return the friend address in a hexadecimal string format.
        return Strings.toHexString(friendAddresses[tokenId]);
    }

    // *********************************************************************
    //                    Soulbound (Non-transferable) Logic
    // *********************************************************************

    // Override transfer functions to disable transfers.
    function transferFrom(address, address, uint256) public pure override {
        revert("Soulbound token: non-transferable");
    }

    function safeTransferFrom(address, address, uint256) public pure override {
        revert("Soulbound token: non-transferable");
    }

    function safeTransferFrom(address, address, uint256, bytes calldata) public pure override {
        revert("Soulbound token: non-transferable");
    }

    function approve(address, uint256) public pure override {
        revert("Soulbound token: non-transferable");
    }

    function setApprovalForAll(address, bool) public pure override {
        revert("Soulbound token: non-transferable");
    }
}
