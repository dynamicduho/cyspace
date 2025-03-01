const { default: NFTMinter } = require("./mintNFT");
const { CdpWalletProvider } = require("@coinbase/agentkit");

/**
 * Class to generate and manage character-specific quiz questions
 */
class CharacterQuiz {
  /**
   * Creates a new character quiz
   * @param {Object} character - The character to create questions for
   */
  constructor(character) {
    this.character = character;
    this.questions = [];
    this.generateQuestions();
  }

  /**
   * Truncates an answer to a reasonable length
   * @param {string} answer - The answer to truncate
   * @returns {string} Truncated answer
   */
  truncateAnswer(answer) {
    // Split into sentences
    const sentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 0);
    // Take first two sentences
    const limitedSentences = sentences.slice(0, 2);
    // Join and split into words
    const words = limitedSentences.join(". ").split(/\s+/);
    // Take first 25 words
    return words.slice(0, 25).join(" ") + ".";
  }

  /**
   * Generates quiz questions based on character information
   */
  generateQuestions() {
    // Generate questions based on character bio
    if (this.character.bio?.length) {
      // Create more varied questions based on bio content
      const bioQuestions = [
        {
          question: `What is ${this.character.name}'s educational background?`,
          filter: (bio) => bio.includes("studying") || bio.includes("graduate") || bio.includes("university") || bio.includes("education")
        },
        {
          question: `What are ${this.character.name}'s main interests or passions?`,
          filter: (bio) => bio.includes("passion") || bio.includes("interest") || bio.includes("enjoys") || bio.includes("love")
        },
        {
          question: `How would you describe ${this.character.name}'s professional background?`,
          filter: (bio) => bio.includes("work") || bio.includes("career") || bio.includes("professional") || bio.includes("job")
        }
      ];
      
      // Add bio questions that have matching content
      for (const bioQ of bioQuestions) {
        const relevantBio = this.character.bio.filter(bio => bioQ.filter(bio)).join(". ");
        if (relevantBio) {
          this.questions.push({
            question: bioQ.question,
            modelAnswer: this.truncateAnswer(relevantBio),
            category: "Background",
            type: "open"
          });
        }
      }

      // Add a general bio question if we didn't add any specific ones
      if (!this.questions.some(q => q.category === "Background")) {
        this.questions.push({
          question: `What can you tell me about ${this.character.name}'s background?`,
          modelAnswer: this.truncateAnswer(this.character.bio.join(". ")),
          category: "Background",
          type: "open"
        });
      }
    }

    // Generate questions based on knowledge
    if (this.character.knowledge?.length) {
      // Create more varied questions based on knowledge content
      const knowledgeQuestions = [
        {
          question: `What technical skills does ${this.character.name} possess?`,
          filter: (k) => k.includes("technical") || k.includes("programming") || k.includes("coding") || k.includes("development")
        },
        {
          question: `What areas of expertise does ${this.character.name} have?`,
          filter: (k) => k.includes("expert") || k.includes("proficient") || k.includes("skilled") || k.includes("experienced")
        },
        {
          question: `What languages or frameworks is ${this.character.name} familiar with?`,
          filter: (k) => k.includes("language") || k.includes("framework") || k.includes("familiar") || k.includes("fluent")
        }
      ];
      
      // Add knowledge questions that have matching content
      for (const kQ of knowledgeQuestions) {
        const relevantKnowledge = this.character.knowledge.filter(k => kQ.filter(k)).join(". ");
        if (relevantKnowledge) {
          this.questions.push({
            question: kQ.question,
            modelAnswer: this.truncateAnswer(relevantKnowledge),
            category: "Skills",
            type: "open"
          });
        }
      }

      // Add a general knowledge question if we didn't add any specific ones
      if (!this.questions.some(q => q.category === "Skills")) {
        this.questions.push({
          question: `What knowledge areas is ${this.character.name} familiar with?`,
          modelAnswer: this.truncateAnswer(this.character.knowledge.join(". ")),
          category: "Skills",
          type: "open"
        });
      }
    }

    // Generate personality-based questions
    if (this.character.style?.all?.length) {
      this.questions.push({
        question: `How would you describe ${this.character.name}'s personality and communication style?`,
        modelAnswer: this.truncateAnswer(this.character.style.all.join(". ")),
        category: "Personality",
        type: "open"
      });
    }

    // Add some True/False questions based on character data
    if (this.character.bio?.length) {
      // Create one true statement from bio
      const trueBio = this.character.bio[Math.floor(Math.random() * this.character.bio.length)];
      this.questions.push({
        question: `True or False: ${this.character.name} ${trueBio.split(" ").slice(1).join(" ")}`,
        modelAnswer: "True",
        category: "General",
        type: "boolean"
      });
    }

    // Add some false statements
    const falseStatements = [
      `${this.character.name} is a professional chef with Michelin star experience.`,
      `${this.character.name} has never participated in a hackathon.`,
      `${this.character.name} is a professional musician performing in concerts.`
    ];

    // Add 1-2 false statements
    for (let i = 0; i < Math.min(1, falseStatements.length); i++) {
      this.questions.push({
        question: `True or False: ${falseStatements[i]}`,
        modelAnswer: "False",
        category: "General",
        type: "boolean"
      });
    }
    
    // If we don't have enough questions, add some generic ones
    if (this.questions.length < 5) {
      this.questions.push({
        question: `What makes ${this.character.name} unique compared to others?`,
        modelAnswer: this.truncateAnswer(
          (this.character.bio?.[0] || "") + ". " + 
          (this.character.style?.all?.[0] || "")
        ),
        category: "Personality",
        type: "open"
      });
    }
  }

  /**
   * Gets a random selection of questions
   * @param {number} count - Number of questions to return
   * @returns {Array} Array of random quiz questions
   */
  getRandomQuestions(count) {
    const selectedQuestions = [];
    const usedIndices = new Set();

    // Ensure we have at least 2 open-ended questions
    const openQuestions = this.questions.filter(q => q.type === "open");
    const booleanQuestions = this.questions.filter(q => q.type === "boolean");

    // Select open-ended questions first
    while (selectedQuestions.length < Math.min(2, openQuestions.length)) {
      const randomIndex = Math.floor(Math.random() * openQuestions.length);
      if (!usedIndices.has(randomIndex)) {
        usedIndices.add(randomIndex);
        selectedQuestions.push(openQuestions[randomIndex]);
      }
    }

    // Fill the rest with a mix of questions
    while (selectedQuestions.length < count && usedIndices.size < this.questions.length) {
      const randomIndex = Math.floor(Math.random() * this.questions.length);
      if (!usedIndices.has(randomIndex)) {
        usedIndices.add(randomIndex);
        selectedQuestions.push(this.questions[randomIndex]);
      }
    }

    return selectedQuestions;
  }

  /**
   * Evaluates a user's answer to a question
   * @param {Object} question - The question being answered
   * @param {string} answer - The user's answer
   * @returns {number} Score between 0 and 1
   */
  evaluateAnswer(question, answer) {
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
    return this.calculateSimpleSimilarity(answer, question.modelAnswer);
  }

  /**
   * Calculates text similarity between two strings
   * @param {string} text1 - First text
   * @param {string} text2 - Second text
   * @returns {number} Similarity score between 0 and 1
   */
  calculateSimpleSimilarity(text1, text2) {
    // Convert texts to lowercase and split into words
    const words1 = text1.toLowerCase().split(/\W+/).filter(w => w.length > 2);
    const words2 = text2.toLowerCase().split(/\W+/).filter(w => w.length > 2);

    // Create a set of unique words from both texts
    const uniqueWords = new Set([...words1, ...words2]);

    // Create term frequency vectors
    const vector1 = Array.from(uniqueWords).map(word => 
      words1.filter(w => w === word).length
    );
    const vector2 = Array.from(uniqueWords).map(word => 
      words2.filter(w => w === word).length
    );

    // Calculate cosine similarity
    const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
    const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));

    // Avoid division by zero
    if (magnitude1 === 0 || magnitude2 === 0) return 0;

    const similarity = dotProduct / (magnitude1 * magnitude2);
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
    
    // Ensure the result is between 0 and 1
    return Math.max(0, Math.min(1, normalizedScore));
  }
}

