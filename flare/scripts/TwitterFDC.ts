import { artifacts, ethers, run } from "hardhat";
import { TwitterReaderInstance } from "../typechain-types";

const TwitterReader = artifacts.require("TwitterReader");
const FDCHub = artifacts.require("@flarenetwork/flare-periphery-contracts/coston/IFdcHub.sol:IFdcHub");

// Simple hex encoding
function toHex(data: string) {
    let result = "";
    for (let i = 0; i < data.length; i++) {
        result += data.charCodeAt(i).toString(16);
    }
    return result.padEnd(64, "0");
}

const { 
    JQ_VERIFIER_URL_TESTNET, 
    JQ_API_KEY, 
    DA_LAYER_URL_COSTON,
    X_BEARER_TOKEN
} = process.env;

// Update this with the deployed contract address
const TWITTER_READER_ADDRESS = "0x47701672178Caca354bE2F05E3158bA98beeCb54";  // or make it dynamic

async function deployTwitterReader() {
    const reader: TwitterReaderInstance = await TwitterReader.new();
    console.log("Twitter Reader deployed at:", reader.address);
    
    // Verify the contract
    const result = await run("verify:verify", {
        address: reader.address,
        constructorArguments: [],
    });

    return reader; // Return the deployed instance
}

async function prepareRequest(username: string) {
    const attestationType = "0x" + toHex("IJsonApi");
    const sourceType = "0x" + toHex("WEB2");
    
    // Now prepare request for a single tweet with simplified fields
    const tweetRequestData = {
        "attestationType": attestationType,
        "sourceId": sourceType,
        "requestBody": {
            "url": `https://raw.githubusercontent.com/ericliujt/DaoCare/refs/heads/master/sampleTwitter.json`,
            "postprocessJq": `{
                id: .data.id,
                text: .data.text,
                username: .data.username,
                createdAt: .data.created_at
            }`,
            "abi_signature": `
                {\"components\": [
                    {\"internalType\": \"string\",\"name\": \"id\",\"type\": \"string\"},
                    {\"internalType\": \"string\",\"name\": \"text\",\"type\": \"string\"},
                    {\"internalType\": \"string\",\"name\": \"username\",\"type\": \"string\"},
                    {\"internalType\": \"string\",\"name\": \"createdAt\",\"type\": \"string\"}
                ],
                \"name\": \"TweetDTO\",\"type\": \"tuple\"}`
        }
    };

    //console.log("Tweets request data:", tweetsRequestData);
    //console.log("Tweets request data json stringify:", JSON.stringify(tweetsRequestData))

    const response = await fetch(
        `${JQ_VERIFIER_URL_TESTNET}JsonApi/prepareRequest`,
        {
            method: "POST",
            headers: {
                ...(JQ_API_KEY ? { "X-API-KEY": JQ_API_KEY } : {}),
                "Content-Type": "application/json",
            },
            body: JSON.stringify(tweetRequestData),
        },
    );
    const data = await response.json();
    console.log("Tweets request response:", data);
    
    // Check if the tweets request is valid
    if (!data.abiEncodedRequest || data.status === 'INVALID') {
        throw new Error(`Failed to prepare tweets request: ${JSON.stringify(data)}`);
    }
    
    return data;
}

const firstVotingRoundStartTs = 1658429955;
const votingEpochDurationSeconds = 90;

async function submitRequest(username: string) {
    try {
        const requestData = await prepareRequest(username);
        
        if (!requestData.abiEncodedRequest) {
            throw new Error(`No abiEncodedRequest in response: ${JSON.stringify(requestData)}`);
        }
        
        const twitterReader = await TwitterReader.at(TWITTER_READER_ADDRESS);
        const fdcHUB = await FDCHub.at(await twitterReader.getFdcHub());

        const tx = await fdcHUB.requestAttestation(requestData.abiEncodedRequest, {
            value: ethers.parseEther("1").toString(),
        });
        console.log("Submitted request:", tx.tx);

        const blockNumber = tx.blockNumber;
        const block = await ethers.provider.getBlock(blockNumber);

        const roundId = Math.floor(
            (block!.timestamp - firstVotingRoundStartTs) / votingEpochDurationSeconds,
        );
        console.log(
            `Check round progress at: https://coston-systems-explorer.flare.rocks/voting-epoch/${roundId}?tab=fdc`,
        );
        return roundId;
    } catch (error) {
        console.error("Error in submitRequest:", error);
        throw error;
    }
}

async function getProof(roundId: number, username: string) {
    const request = await prepareRequest(username);
    console.log("request from getProof:", request);
    console.log("body:", JSON.stringify({votingRoundId: roundId,requestBytes: request.abiEncodedRequest}));
    const proofAndData = await fetch(
        `${DA_LAYER_URL_COSTON}fdc/get-proof-round-id-bytes`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                votingRoundId: roundId,
                requestBytes: request.abiEncodedRequest,
            }),
        },
    );
    //console.log("proofAndData:", await proofAndData.json());

    return await proofAndData.json();
}

async function submitProof(roundId: number, username: string) {
    const dataAndProof = await getProof(roundId, username);
    console.log("dataAndProof:", dataAndProof);

    const twitterReader = await TwitterReader.at(TWITTER_READER_ADDRESS);
    
    const tx = await twitterReader.addTweet({
        merkleProof: dataAndProof.proof,
        data: dataAndProof.response,
    });
    
    const stored_tweets = await twitterReader.getAllTweets();

    console.log("merkleProof:", dataAndProof.proof);
    console.log("Transaction:", tx.tx);
    console.log("Stored tweets:", stored_tweets);
    const show_result = ["merkleProof:", dataAndProof.proof, "Transaction:", tx.tx, "Stored tweets:", stored_tweets]
    return show_result
}

// Update the main function to store the deployed address
async function main() {
    // Deploy the contract and store its address
    // const reader = await deployTwitterReader();
    // const readerAddress = reader.address;
    // console.log("Contract deployed at:", readerAddress);
    
    // Replace with the Twitter username you want to fetch
    const username = "XDevelopers";
    console.log("Username:", username);
    
    // Submit the request to FDC using the newly deployed address
    const roundId = await submitRequest(username);
    console.log("Waiting for round to complete...");
    
    // Wait for some time to allow the round to complete
    await new Promise(resolve => setTimeout(resolve, 90000)); // 1.5 minutes
    
    // Submit the proof
    await submitProof(roundId, username);
}

// Uncomment to run
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 