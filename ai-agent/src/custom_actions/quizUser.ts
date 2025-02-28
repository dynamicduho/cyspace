import * as fs from 'fs';
import * as path from 'path';
import { nftMinter } from './mintNFT';

// Define interfaces for Character and QuizQuestion
interface Character {
    name: string;
    bio?: string[];
    knowledge?: string[];
    topics?: string[];
    lore?: string[];
    style?: {
        all?: string[];
    };
}

interface QuizQuestion {
    question: string;
    modelAnswer: string;
    category: string;
    type: 'open' | 'boolean';
}

class CharacterQuiz {
    private character: Character;
    private questions: QuizQuestion[] = [];

    constructor(character: Character) {
        this.character = character;
        this.generateQuestions();
    }

    private truncateAnswer(answer: string): string {
        // Split into sentences
        const sentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 0);
        // Take first two sentences
        const limitedSentences = sentences.slice(0, 2);
        // Join and split into words
        const words = limitedSentences.join('. ').split(/\s+/);
        // Take first 25 words
        return words.slice(0, 25).join(' ') + '.';
    }

    private generateQuestions(): void {
        // Generate open-ended questions based on bio
        if (this.character.bio?.length) {
            // Create more varied questions based on bio content
            const bioQuestions = [
                {
                    question: `What is ${this.character.name}'s educational background?`,
                    filter: (bio: string) => bio.includes("studying") || bio.includes("graduate") || bio.includes("university") || bio.includes("education")
                },
                {
                    question: `What are ${this.character.name}'s main interests or passions?`,
                    filter: (bio: string) => bio.includes("passion") || bio.includes("interest") || bio.includes("enjoys") || bio.includes("love")
                },
                {
                    question: `How would you describe ${this.character.name}'s professional background?`,
                    filter: (bio: string) => bio.includes("work") || bio.includes("career") || bio.includes("professional") || bio.includes("job")
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
                        type: 'open'
                    });
                }
            }
        }

        // Generate questions based on knowledge
        if (this.character.knowledge?.length) {
            // Create more varied questions based on knowledge content
            const knowledgeQuestions = [
                {
                    question: `What technical skills does ${this.character.name} possess?`,
                    filter: (k: string) => k.includes("technical") || k.includes("programming") || k.includes("coding") || k.includes("development")
                },
                {
                    question: `What areas of expertise does ${this.character.name} have?`,
                    filter: (k: string) => k.includes("expert") || k.includes("proficient") || k.includes("skilled") || k.includes("experienced")
                },
                {
                    question: `What languages or frameworks is ${this.character.name} familiar with?`,
                    filter: (k: string) => k.includes("language") || k.includes("framework") || k.includes("familiar") || k.includes("fluent")
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
                        type: 'open'
                    });
                }
            }
        }

        // Generate questions based on lore/experiences
        if (this.character.lore?.length) {
            this.questions.push({
                question: `What are some notable experiences or achievements in ${this.character.name}'s life?`,
                modelAnswer: this.truncateAnswer(this.character.lore.slice(0, 2).join(". ")),
                category: "Experiences",
                type: 'open'
            });
        }

        // Generate personality-based questions
        if (this.character.style?.all?.length) {
            this.questions.push({
                question: `How would you describe ${this.character.name}'s personality and communication style?`,
                modelAnswer: this.truncateAnswer(this.character.style.all.slice(0, 2).join(". ")),
                category: "Personality",
                type: 'open'
            });
        }

        // Generate hobby-based questions
        const hobbies = this.character.topics?.filter(topic => 
            !topic.includes("technology") && !topic.includes("development"));
        if (hobbies?.length) {
            this.questions.push({
                question: `What are ${this.character.name}'s main hobbies and interests outside of work?`,
                modelAnswer: this.truncateAnswer(hobbies.slice(0, 3).join(", ")),
                category: "Hobbies",
                type: 'open'
            });
        }

        // Add some True/False questions based on character data
        if (this.character.lore?.length) {
            // Create one true statement from lore
            const trueLore = this.character.lore[Math.floor(Math.random() * this.character.lore.length)];
            this.questions.push({
                question: `True or False: ${trueLore}`,
                modelAnswer: "True",
                category: "General",
                type: 'boolean'
            });
        }

        // Add some false statements
        const falseStatements = [
            `${this.character.name} is a professional chef with Michelin star experience.`,
            `${this.character.name} has never participated in a hackathon.`,
            `${this.character.name} is a professional musician performing in concerts.`
        ];

        // Add 1-2 false statements
        for (let i = 0; i < Math.min(2, falseStatements.length); i++) {
            this.questions.push({
                question: `True or False: ${falseStatements[i]}`,
                modelAnswer: "False",
                category: "General",
                type: 'boolean'
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
                type: 'open'
            });
        }
    }

    public getRandomQuestions(numQuestions: number = 5): QuizQuestion[] {
        const selectedQuestions: QuizQuestion[] = [];
        const usedIndices = new Set<number>();

        // Ensure we have at least 2 open-ended questions
        const openQuestions = this.questions.filter(q => q.type === 'open');
        const booleanQuestions = this.questions.filter(q => q.type === 'boolean');

        // Select open-ended questions first
        while (selectedQuestions.length < Math.min(2, openQuestions.length)) {
            const randomIndex = Math.floor(Math.random() * openQuestions.length);
            if (!usedIndices.has(randomIndex)) {
                usedIndices.add(randomIndex);
                selectedQuestions.push(openQuestions[randomIndex]);
            }
        }

        // Fill the rest with a mix of questions
        while (selectedQuestions.length < numQuestions && usedIndices.size < this.questions.length) {
            const randomIndex = Math.floor(Math.random() * this.questions.length);
            if (!usedIndices.has(randomIndex)) {
                usedIndices.add(randomIndex);
                selectedQuestions.push(this.questions[randomIndex]);
            }
        }

        return selectedQuestions;
    }

    public evaluateAnswer(question: QuizQuestion, userAnswer: string): number {
        if (question.type === 'boolean') {
            return userAnswer.toLowerCase() === question.modelAnswer.toLowerCase() ? 1 : 0;
        }

        // For open-ended questions, we'll use a simple text similarity
        return this.calculateSimpleSimilarity(userAnswer, question.modelAnswer);
    }

    private calculateSimpleSimilarity(text1: string, text2: string): number {
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
        let normalized_score = 0;
        if (similarity < 0.1) {
            normalized_score = similarity * 4.1;
        } else if (similarity < 0.2) {
            normalized_score = similarity * 3.2;
        } else if (similarity < 0.5) {
            normalized_score = similarity * 2.3;
        } else if (similarity < 0.8) {
            normalized_score = similarity * 1.2;
        } else {
            normalized_score = similarity;
        }
        // Ensure the result is between 0 and 1
        return Math.max(0, Math.min(1, normalized_score));
    }
}

