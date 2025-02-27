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
console.log("-----------------------------------------------------------");

// Start the quiz immediately
quizActive = true;
console.log(quizManager.start());
const firstQuestion = quizManager.getNextQuestion();
if (firstQuestion) {
  console.log(firstQuestion);
  waitingForAnswer = true;
}

// Process user input
async function processUserInput(input: string): Promise<void> {
  // Check for exit command
  if (input.toLowerCase() === 'exit') {
    console.log("Thanks for chatting! Goodbye!");
    rl.close();
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
      
      // Exit the program after a brief pause
      console.log("\nThank you for taking the quiz! Goodbye!");
      setTimeout(() => {
        rl.close();
        process.exit(0);
      }, 1500);
    }
    return;
  }

  // If not in quiz mode and not waiting for an answer (this shouldn't happen in this version)
  if (!quizActive && !waitingForAnswer) {
    console.log("The quiz has ended. Exiting...");
    rl.close();
    process.exit(0);
  }
}

// Handle user input
function handleUserInput(): void {
  rl.question('> ', async (input) => {
    await processUserInput(input);
    // Continue the conversation only if we're still active
    if (quizActive) {
      handleUserInput();
    }
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
