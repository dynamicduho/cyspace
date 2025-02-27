// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "solmate/auth/Owned.sol";

contract CySpaceNetwork is Owned {
    error NotAuthorized();
    error CaptionTooLong();

    struct Diary {
        address author;
        string text;
        uint256 timestamp;
    }

    struct Photo {
        address author;
        string caption;
        address contentAddress;
        uint256 timestamp;
    }

    /// mappings
    mapping(address => Diary[]) public diaries;
    mapping(address => Photo[]) public photos;
    mapping(address => mapping(address => bool)) public friends;
    mapping(address => bool) public admins;

    /// Events
    event DiaryCreated(address indexed author, string text, uint256 timestamp);
    event PhotoCreated(address indexed author, string caption, uint256 timestamp);
    event FriendAdded(address indexed user, address indexed friend);
    event FriendRemoved(address indexed user, address indexed friend);
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);

    /// Modifier that restricts function access to the owner or an admin.
    modifier onlyAuthorized() {
        if (msg.sender != owner && !admins[msg.sender]) {
            revert NotAuthorized();
        }
        _;
    }

    constructor(address _owner) Owned(_owner) {}

    function addAdmin(address _admin) external onlyOwner {
        admins[_admin] = true;
        emit AdminAdded(_admin);
    }

    function removeAdmin(address _admin) external onlyOwner {
        admins[_admin] = false;
        emit AdminRemoved(_admin);
    }
    
    // friend1 is adding friend2 as friend
    function addFriend(address _friend1, address _friend2) external onlyAuthorized {
        require(_friend1 != _friend2, "Cannot add yourself");
        friends[_friend1][_frien2] = true;
        emit FriendAdded(_friend1, _friend2);
    }

    function removeFriend(address _friend1, address _friend2) external {
        require(friends[_friend1][_friend2], "Not friends");
        friends[_friend1][_friend2] = false;
        emit FriendRemoved(_friend1, _friend2);
    }

    function createDiary(string calldata _text) external {
        diaries[msg.sender].push(Diary(msg.sender, _text, block.timestamp));
        emit DiaryCreated(msg.sender, _text, block.timestamp);
    }

    function createPhoto(string calldata _caption, address _contentAddress) external {
        if (bytes(_caption).length > 140) revert CaptionTooLong();
        photos[msg.sender].push(Photo(msg.sender, _caption, _contentAddress, block.timestamp));
        emit PhotoCreated(msg.sender, _caption, block.timestamp);
    }
}
