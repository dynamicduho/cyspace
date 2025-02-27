import * as fs from 'fs';
import * as path from 'path';

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
        // Generate open-ended questions
        if (this.character.bio?.length) {
            const bioAnswer = this.character.bio.filter(bio => 
                bio.includes("studying") || bio.includes("interest") || 
                bio.includes("passion")).join(". ");
            this.questions.push({
                question: `What is ${this.character.name}'s educational background and main interests?`,
                modelAnswer: this.truncateAnswer(bioAnswer),
                category: "Background",
                type: 'open'
            });
        }

        if (this.character.knowledge?.length) {
            const knowledgeAnswer = this.character.knowledge.filter(k => 
                k.includes("understands") || k.includes("familiar") || 
                k.includes("experienced")).join(". ");
            this.questions.push({
                question: `What are ${this.character.name}'s main technical skills and expertise?`,
                modelAnswer: this.truncateAnswer(knowledgeAnswer),
                category: "Skills",
                type: 'open'
            });
        }

        if (this.character.lore?.length) {
            const loreAnswer = this.character.lore.slice(0, 2).join(". ");
            this.questions.push({
                question: `Can you describe some notable achievements or experiences of ${this.character.name}?`,
                modelAnswer: this.truncateAnswer(loreAnswer),
                category: "Experiences",
                type: 'open'
            });
        }

        // Generate personality-based questions
        if (this.character.style?.all?.length) {
            const styleAnswer = this.character.style.all.slice(0, 2).join(". ");
            this.questions.push({
                question: `How would you describe ${this.character.name}'s personality and communication style?`,
                modelAnswer: this.truncateAnswer(styleAnswer),
                category: "Personality",
                type: 'open'
            });
        }

        // Generate hobby-based questions
        const hobbies = this.character.topics?.filter(topic => 
            !topic.includes("technology") && !topic.includes("development"));
        if (hobbies?.length) {
            const hobbyAnswer = hobbies.slice(0, 3).join(", ");
            this.questions.push({
                question: `What are ${this.character.name}'s main hobbies and interests outside of technology?`,
                modelAnswer: this.truncateAnswer(hobbyAnswer),
                category: "Hobbies",
                type: 'open'
            });
        }

        // Add some True/False questions for variety
        const falseStatements = [
            `${this.character.name} is a professional chef with Michelin star experience.`,
            `${this.character.name} has never participated in a hackathon.`,
            `${this.character.name} is a professional musician performing in concerts.`
        ];

        falseStatements.forEach(statement => {
            this.questions.push({
                question: `True or False: ${statement}`,
                modelAnswer: "False",
                category: "General",
                type: 'boolean'
            });
        });
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
        
        // Ensure the result is between 0 and 1
        return Math.max(0, Math.min(1, similarity));
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
    if (score >= 0.6) return "Good answer!";
    if (score >= 0.4) return "Decent answer, but could include more details.";
    if (score >= 0.2) return "Partially correct, but missing key information.";
    return "Try to include more specific details next time.";
}

// Simplified quiz interface for direct use without ElizaOS
export class CharacterQuizManager {
    private character: Character;
    private quiz: CharacterQuiz;
    private questions: QuizQuestion[] = [];
    private currentQuestionIndex: number = 0;
    private scores: number[] = [];
    private isActive: boolean = false;

    constructor(characterName: string = 'eric') {
        this.character = loadCharacter(characterName);
        this.quiz = new CharacterQuiz(this.character);
        this.questions = this.quiz.getRandomQuestions(5);
    }

    public start(): string {
        this.isActive = true;
        this.currentQuestionIndex = 0;
        this.scores = [];
        this.questions = this.quiz.getRandomQuestions(5);
        return `Let's test your knowledge about ${this.character.name}! I'll ask you ${this.questions.length} questions. Ready for the first one?`;
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
            return `${feedback}\n\nQuiz completed! Your final score is ${percentScore}%. ${getScoreFeedback(averageScore)}`;
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
}

// For backward compatibility, create an EricQuiz class that extends CharacterQuizManager
export class EricQuiz extends CharacterQuizManager {
    constructor() {
        super('eric');
    }
}

// Export the quiz class as default
export default EricQuiz; 