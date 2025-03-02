// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ContractRegistry} from "@flarenetwork/flare-periphery-contracts/coston/ContractRegistry.sol";
import {IFdcHub} from "@flarenetwork/flare-periphery-contracts/coston/IFdcHub.sol";
import {IFdcRequestFeeConfigurations} from "@flarenetwork/flare-periphery-contracts/coston/IFdcRequestFeeConfigurations.sol";
import {IJsonApiVerification} from "@flarenetwork/flare-periphery-contracts/coston/IJsonApiVerification.sol";
import {IJsonApi} from "@flarenetwork/flare-periphery-contracts/coston/IJsonApi.sol";

// Struct for the username ID response
struct UsernameIdResponse {
    string id;
}

struct Tweet {
    string id;
    string text;
    string username;
    string createdAt;
}

struct TweetDTO {
    string id;
    string text;
    string username;
    string createdAt;
}

contract TwitterReader {
    mapping(string => Tweet) public tweets;
    string[] public tweetIds;

    event TweetAdded(string tweetId, string text, string username);

    function isJsonApiProofValid(
        IJsonApi.Proof calldata _proof
    ) public view returns (bool) {
        return
            ContractRegistry.auxiliaryGetIJsonApiVerification().verifyJsonApi(
                _proof
            );
    }

    function addTweet(IJsonApi.Proof calldata data) public {
        require(isJsonApiProofValid(data), "Invalid proof");

        TweetDTO memory dto = abi.decode(
            data.data.responseBody.abi_encoded_data,
            (TweetDTO)
        );

        require(bytes(tweets[dto.id].id).length == 0, "Tweet already exists");

        Tweet memory tweet = Tweet({
            id: dto.id,
            text: dto.text,
            username: dto.username,
            createdAt: dto.createdAt
        });

        tweets[dto.id] = tweet;
        tweetIds.push(dto.id);

        emit TweetAdded(dto.id, dto.text, dto.username);
    }

    function getAllTweets() public view returns (Tweet[] memory) {
        Tweet[] memory result = new Tweet[](tweetIds.length);
        for (uint256 i = 0; i < tweetIds.length; i++) {
            result[i] = tweets[tweetIds[i]];
        }
        return result;
    }

    function getFdcHub() external view returns (IFdcHub) {
        return ContractRegistry.getFdcHub();
    }

    function getFdcRequestFeeConfigurations()
        external
        view
        returns (IFdcRequestFeeConfigurations)
    {
        return ContractRegistry.getFdcRequestFeeConfigurations();
    }
} 