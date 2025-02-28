// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "solmate/tokens/ERC721.sol";
import "solmate/auth/Owned.sol";
import "openzeppelin-contracts/utils/Strings.sol";

/**
 * @title CySpaceNFT
 * @dev ERC721 token for the CySpace Network
 */
contract CySpaceNFT is ERC721, Owned {
    using Strings for uint256;

    // Token counter
    uint256 private _tokenIdCounter;

    // Base URI for metadata
    string private _baseTokenURI;

    // Mapping for token URIs
    mapping(uint256 => string) private _tokenURIs;

    // Mapping for token creators
    mapping(uint256 => address) public creators;

    // Mapping for authorized minters
    mapping(address => bool) public authorizedMinters;

    // Events
    event NFTMinted(address indexed creator, address indexed owner, uint256 indexed tokenId, string tokenURI);
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    event BaseURIUpdated(string newBaseURI);

    // Errors
    error NotAuthorized();
    error InvalidTokenId();
    error ZeroAddress();

    /**
     * @dev Constructor
     * @param name_ Name of the NFT collection
     * @param symbol_ Symbol of the NFT collection
     * @param baseURI_ Base URI for token metadata
     */
    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseURI_,
        address owner_
    ) ERC721(name_, symbol_) Owned(owner_) {
        _baseTokenURI = baseURI_;
        // Add the contract creator as an authorized minter
        authorizedMinters[owner_] = true;
        emit MinterAdded(owner_);
    }

    /**
     * @dev Modifier to check if the caller is authorized to mint
     */
    modifier onlyAuthorized() {
        if (msg.sender != owner && !authorizedMinters[msg.sender]) {
            revert NotAuthorized();
        }
        _;
    }

    /**
     * @dev Add an authorized minter
     * @param minter Address of the minter to add
     */
    function addMinter(address minter) external onlyOwner {
        if (minter == address(0)) revert ZeroAddress();
        authorizedMinters[minter] = true;
        emit MinterAdded(minter);
    }

    /**
     * @dev Remove an authorized minter
     * @param minter Address of the minter to remove
     */
    function removeMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = false;
        emit MinterRemoved(minter);
    }

    /**
     * @dev Set the base URI for all token metadata
     * @param baseURI_ New base URI
     */
    function setBaseURI(string memory baseURI_) external onlyOwner {
        _baseTokenURI = baseURI_;
        emit BaseURIUpdated(baseURI_);
    }

    /**
     * @dev Mint a new NFT
     * @param to Address to mint the NFT to
     * @param tokenURI_ URI for the token metadata
     * @return tokenId The ID of the newly minted token
     */
    function mint(address to, string memory tokenURI_) external onlyAuthorized returns (uint256) {
        if (to == address(0)) revert ZeroAddress();
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _mint(to, tokenId);
        _setTokenURI(tokenId, tokenURI_);
        
        // Record the creator
        creators[tokenId] = msg.sender;
        
        emit NFTMinted(msg.sender, to, tokenId, tokenURI_);
        
        return tokenId;
    }

    /**
     * @dev Set the URI for a specific token
     * @param tokenId ID of the token
     * @param tokenURI_ URI for the token metadata
     */
    function _setTokenURI(uint256 tokenId, string memory tokenURI_) internal {
        if (!_exists(tokenId)) revert InvalidTokenId();
        _tokenURIs[tokenId] = tokenURI_;
    }

    /**
     * @dev Check if a token exists
     * @param tokenId ID of the token
     * @return bool Whether the token exists
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return ownerOf(tokenId) != address(0);
    }

    /**
     * @dev Get the URI for a token
     * @param tokenId ID of the token
     * @return string URI for the token metadata
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (!_exists(tokenId)) revert InvalidTokenId();

        string memory _tokenURI = _tokenURIs[tokenId];
        
        // If there is no specific URI, return the base URI + token ID
        if (bytes(_tokenURI).length == 0) {
            return string(abi.encodePacked(_baseTokenURI, tokenId.toString()));
        }
        
        // If both are set, concatenate the baseURI and tokenURI
        if (bytes(_baseTokenURI).length > 0) {
            return string(abi.encodePacked(_baseTokenURI, _tokenURI));
        }
        
        return _tokenURI;
    }

    /**
     * @dev Get the total number of tokens minted
     * @return uint256 Total supply
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }

    /**
     * @dev Get the creator of a token
     * @param tokenId ID of the token
     * @return address Creator of the token
     */
    function getCreator(uint256 tokenId) external view returns (address) {
        if (!_exists(tokenId)) revert InvalidTokenId();
        return creators[tokenId];
    }
} 