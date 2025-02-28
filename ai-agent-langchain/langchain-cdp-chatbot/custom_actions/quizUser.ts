import * as fs from 'fs';
import * as path from 'path';
import { Character } from '../characters';
import NFTMinter from './mintNFT';
import { CdpWalletProvider } from "@coinbase/agentkit";

// Define interfaces for QuizQuestion
interface QuizQuestion {
  question: string;
  modelAnswer: string;
  category: string;
  type: "open" | "boolean";
}

class CharacterQuiz {
  private character: Character;
  private questions: QuizQuestion[] = [];

  constructor(character: Character) {
    this.character = character;
    this.generateQuestions();
  }

  private generateQuestions(): void {
    // Generate questions based on character bio
    if (this.character.bio?.length) {
      this.character.bio.forEach(bioItem => {
        // Create a question about the character's background
        this.questions.push({
          question: `What aspect of ${this.character.name}'s background involves ${bioItem.split(" ").slice(0, 3).join(" ")}...?`,
          modelAnswer: bioItem,
          category: "bio",
          type: "open"
        });
        
        // Create a true/false question about the character's background
        this.questions.push({
          question: `True or False: ${this.character.name} ${bioItem.split(" ").slice(1).join(" ")}?`,
          modelAnswer: "True",
          category: "bio",
          type: "boolean"
        });
      });
    }

    // Generate questions based on knowledge
    if (this.character.knowledge?.length) {
      this.character.knowledge.forEach(knowledgeItem => {
        // Create a question about what the character knows
        this.questions.push({
          question: `What does ${this.character.name} know about ${knowledgeItem}?`,
          modelAnswer: `${this.character.name} has knowledge about ${knowledgeItem}`,
          category: "knowledge",
          type: "open"
        });
        
        // Create a question asking for examples
        this.questions.push({
          question: `Can you give an example of how ${this.character.name} might use their knowledge of ${knowledgeItem}?`,
          modelAnswer: `${this.character.name} might use their knowledge of ${knowledgeItem} in various scenarios`,
          category: "knowledge",
          type: "open"
        });
      });
    }

    // Generate questions based on communication style
    if (this.character.style?.all?.length) {
      this.character.style.all.forEach(styleItem => {
        // Create a question about the character's communication style
        this.questions.push({
          question: `How would you describe ${this.character.name}'s communication style regarding ${styleItem.split(" ").slice(0, 3).join(" ")}...?`,
          modelAnswer: styleItem,
          category: "style",
          type: "open"
        });
        
        // Create a question asking for an example of the style
        this.questions.push({
          question: `Give an example of how ${this.character.name} demonstrates being "${styleItem}"`,
          modelAnswer: `${this.character.name} demonstrates ${styleItem} by...`,
          category: "style",
          type: "open"
        });
      });
    }
    
    // Add blockchain-specific questions for Eric
    if (this.character.name.toLowerCase() === "eric") {
      const blockchainQuestions: QuizQuestion[] = [
        {
          question: "What is a blockchain and how does it work?",
          modelAnswer: "A blockchain is a distributed, immutable ledger that records transactions across many computers. It works through consensus mechanisms like Proof of Work or Proof of Stake to validate transactions without a central authority.",
          category: "blockchain",
          type: "open"
        },
        {
          question: "What is a smart contract?",
          modelAnswer: "A smart contract is a self-executing contract with the terms directly written into code. It automatically enforces and executes agreements when predetermined conditions are met, without the need for intermediaries.",
          category: "blockchain",
          type: "open"
        },
        {
          question: "What is DeFi and why is it important?",
          modelAnswer: "DeFi (Decentralized Finance) refers to financial applications built on blockchain technology that aim to recreate and improve upon traditional financial systems without centralized intermediaries. It's important because it provides open, permissionless access to financial services globally.",
          category: "blockchain",
          type: "open"
        },
        {
          question: "What is the difference between a hot wallet and a cold wallet?",
          modelAnswer: "A hot wallet is connected to the internet and allows for quick transactions but may be more vulnerable to attacks. A cold wallet is kept offline, providing better security but less convenience for frequent transactions.",
          category: "blockchain",
          type: "open"
        },
        {
          question: "True or False: NFTs can only represent digital art.",
          modelAnswer: "False",
          category: "blockchain",
          type: "boolean"
        }
      ];
      
      this.questions = [...this.questions, ...blockchainQuestions];
    }
  }