// Helper function to load a character
function loadCharacter(characterName: string): Character {
    try {
        // Try different possible paths
        const possiblePaths = [
            path.join(process.cwd(), 'src', 'characters', `${characterName}.character.json`),
            path.join(process.cwd(), 'characters', `${characterName}.character.json`)
        ];

        for (const filePath of possiblePaths) {
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                return JSON.parse(content) as Character;
            } catch (e) {
                continue;
            }
        }
        throw new Error(`Character file not found for: ${characterName}`);
    } catch (error) {
        console.error(`Error loading character: ${error}`);
        // Return a minimal character to avoid crashing
        return { 
            name: characterName || "Unknown",
            bio: [
                "studying with a passion for technology",
                "involved in various tech communities",
                "enjoys learning new skills in free time",
                "experimenting with different hobbies"
            ],
            knowledge: [
                "understands technical concepts deeply",
                "familiar with various frameworks",
                "knows multiple creative skills",
                "experienced with project management"
            ],
            lore: [
                "has participated in various community events",
                "learned new skills through online resources"
            ],
            style: {
                all: [
                    "asks detailed follow-up questions",
                    "combines technical and casual language"
                ]
            },
            topics: [
                "technology",
                "creative hobbies",
                "learning experiences",
                "community participation"
            ]
        };
    }
}

