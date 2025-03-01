// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/SoulboundCySpaceFriendNFT.sol";

contract DeploySoulboundCySpaceNFT is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        SoulboundCySpaceFriendNFT nft = new SoulboundCySpaceFriendNFT(
            "Friendship on CySpace",
            "CYFRIEND",
            msg.sender
        );
        vm.stopBroadcast();

        console.log("Soulbound NFT deployed at:", address(nft));
    }
}
