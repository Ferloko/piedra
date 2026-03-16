// Simple game mode that works without any server
class SimpleGame {
    constructor() {
        this.currentPlayer = null;
        this.hasChosen = false;
        this.playerChoice = null;
        this.opponentChoice = null;
        
        this.initializeElements();
        this.bindEvents();
    }
    
    initializeElements() {
        // Screens
        this.mainScreen = document.getElementById('main-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.resultScreen = document.getElementById('result-screen');
        
        // Status
        this.statusIndicator = document.getElementById('status-indicator');
        this.statusText = document.getElementById('status-text');
        
        // Buttons
        this.findGameBtn = document.getElementById('find-game');
        this.playAgainBtn = document.getElementById('play-again');
        this.newGameBtn = document.getElementById('new-game');
        this.choiceButtons = document.querySelectorAll('.choice-btn');
        
        // Game elements
        this.playerChoiceDisplay = document.getElementById('player-choice');
        this.opponentChoiceDisplay = document.getElementById('opponent-choice');
        this.gameStatus = document.getElementById('game-status');
        
        // Result elements
        this.resultTitle = document.getElementById('result-title');
        this.resultPlayerChoice = document.getElementById('result-player-choice');
        this.resultOpponentChoice = document.getElementById('result-opponent-choice');
        this.resultMessage = document.getElementById('result-message');
    }
    
    bindEvents() {
        this.findGameBtn.addEventListener('click', () => this.startGame());
        this.playAgainBtn.addEventListener('click', () => this.playAgain());
        this.newGameBtn.addEventListener('click', () => this.newGame());
        
        // Add multiplayer button listener if it exists
        const multiplayerBtn = document.getElementById('try-multiplayer');
        if (multiplayerBtn) {
            multiplayerBtn.addEventListener('click', () => {
                console.log('Switching to multiplayer mode...');
                const baseUrl = window.location.origin;
                location.href = baseUrl + '/';
            });
        }
        
        this.choiceButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const choice = btn.dataset.choice;
                this.makeChoice(choice);
            });
        });
    }
    
    startGame() {
        this.showScreen(this.gameScreen);
        this.resetGame();
        this.updateConnectionStatus(true);
        this.statusText.textContent = 'Modo Simple (vs Computadora)';
    }
    
    resetGame() {
        this.hasChosen = false;
        this.playerChoice = null;
        this.opponentChoice = null;
        this.playerChoiceDisplay.innerHTML = '<span class="choice-emoji">❓</span>';
        this.opponentChoiceDisplay.innerHTML = '<span class="choice-emoji">❓</span>';
        this.gameStatus.textContent = '¡Elige tu movimiento!';
        
        this.choiceButtons.forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('selected');
        });
    }
    
    makeChoice(choice) {
        if (this.hasChosen) return;
        
        this.hasChosen = true;
        this.playerChoice = choice;
        
        // Update UI
        this.choiceButtons.forEach(btn => {
            btn.disabled = true;
            if (btn.dataset.choice === choice) {
                btn.classList.add('selected');
            }
        });
        
        // Show player's choice
        const choiceEmoji = this.getChoiceEmoji(choice);
        this.playerChoiceDisplay.innerHTML = `<span class="choice-emoji">${choiceEmoji}</span>`;
        this.gameStatus.textContent = 'Computadora pensando...';
        
        // Simulate computer thinking and making choice
        setTimeout(() => {
            this.makeComputerChoice();
        }, 1500);
    }
    
    makeComputerChoice() {
        const choices = ['rock', 'paper', 'scissors'];
        const randomChoice = choices[Math.floor(Math.random() * choices.length)];
        this.opponentChoice = randomChoice;
        
        // Show computer's choice
        const choiceEmoji = this.getChoiceEmoji(randomChoice);
        this.opponentChoiceDisplay.innerHTML = `<span class="choice-emoji">${choiceEmoji}</span>`;
        
        // Determine winner
        const result = this.determineWinner(this.playerChoice, this.opponentChoice);
        
        // Show result after a short delay
        setTimeout(() => {
            this.showResult(result);
        }, 1000);
    }
    
    determineWinner(choice1, choice2) {
        if (choice1 === choice2) return 'tie';
        
        const winConditions = {
            'rock': 'scissors',
            'paper': 'rock',
            'scissors': 'paper'
        };
        
        return winConditions[choice1] === choice2 ? 'player' : 'computer';
    }
    
    getChoiceEmoji(choice) {
        const emojis = {
            'rock': '✊',
            'paper': '✋',
            'scissors': '✌️'
        };
        return emojis[choice] || '❓';
    }
    
    showResult(result) {
        const { player1Choice, player2Choice, winner } = result;
        
        // Update game screen
        this.playerChoiceDisplay.innerHTML = `<span class="choice-emoji">${this.getChoiceEmoji(this.playerChoice)}</span>`;
        this.opponentChoiceDisplay.innerHTML = `<span class="choice-emoji">${this.getChoiceEmoji(this.opponentChoice)}</span>`;
        
        // Update result screen
        this.resultPlayerChoice.textContent = this.getChoiceEmoji(this.playerChoice);
        this.resultOpponentChoice.textContent = this.getChoiceEmoji(this.opponentChoice);
        
        // Determine result message
        let message = '';
        let messageClass = '';
        
        if (winner === 'tie') {
            message = '🤝 ¡Empate!';
            messageClass = 'tie';
        } else if (winner === 'player') {
            message = '🎉 ¡Ganaste!';
            messageClass = 'win';
        } else {
            message = '😔 ¡Perdiste!';
            messageClass = 'lose';
        }
        
        this.resultMessage.textContent = message;
        this.resultMessage.className = `result-message ${messageClass}`;
        
        // Show result screen
        setTimeout(() => {
            this.showScreen(this.resultScreen);
        }, 1500);
    }
    
    playAgain() {
        this.showScreen(this.gameScreen);
        this.resetGame();
    }
    
    newGame() {
        this.showScreen(this.mainScreen);
        this.updateConnectionStatus(false);
        this.statusText.textContent = 'Desconectado';
    }
    
    showScreen(screen) {
        [this.mainScreen, this.gameScreen, this.resultScreen].forEach(s => {
            s.classList.add('hidden');
        });
        screen.classList.remove('hidden');
    }
    
    updateConnectionStatus(connected) {
        if (connected) {
            this.statusIndicator.classList.add('connected');
        } else {
            this.statusIndicator.classList.remove('connected');
        }
    }
}

// Initialize simple game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Loading Simple Game Mode (vs Computer)');
    new SimpleGame();
});