  public getRandomQuestions(count: number): QuizQuestion[] {
    // Shuffle questions and return requested count
    const shuffled = [...this.questions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  public evaluateAnswer(question: QuizQuestion, answer: string): number {
    // For boolean questions, check exact match
    if (question.type === "boolean") {
      const normalizedAnswer = answer.toLowerCase().trim();
      const isTrue = normalizedAnswer === "true" || normalizedAnswer === "t" || normalizedAnswer === "yes";
      const isFalse = normalizedAnswer === "false" || normalizedAnswer === "f" || normalizedAnswer === "no";
      
      if (question.modelAnswer.toLowerCase() === "true" && isTrue) return 1.0;
      if (question.modelAnswer.toLowerCase() === "false" && isFalse) return 1.0;
      return 0.0;
    }
    
    // For open questions, use semantic similarity
    // Simple evaluation using cosine similarity of word vectors
    const modelWords = question.modelAnswer.toLowerCase().split(/\s+/).filter(Boolean);
    const answerWords = answer.toLowerCase().split(/\s+/).filter(Boolean);
    
    // Create word frequency maps
    const modelFreq: Record<string, number> = {};
    const answerFreq: Record<string, number> = {};
    
    modelWords.forEach(word => {
      modelFreq[word] = (modelFreq[word] || 0) + 1;
    });
    
    answerWords.forEach(word => {
      answerFreq[word] = (answerFreq[word] || 0) + 1;
    });
    
    // Get all unique words
    const allWords = new Set([...Object.keys(modelFreq), ...Object.keys(answerFreq)]);
    
    // Calculate dot product
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;
    
    allWords.forEach(word => {
      const val1 = modelFreq[word] || 0;
      const val2 = answerFreq[word] || 0;
      
      dotProduct += val1 * val2;
      magnitude1 += val1 * val1;
      magnitude2 += val2 * val2;
    });
    
    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);
    
    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }
    
    // Calculate cosine similarity
    const similarity = dotProduct / (magnitude1 * magnitude2);
    
    // Apply a curve to the similarity score to make it more forgiving
    let normalizedScore = 0;
    
    if (similarity < 0.1) {
      normalizedScore = similarity * 4.1;
    } else if (similarity < 0.2) {
      normalizedScore = similarity * 3.2;
    } else if (similarity < 0.5) {
      normalizedScore = similarity * 2.3;
    } else if (similarity < 0.8) {
      normalizedScore = similarity * 1.2;
    } else {
      normalizedScore = similarity;
    }
    
    return Math.min(1, normalizedScore);
  }
}

// Helper function to get feedback based on score
function getScoreFeedback(score: number): string {
  if (score >= 0.8) return "Excellent answer!";
  if (score >= 0.6) return "Good answer!";
  if (score >= 0.4) return "Decent answer, but could include more details.";
  if (score >= 0.2) return "Partially correct, but missing key information.";
  return "That's not quite right. Let's move on to the next question.";
}

export class CharacterQuizManager {
  private character: Character;
  private quiz: CharacterQuiz;
  private isActive: boolean = false;
  private currentQuestionIndex: number = 0;
  private questions: QuizQuestion[] = [];
  private scores: number[] = [];
  private availableCharacters: string[] = [];
  private userWalletAddress: string | null = null;
  private walletProvider: CdpWalletProvider | null = null;
  private nftMinter: NFTMinter | null = null;

  constructor(character: Character, walletProvider?: CdpWalletProvider) {
    this.character = character;
    this.quiz = new CharacterQuiz(character);
    
    if (walletProvider) {
      this.walletProvider = walletProvider;
      this.nftMinter = new NFTMinter(walletProvider);
    }
  }

  public start(): string {
    this.isActive = true;
    this.currentQuestionIndex = 0;
    this.scores = [];
    this.questions = this.quiz.getRandomQuestions(5);
    return `Let's test your knowledge about ${this.character.name}! I'll ask you ${this.questions.length} questions. Here we go:`;
  }

