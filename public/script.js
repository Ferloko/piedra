class RockPaperScissorsGame {
    constructor() {
        this.socket = io();
        this.currentRoom = null;
        this.currentPlayer = null;
        this.hasChosen = false;
        
        this.initializeElements();
        this.bindEvents();
        this.setupSocketListeners();
    }
    
    initializeElements() {
        // Screens
        this.mainScreen = document.getElementById('main-screen');
        this.searchScreen = document.getElementById('search-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.resultScreen = document.getElementById('result-screen');
        
        // Status
        this.statusIndicator = document.getElementById('status-indicator');
        this.statusText = document.getElementById('status-text');
        this.searchText = document.getElementById('search-text');
        
        // Buttons
        this.findGameBtn = document.getElementById('find-game');
        this.cancelSearchBtn = document.getElementById('cancel-search');
        this.playAgainBtn = document.getElementById('play-again');
        this.newGameBtn = document.getElementById('new-game');
        this.choiceButtons = document.querySelectorAll('.choice-btn');
        
        // Game elements
        this.playerChoice = document.getElementById('player-choice');
        this.opponentChoice = document.getElementById('opponent-choice');
        this.gameStatus = document.getElementById('game-status');
        
        // Result elements
        this.resultTitle = document.getElementById('result-title');
        this.resultPlayerChoice = document.getElementById('result-player-choice');
        this.resultOpponentChoice = document.getElementById('result-opponent-choice');
        this.resultMessage = document.getElementById('result-message');
    }
    
    bindEvents() {
        this.findGameBtn.addEventListener('click', () => this.findGame());
        this.cancelSearchBtn.addEventListener('click', () => this.cancelSearch());
        this.playAgainBtn.addEventListener('click', () => this.playAgain());
        this.newGameBtn.addEventListener('click', () => this.newGame());
        
        this.choiceButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const choice = btn.dataset.choice;
                this.makeChoice(choice);
            });
        });
    }
    
    setupSocketListeners() {
        this.socket.on('connect', () => {
            this.updateConnectionStatus(true);
        });
        
        this.socket.on('disconnect', () => {
            this.updateConnectionStatus(false);
        });
        
        this.socket.on('waiting', () => {
            this.searchText.textContent = 'Esperando a otro jugador...';
        });
        
        this.socket.on('gameFound', ({ roomId, player }) => {
            this.currentRoom = roomId;
            this.currentPlayer = player;
            this.showGameScreen();
        });
        
        this.socket.on('gameStart', () => {
            this.resetGame();
            this.gameStatus.textContent = '¡Elige tu movimiento!';
        });
        
        this.socket.on('choiceMade', ({ choice }) => {
            if (choice) {
                this.gameStatus.textContent = 'Esperando la elección del oponente...';
            }
        });
        
        this.socket.on('gameResult', (result) => {
            this.showResult(result);
        });
        
        this.socket.on('opponentDisconnected', () => {
            this.showOpponentDisconnected();
        });
    }
    
    updateConnectionStatus(connected) {
        if (connected) {
            this.statusIndicator.classList.add('connected');
            this.statusText.textContent = 'Conectado';
        } else {
            this.statusIndicator.classList.remove('connected');
            this.statusText.textContent = 'Desconectado';
        }
    }
    
    showScreen(screen) {
        [this.mainScreen, this.searchScreen, this.gameScreen, this.resultScreen].forEach(s => {
            s.classList.add('hidden');
        });
        screen.classList.remove('hidden');
    }
    
    findGame() {
        this.showScreen(this.searchScreen);
        this.socket.emit('findGame');
    }
    
    cancelSearch() {
        this.socket.emit('cancelSearch');
        this.showScreen(this.mainScreen);
    }
    
    showGameScreen() {
        this.showScreen(this.gameScreen);
        this.resetGame();
    }
    
    resetGame() {
        this.hasChosen = false;
        this.playerChoice.innerHTML = '<span class="choice-emoji">❓</span>';
        this.opponentChoice.innerHTML = '<span class="choice-emoji">❓</span>';
        this.gameStatus.textContent = '¡Elige tu movimiento!';
        
        this.choiceButtons.forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('selected');
        });
    }
    
    makeChoice(choice) {
        if (this.hasChosen) return;
        
        this.hasChosen = true;
        this.socket.emit('makeChoice', { roomId: this.currentRoom, choice });
        
        // Update UI
        this.choiceButtons.forEach(btn => {
            btn.disabled = true;
            if (btn.dataset.choice === choice) {
                btn.classList.add('selected');
            }
        });
        
        // Show player's choice
        const choiceEmoji = this.getChoiceEmoji(choice);
        this.playerChoice.innerHTML = `<span class="choice-emoji">${choiceEmoji}</span>`;
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
        
        // Determine choices based on player perspective
        const myChoice = this.currentPlayer === 'player1' ? player1Choice : player2Choice;
        const opponentChoice = this.currentPlayer === 'player1' ? player2Choice : player1Choice;
        
        // Update game screen
        this.playerChoice.innerHTML = `<span class="choice-emoji">${this.getChoiceEmoji(myChoice)}</span>`;
        this.opponentChoice.innerHTML = `<span class="choice-emoji">${this.getChoiceEmoji(opponentChoice)}</span>`;
        
        // Update result screen
        this.resultPlayerChoice.textContent = this.getChoiceEmoji(myChoice);
        this.resultOpponentChoice.textContent = this.getChoiceEmoji(opponentChoice);
        
        // Determine result message
        let message = '';
        let messageClass = '';
        
        if (winner === 'tie') {
            message = '🤝 ¡Empate!';
            messageClass = 'tie';
        } else if ((winner === 'player1' && this.currentPlayer === 'player1') || 
                   (winner === 'player2' && this.currentPlayer === 'player2')) {
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
        this.socket.emit('playAgain', { roomId: this.currentRoom });
        this.showGameScreen();
    }
    
    newGame() {
        this.currentRoom = null;
        this.currentPlayer = null;
        this.hasChosen = false;
        this.showScreen(this.mainScreen);
    }
    
    showOpponentDisconnected() {
        this.gameStatus.textContent = 'El oponente se ha desconectado';
        this.choiceButtons.forEach(btn => {
            btn.disabled = true;
        });
        
        setTimeout(() => {
            this.showScreen(this.mainScreen);
        }, 3000);
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new RockPaperScissorsGame();
});
