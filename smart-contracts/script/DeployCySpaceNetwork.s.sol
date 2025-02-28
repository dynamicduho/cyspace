// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/CySpaceNetwork.sol";

contract DeployCySpaceNetwork is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);
        CySpaceNetwork cySpace = new CySpaceNetwork(
            vm.addr(deployerPrivateKey)
        );
        vm.stopBroadcast();
        console.log("CySpaceNetwork deployed at:", address(cySpace));
    }
}
