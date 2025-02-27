// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "openzeppelin-contracts/token/ERC721/ERC721.sol";
import "openzeppelin-contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "openzeppelin-contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract AvatarNFT is ERC721, ERC721Burnable, ERC721URIStorage {
    enum CollectionType {
        Head,
        Face,
        Shirt,
        Pants,
        Shoes
    }

    // collection mapping
    mapping(uint256 => CollectionType) public tokenCollection;

    constructor(string memory name, string memory symbol) ERC721(name, symbol) {}

    /**
     * @dev Mint a new NFT.
     * @param to The recipient address.
     * @param tokenId The new token’s id.
     * @param _tokenURI The metadata URI.
     * @param collection The collection type (e.g., Hat or Shirt).
     */
    function mint(
        address to,
        uint256 tokenId,
        string memory _tokenURI,
        CollectionType collection
    ) public {
        _mint(to, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        tokenCollection[tokenId] = collection;
    }

    // The following functions override required functions from parent contracts.

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
