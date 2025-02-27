import * as readline from 'readline';
import { CharacterQuizManager } from './custom_actions/quizUser';

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Get character name from command line arguments or use default
const characterName = process.argv[2] || 'eric';

// Create an instance of the CharacterQuizManager with the specified character
const quizManager = new CharacterQuizManager(characterName);

// Variables to track state
let quizActive = false;
let waitingForAnswer = false;

// Display welcome message
console.log(`I'm ${quizManager.getCharacterName()}, and I'm ready to test your knowledge about me. You'll get something cool if you know me well!`);
console.log("Type 'quiz' to start a quiz, or 'exit' to quit.");
console.log("-----------------------------------------------------------");

// Process user input
async function processUserInput(input: string): Promise<void> {
  // Check for exit command
  if (input.toLowerCase() === 'exit') {
    console.log("Thanks for chatting! Goodbye!");
    rl.close();
    return;
  }

  // Check for quiz command
  if (input.toLowerCase() === 'quiz' && !quizActive) {
    quizActive = true;
    console.log(quizManager.start());
    const question = quizManager.getNextQuestion();
    if (question) {
      console.log(question);
      waitingForAnswer = true;
    }
    return;
  }

  // If quiz is active and waiting for an answer
  if (quizActive && waitingForAnswer) {
    const feedback = quizManager.submitAnswer(input);
    console.log(feedback);
    
    // Check if there are more questions
    const nextQuestion = quizManager.getNextQuestion();
    if (nextQuestion) {
      console.log(nextQuestion);
      // Keep waitingForAnswer as true since we're still expecting an answer
    } else {
      // Quiz is complete
      quizActive = false;
      waitingForAnswer = false;
      console.log("\nType 'quiz' to start another quiz, or 'exit' to quit.");
    }
    return;
  }

  // Regular conversation
  if (!quizActive) {
    if (input.toLowerCase().includes('quiz')) {
      console.log(`Would you like to start a quiz about ${quizManager.getCharacterName()}? Type 'quiz' to begin!`);
    } else {
      console.log(`I'm ${quizManager.getCharacterName()}! I'm here to chat and quiz you about myself. Type 'quiz' to start a quiz!`);
    }
  }
}

// Handle user input
function handleUserInput(): void {
  rl.question('> ', async (input) => {
    await processUserInput(input);
    // Always continue the conversation
    handleUserInput();
  });
}

// Start the interaction
handleUserInput();

// Handle program termination
process.on('SIGINT', () => {
  console.log("\nThanks for chatting! Goodbye!");
  rl.close();
  process.exit(0);
});