  public getNextQuestion(): string | null {
    if (!this.isActive || this.currentQuestionIndex >= this.questions.length) {
      return null;
    }
    
    const question = this.questions[this.currentQuestionIndex];
    this.currentQuestionIndex++;
    return question.question;
  }

  public async submitAnswer(answer: string): Promise<string> {
    if (!this.isActive || this.currentQuestionIndex <= 0) {
      return "No active question to answer.";
    }

    const previousQuestion = this.questions[this.currentQuestionIndex - 1];
    const score = this.quiz.evaluateAnswer(previousQuestion, answer);
    this.scores.push(score);
    
    // Provide feedback
    const feedback = getScoreFeedback(score);
    
    // Check if we've reached the end of the quiz
    if (this.currentQuestionIndex >= this.questions.length) {
      // Calculate final score
      const totalScore = this.scores.reduce((sum, score) => sum + score, 0);
      const averageScore = totalScore / this.scores.length;
      const percentScore = Math.round(averageScore * 100);
      
      // End the quiz
      this.isActive = false;
      
      // If user has provided a wallet address and score is good, mint an NFT
      if (this.userWalletAddress && percentScore >= 60) {
        const mintResult = await this.mintNFT(percentScore);
        return `${feedback}\n\nQuiz completed! Your final score is ${percentScore}%.\n\n${mintResult}`;
      }
      
      return `${feedback}\n\nQuiz completed! Your final score is ${percentScore}%.`;
    }
    
    // Get the next question
    const nextQuestion = this.getNextQuestion();
    return `${feedback}\n\n${nextQuestion}`;
  }

  public isQuizActive(): boolean {
    return this.isActive;
  }

  public getCurrentQuestionIndex(): number {
    return this.currentQuestionIndex;
  }

  public resetQuiz(): void {
    this.isActive = false;
    this.currentQuestionIndex = 0;
    this.scores = [];
  }

  public getCharacterName(): string {
    return this.character.name;
  }

  /**
   * Set the user's wallet address for NFT minting
   */
  public setWalletAddress(address: string): boolean {
    // Simple validation
    if (/^0x[a-fA-F0-9]{40}$/.test(address)) {
      this.userWalletAddress = address;
      return true;
    }
    return false;
  }

  /**
   * Get the user's wallet address
   */
  public getWalletAddress(): string | null {
    return this.userWalletAddress;
  }

  /**
   * Set the wallet provider for NFT minting
   * @param walletProvider CDP wallet provider
   */
  public setWalletProvider(walletProvider: CdpWalletProvider): void {
    this.walletProvider = walletProvider;
    this.nftMinter = new NFTMinter(walletProvider);
  }

  /**
   * Mint an NFT for the user based on their quiz performance
   * @param score The user's quiz score (0-100)
   * @returns Promise with minting result message
   */
  public async mintNFT(score: number): Promise<string> {
    if (!this.userWalletAddress) {
      return "Cannot mint NFT: No wallet address provided. Please set your wallet address first.";
    }

    if (!this.nftMinter || !this.walletProvider) {
      // If no wallet provider was set, create a simulated NFT
      console.log("No wallet provider available, simulating NFT mint");
      const mockTxHash = '0x' + Math.random().toString(16).substring(2, 42);
      const mockTokenId = Math.floor(Math.random() * 10000);
      
      return `Successfully minted a ${this.character.name} Quiz NFT! (SIMULATED)\n` +
             `Score: ${score}%\n` +
             `Token ID: ${mockTokenId}\n` +
             `Transaction: ${mockTxHash}\n` +
             `Recipient: ${this.userWalletAddress}`;
    }

    try {
      // Use the NFTMinter to mint the NFT
      const mintResult = await this.nftMinter.mintNFT(
        this.character.name,
        this.userWalletAddress,
        score
      );

      if (mintResult.success) {
        return mintResult.message;
      } else {
        return `Failed to mint NFT: ${mintResult.message}`;
      }
    } catch (error) {
      console.error('Error minting NFT:', error);
      return 'Failed to mint NFT. Please try again later.';
    }
  }
} 