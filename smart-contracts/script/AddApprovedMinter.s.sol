// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/SoulboundCySpaceFriendNFT.sol";

contract AddApprovedMinter is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address nftAddress = vm.envAddress("NFT_ADDRESS");
        address approvedMinter = vm.envAddress("APPROVED_MINTER");

        vm.startBroadcast(deployerPrivateKey);
        SoulboundCySpaceFriendNFT nft = SoulboundCySpaceFriendNFT(nftAddress);
        nft.addMinter(approvedMinter);
        vm.stopBroadcast();

        console.log("Added approved minter:", approvedMinter);
    }
}
