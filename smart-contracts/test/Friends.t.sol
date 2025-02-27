// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/CySpaceNetwork.sol";

contract CySpaceNetworkFriendTest is Test {
    CySpaceNetwork cySpace;
    address owner = address(1);
    address admin = address(2);
    address userA = address(3);
    address userB = address(4);
    address nonAuthorized = address(5);

    event FriendAdded(address indexed user, address indexed friend);
    event FriendRemoved(address indexed user, address indexed friend);

    function setUp() public {
        vm.prank(owner);
        cySpace = new CySpaceNetwork(owner);

        vm.prank(owner);
        cySpace.addAdmin(admin);
    }

    function testAddFriendByOwner() public {
        vm.prank(owner);
        vm.expectEmit(true, true, false, false);
        emit FriendAdded(userA, userB);
        cySpace.addFriend(userA, userB);

        bool isFriend = cySpace.friends(userA, userB);
        assertTrue(isFriend, "Friend relation not set by owner");
    }

    function testAddFriendByAdmin() public {
        vm.prank(admin);
        vm.expectEmit(true, true, false, false);
        emit FriendAdded(userA, userB);
        cySpace.addFriend(userA, userB);

        bool isFriend = cySpace.friends(userA, userB);
        assertTrue(isFriend, "Friend relation not set by admin");
    }

    function testAddFriendFailsForNonAuthorized() public {
        vm.prank(nonAuthorized);
        vm.expectRevert(
            abi.encodeWithSelector(CySpaceNetwork.NotAuthorized.selector)
        );
        cySpace.addFriend(userA, userB);
    }

    function testAddFriendSelfRevert() public {
        vm.prank(owner);
        vm.expectRevert("Cannot add yourself");
        cySpace.addFriend(userA, userA);
    }

    function testRemoveFriend() public {
        vm.prank(admin);
        cySpace.addFriend(userA, userB);

        vm.prank(userA);
        vm.expectEmit(true, true, false, false);
        emit FriendRemoved(userA, userB);
        cySpace.removeFriend(userA, userB);

        bool isFriend = cySpace.friends(userA, userB);
        assertFalse(isFriend, "Friend relation was not removed");
    }

    function testRemoveFriendFailsIfNotFriends() public {
        vm.prank(userA);
        vm.expectRevert("Not friends");
        cySpace.removeFriend(userA, userB);
    }
}
