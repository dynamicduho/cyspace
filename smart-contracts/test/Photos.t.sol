// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/CySpaceNetwork.sol";

contract CySpaceNetworkPhotoTest is Test {
    CySpaceNetwork cySpace;
    address owner = address(1);
    address alice = address(2);
    address constant photoAlbum = 0xD21a706977C68E23dEB9eDf0C93D512bbfd2B20C;

    event PhotoCreated(
        address indexed author,
        string caption,
        uint256 timestamp
    );

    function setUp() public {
        vm.prank(owner);
        cySpace = new CySpaceNetwork(owner);
    }

    function testCreatePhoto() public {
        string memory caption = "This is a valid caption for my photo.";

        vm.expectEmit(true, false, false, true);
        emit PhotoCreated(alice, caption, block.timestamp);

        vm.prank(alice);
        cySpace.createPhoto(caption, photoAlbum);

        (
            address storedAuthor,
            string memory storedCaption,
            address storedContentAddress,
            uint256 storedTimestamp
        ) = cySpace.photos(alice, 0);

        assertEq(storedAuthor, alice);
        assertEq(storedCaption, caption);
        assertEq(storedContentAddress, photoAlbum);
        assertEq(storedTimestamp, block.timestamp);
    }

    function testCreatePhotoCaptionTooLong() public {
        string
            memory longCaption = "This caption is intentionally made extremely long to trigger the CaptionTooLong error in the contract. It definitely exceeds one hundred and forty characters.";

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(CySpaceNetwork.CaptionTooLong.selector)
        );
        cySpace.createPhoto(longCaption, photoAlbum);
    }
}
