# RandomChess
Juego de ajedrez en que las piezas son RANDOM
# Random Chess

A React-based chess application that supports both standard chess and randomized piece setups, allowing users to play against an AI or another human player. The game includes three difficulty levels for the AI and multiple game modes for varied gameplay experiences.

## Table of Contents
- [Description](#description)
- [Game Modes](#game-modes)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [How to Play](#how-to-play)
- [AI Difficulty Levels](#ai-difficulty-levels)
- [Contributing](#contributing)
- [License](#license)

## Description
Random Chess is a web-based chess game built with React. It offers a twist on traditional chess by allowing randomized piece setups in addition to the standard chess configuration. Players can choose to play against an AI with adjustable difficulty or against another human player. The game includes features like move history, check/checkmate detection, and stalemate recognition.

## Game Modes
- **Standard**: Traditional chess setup with the standard piece arrangement.
- **Symmetric Random**: Both players start with the same randomly generated set of pieces (excluding the king), placed symmetrically.
- **Asymmetric Random**: Each player gets a different randomly generated set of pieces, ensuring the total piece value is balanced.
- **Crazy Random**: Completely random piece setup with no constraints on piece values, leading to unpredictable games.

## Features
- Play against an AI or another human player.
- Three AI difficulty levels: Easy, Medium, and Hard.
- Four game modes: Standard, Symmetric Random, Asymmetric Random, and Crazy Random.
- Displays move history for tracking game progress.
- Detects check, checkmate, and stalemate conditions.
- Visual indicators for selected pieces and valid moves.
- Reset the game with the "New Game" button.

## Installation
Follow these steps to set up and run the Random Chess app locally:

### Prerequisites
- [Node.js](https://nodejs.org/) (version 14 or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)

### Steps
1. **Clone the Repository**  
   Clone the project to your local machine:  
   git clone https://github.com/your-username/random-chess.git  
   cd random-chess  

2. **Install Dependencies**  
   Install the required npm packages:  
   npm install  

3. **Run the App**  
   Start the development server:  
   npm start  

   The app will open in your default browser at http://localhost:3000.

4. **Build for Production (Optional)**  
   To create a production build:  
   npm run build  

   The optimized build will be generated in the `build/` directory.

## Usage
- Open the app in your browser after starting the development server.
- Use the dropdown menus at the top to select:
  - **Game Mode**: Choose between Standard, Symmetric Random, Asymmetric Random, or Crazy Random.
  - **Opponent**: Play against the AI or another human player.
  - **AI Difficulty** (if playing against AI): Select Easy, Medium, or Hard.
- Click on a piece to select it, then click on a highlighted square to move it.
- The move history is displayed on the right side of the screen.
- Click the "New Game" button to reset the board and start a new game.

## How to Play
- **Objective**: The goal is to checkmate your opponent's king, meaning the king is in check and cannot escape.
- **Gameplay**:
  - The game follows standard chess rules for piece movement (e.g., pawns move forward, rooks move in straight lines, etc.).
  - In random modes, pieces are placed in non-standard positions, but the king is always placed on e1 (White) or e8 (Black).
  - Pawns promote to queens when they reach the opponent's back rank.
- **Checks and Checkmate**:
  - If a king is in check, the player must resolve the check by moving the king, capturing the checking piece, or blocking the check.
  - If no legal moves can resolve the check, the game ends in checkmate, and the other player wins.
  - If a player has no legal moves but is not in check, the game ends in a stalemate (draw).
- **Move History**: The right panel shows the history of moves in algebraic notation (e.g., "queen b2 to c7").

## AI Difficulty Levels
- **Easy**: The AI selects a random legal move.
- **Medium**: The AI scores moves based on captures (prioritizing higher-value pieces) and central control, then chooses the best-scoring move.
- **Hard**: The AI uses a basic Minimax algorithm with a depth of 1 to evaluate moves, aiming to maximize its score while minimizing the opponent's potential score.

## Contributing
Contributions are welcome! If you'd like to contribute:
1. Fork the repository.
2. Create a new branch (git checkout -b feature/your-feature-name).
3. Make your changes and commit them (git commit -m "Add your feature").
4. Push to your branch (git push origin feature/your-feature-name).
5. Open a Pull Request on GitHub.

Please ensure your code follows the existing style and includes appropriate tests if applicable.

## License
This project is licensed under the MIT License. See the LICENSE file for details.

---

### Instructions for Use
1. Copy the above Markdown code.
2. Create or open the `README.md` file in your project’s root directory.
3. Paste the code into `README.md`.
4. Replace `https://github.com/your-username/random-chess.git` with the actual URL of your GitHub repository.
5. If you have a `LICENSE` file, ensure it’s in the root directory; otherwise, remove the link to `[LICENSE](LICENSE)` or create a license file.
6. Commit and push the `README.md` file to your GitHub repository:  
   git add README.md  
   git commit -m "Add README documentation"  
   git push origin main  

## Additional Notes
- The `README.md` assumes a standard React setup with npm. If you’re using yarn or another package manager, you can adjust the commands accordingly (e.g., yarn install instead of npm install).
- If you have additional features (e.g., specific chess variants, undo functionality, etc.), you can add them to the "Features" or "How to Play" sections.
- If you’d like to include screenshots or a demo GIF of the game in action, you can add them under a "Screenshots" or "Demo" section in the README.md.
