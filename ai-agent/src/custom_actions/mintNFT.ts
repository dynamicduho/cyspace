import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

// Define interfaces for NFT minting
interface MintNFTRequest {
  characterName: string;
  recipientAddress: string;
  quizScore: number;
  timestamp: number;
  metadata: NFTMetadata;
}

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: NFTAttribute[];
}

interface NFTAttribute {
  trait_type: string;
  value: string | number;
}

interface MintNFTResponse {
  success: boolean;
  transactionHash?: string;
  tokenId?: number;
  message: string;
  tokenURI?: string;
}

/**
 * Class to handle NFT minting operations
 */
export class NFTMinter {
  private apiEndpoint: string;
  private apiKey: string;
  private contractAddress: string;
  
  constructor() {
    // Load configuration from environment or config file
    this.apiEndpoint = process.env.MINT_API_ENDPOINT || 'https://api.cyspace.ai/mint';
    this.apiKey = process.env.MINT_API_KEY || this.loadApiKey();
    this.contractAddress = process.env.NFT_CONTRACT_ADDRESS || this.loadContractAddress();
  }

  /**
   * Load API key from a config file
   */
  private loadApiKey(): string {
    try {
      const configPath = path.join(process.cwd(), 'config', 'secrets.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return config.mintApiKey || '';
      }
    } catch (error) {
      console.error('Error loading API key:', error);
    }
    return '';
  }

  /**
   * Load contract address from a config file
   */
  private loadContractAddress(): string {
    try {
      const configPath = path.join(process.cwd(), 'config', 'contracts.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return config.nftContractAddress || '';
      }
    } catch (error) {
      console.error('Error loading contract address:', error);
    }
    return '';
  }

  /**
   * Validate Ethereum address format
   */
  private isValidEthereumAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Generate metadata for the NFT based on character and quiz score
   */
  private generateNFTMetadata(characterName: string, quizScore: number): NFTMetadata {
    const timestamp = new Date().toISOString();
    const scoreLevel = this.getScoreLevel(quizScore);
    
    return {
      name: `${characterName.toUpperCase()} Quiz Champion`,
      description: `This NFT certifies that the holder successfully completed the ${characterName} knowledge quiz with a score of ${quizScore}%.`,
      image: `https://api.cyspace.ai/nft-images/${characterName.toLowerCase()}_${scoreLevel}.png`,
      attributes: [
        {
          trait_type: "Character",
          value: characterName
        },
        {
          trait_type: "Quiz Score",
          value: quizScore
        },
        {
          trait_type: "Achievement Level",
          value: scoreLevel
        },
        {
          trait_type: "Completion Date",
          value: timestamp.split('T')[0]
        }
      ]
    };
  }

  /**
   * Get achievement level based on score
   */
  private getScoreLevel(score: number): string {
    if (score >= 90) return "legendary";
    if (score >= 80) return "expert";
    if (score >= 70) return "advanced";
    return "novice";
  }

  /**
   * Mint an NFT for a user who completed the quiz
   * @param characterName The character who conducted the quiz
   * @param recipientAddress The Ethereum address to receive the NFT
   * @param quizScore The user's score on the quiz (0-100)
   * @returns Promise with minting result
   */
  public async mintNFT(
    characterName: string, 
    recipientAddress: string, 
    quizScore: number
  ): Promise<MintNFTResponse> {
    // Validate inputs
    if (!this.isValidEthereumAddress(recipientAddress)) {
      return {
        success: false,
        message: 'Invalid Ethereum address format. Please provide a valid address.'
      };
    }

    if (quizScore < 0 || quizScore > 100) {
      return {
        success: false,
        message: 'Invalid quiz score. Score must be between 0 and 100.'
      };
    }

    // Only allow minting for scores above a threshold
    if (quizScore < 60) {
      return {
        success: false,
        message: `Your score of ${quizScore}% is below the required threshold of 60% to mint an NFT.`
      };
    }

    try {
      // Generate metadata for the NFT
      const metadata = this.generateNFTMetadata(characterName, quizScore);
      
      // Prepare request data
      const requestData: MintNFTRequest = {
        characterName,
        recipientAddress,
        quizScore,
        timestamp: Date.now(),
        metadata
      };

      // In development mode, simulate a successful mint
      if (process.env.NODE_ENV === 'development' || !this.apiKey) {
        console.log('Development mode: Simulating NFT mint', requestData);
        const mockTokenId = Math.floor(Math.random() * 10000);
        const mockTxHash = '0x' + Math.random().toString(16).substring(2, 42);
        
        return {
          success: true,
          transactionHash: mockTxHash,
          tokenId: mockTokenId,
          tokenURI: `ipfs://QmXyz/${mockTokenId}`,
          message: `Successfully minted a ${characterName} NFT! This is a simulated transaction in development mode.\nToken ID: ${mockTokenId}\nTransaction: ${mockTxHash}`
        };
      }

      // Make API request to mint the NFT
      const response = await axios.post(this.apiEndpoint, requestData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      // The API should call the mint function on the CySpaceNFT contract
      // with the recipient address and tokenURI
      return {
        success: true,
        transactionHash: response.data.transactionHash,
        tokenId: response.data.tokenId,
        tokenURI: response.data.tokenURI,
        message: `Successfully minted a ${characterName} NFT!\n` +
                 `Token ID: ${response.data.tokenId}\n` +
                 `View on Etherscan: https://etherscan.io/tx/${response.data.transactionHash}`
      };
    } catch (error) {
      console.error('Error minting NFT:', error);
      return {
        success: false,
        message: 'Failed to mint NFT. Please try again later.'
      };
    }
  }
}

// Export a singleton instance
export const nftMinter = new NFTMinter();

// Export default for direct imports
export default nftMinter; 