// Helper function to get feedback based on score
function getScoreFeedback(score: number): string {
    if (score >= 0.8) return "Excellent answer!";
    if (score >= 0.6) return "Excellent answer!";
    if (score >= 0.4) return "Good answer!";
    if (score >= 0.2) return "Decent answer, but could include more details.";
    return "Partially correct, but missing some information.";
}

// Simplified quiz interface for direct use without ElizaOS
export class CharacterQuizManager {
    private character: Character;
    private quiz: CharacterQuiz;
    private questions: QuizQuestion[] = [];
    private currentQuestionIndex: number = 0;
    private scores: number[] = [];
    private isActive: boolean = false;
    private availableCharacters: string[] = [];
    private userWalletAddress: string | null = null;

    constructor(characterName: string = 'eric') {
        this.character = loadCharacter(characterName);
        this.quiz = new CharacterQuiz(this.character);
        this.questions = this.quiz.getRandomQuestions(5);
        this.loadAvailableCharacters();
    }

    private loadAvailableCharacters(): void {
        try {
            // Try different possible paths
            const possibleDirs = [
                path.join(process.cwd(), 'src', 'characters'),
                path.join(process.cwd(), 'characters'),
                path.join(process.cwd(), 'eliza', 'characters')
            ];

            for (const dirPath of possibleDirs) {
                try {
                    if (fs.existsSync(dirPath)) {
                        const files = fs.readdirSync(dirPath);
                        const characterFiles = files.filter(file => 
                            file.endsWith('.character.json') || 
                            file.endsWith('.json')
                        );
                        
                        this.availableCharacters = characterFiles.map(file => {
                            // Extract character name from filename
                            return file.replace('.character.json', '').replace('.json', '');
                        });
                        
                        if (this.availableCharacters.length > 0) {
                            console.log(`Found ${this.availableCharacters.length} characters`);
                            break;
                        }
                    }
                } catch (e) {
                    continue;
                }
            }
        } catch (error) {
            console.error(`Error loading available characters: ${error}`);
            // Default to at least having the current character
            this.availableCharacters = [this.character.name];
        }
    }

    public getAvailableCharacters(): string[] {
        return this.availableCharacters;
    }

    public changeCharacter(characterName: string): boolean {
        try {
            this.character = loadCharacter(characterName);
            this.quiz = new CharacterQuiz(this.character);
            this.resetQuiz();
            return true;
        } catch (error) {
            console.error(`Error changing character: ${error}`);
            return false;
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
        let questionText = `Question ${this.currentQuestionIndex + 1}: ${question.question}`;
        
        if (question.type === 'boolean') {
            questionText += " (Please answer with 'True' or 'False')";
        }

        this.currentQuestionIndex++;
        return questionText;
    }

    public submitAnswer(answer: string): string {
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
                const mintResult = this.mintNFT(percentScore);
                return `${feedback}\n\nQuiz completed! Your final score is ${percentScore}%.\n\n${mintResult}`;
            }
            
            return `${feedback}\n\nQuiz completed! Your final score is ${percentScore}%.`;
        }
        
        return feedback;
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
     * Mint an NFT for the user based on their quiz performance
     */
    public async mintNFT(score: number): Promise<string> {
        if (!this.userWalletAddress) {
            return "Cannot mint NFT: No wallet address provided. Please set your wallet address first.";
        }

        const result = await nftMinter.mintNFT(
            this.character.name,
            this.userWalletAddress,
            score
        );

        return result.message;
    }
}

// For backward compatibility, create an EricQuiz class that extends CharacterQuizManager
export class EricQuiz extends CharacterQuizManager {
    constructor() {
        super('eric');
    }
}

// Export the quiz class as default
export default EricQuiz; 