/**
 * Helper function to get feedback based on score
 * @param {number} score - The score to provide feedback for
 * @returns {string} Feedback message
 */
function getScoreFeedback(score) {
  if (score >= 0.8) return "Excellent answer!";
  if (score >= 0.6) return "Good answer!";
  if (score >= 0.4) return "Decent answer, but could include more details.";
  if (score >= 0.2) return "Partially correct, but missing key information.";
  return "That's not quite right. Let's move on to the next question.";
}

/**
 * Manages character quizzes and NFT rewards
 */
class CharacterQuizManager {
  /**
   * Creates a new quiz manager for a character
   * @param {Object} character - The character to create a quiz for
   * @param {Object} walletProvider - Optional wallet provider for NFT minting
   */
  constructor(character, walletProvider) {
    this.character = character;
    this.quiz = new CharacterQuiz(character);
    this.isActive = false;
    this.currentQuestionIndex = 0;
    this.questions = [];
    this.scores = [];
    this.availableCharacters = [];
    this.userWalletAddress = null;
    this.walletProvider = null;
    this.nftMinter = null;
    
    if (walletProvider) {
      this.walletProvider = walletProvider;
      this.nftMinter = new NFTMinter();
    }
  }

  /**
   * Checks if the quiz is currently active
   * @returns {boolean} True if quiz is active
   */
  isQuizActive() {
    return this.isActive;
  }

  /**
   * Gets the current question index
   * @returns {number} Current question index
   */
  getCurrentQuestionIndex() {
    return this.currentQuestionIndex;
  }

  /**
   * Gets the character name
   * @returns {string} Character name
   */
  getCharacterName() {
    return this.character.name;
  }

  /**
   * Gets the user's wallet address
   * @returns {string|null} User's wallet address or null
   */
  getWalletAddress() {
    return this.userWalletAddress;
  }

  /**
   * Starts a new quiz
   * @returns {string} Welcome message with first question
   */
  start() {
    this.isActive = true;
    this.currentQuestionIndex = 0;
    this.scores = [];
    this.questions = this.quiz.getRandomQuestions(5);
    return `Let's test your knowledge about ${this.character.name}! I'll ask you ${this.questions.length} questions. Here we go:`;
  }

  /**
   * Gets the next question in the quiz
   * @returns {string|null} Next question or null if quiz is complete
   */
  getNextQuestion() {
    if (!this.isActive || this.currentQuestionIndex >= this.questions.length) {
      return null;
    }
    
    const question = this.questions[this.currentQuestionIndex];
    let questionText = `Question ${this.currentQuestionIndex + 1}: ${question.question}`;
    
    if (question.type === "boolean") {
      questionText += " (Please answer with 'True' or 'False')";
    }
    
    this.currentQuestionIndex++;
    return questionText;
  }

  /**
   * Resets the quiz to initial state
   */
  resetQuiz() {
    this.isActive = false;
    this.currentQuestionIndex = 0;
    this.scores = [];
  }

  /**
   * Set the user's wallet address for NFT minting
   * @param {string} address - Ethereum wallet address
   * @returns {boolean} True if address is valid
   */
  setWalletAddress(address) {
    // Simple validation
    if (/^0x[a-fA-F0-9]{40}$/.test(address)) {
      this.userWalletAddress = address;
      return true;
    }
    return false;
  }

  /**
   * Set the wallet provider for NFT minting
   * @param {Object} walletProvider - CDP wallet provider
   */
  setWalletProvider(walletProvider) {
    this.walletProvider = walletProvider;
    this.nftMinter = new NFTMinter();
  }

  /**
   * Submits an answer to the current question
   * @param {string} answer - User's answer to the question
   * @returns {Promise<string>} Feedback and next question
   */
  async submitAnswer(answer) {
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

  /**
   * Mint an NFT for the user based on their quiz performance
   * @param {number} score - The user's quiz score (0-100)
   * @returns {Promise<string>} Promise with minting result message
   */
  async mintNFT(score) {
    if (!this.userWalletAddress) {
      return "Cannot mint NFT: No wallet address provided. Please set your wallet address first.";
    }

    if (!this.nftMinter || !this.walletProvider) {
      // If no wallet provider was set, create a simulated NFT
      console.log("No wallet provider available, simulating NFT mint");
      const mockTxHash = "0x" + Math.random().toString(16).substring(2, 42);
      const mockTokenId = Math.floor(Math.random() * 10000);
      
      return (
        `Successfully minted a ${this.character.name} Quiz NFT! (SIMULATED)\n` +
        `Score: ${score}%\n` +
        `Token ID: ${mockTokenId}\n` +
        `Transaction: ${mockTxHash}\n` +
        `Recipient: ${this.userWalletAddress}`
      );
    }

    try {
      // Use the NFTMinter to mint the NFT
      const mintResult = await this.nftMinter.mintNFT(
        this.character.name,
        this.userWalletAddress,
        score,
      );

      if (mintResult.success) {
        return mintResult.message;
      } else {
        return `Failed to mint NFT: ${mintResult.message}`;
      }
    } catch (error) {
      console.error("Error minting NFT:", error);
      return "Failed to mint NFT. Please try again later.";
    }
  }
}

module.exports = { CharacterQuizManager }; 