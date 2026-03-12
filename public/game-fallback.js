class RockPaperScissorsGameHTTP {
    constructor() {
        this.currentRoom = null;
        this.currentPlayer = null;
        this.hasChosen = false;
        this.playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.pollingInterval = null;
        
        this.initializeElements();
        this.bindEvents();
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
    
    async findGame() {
        this.showScreen(this.searchScreen);
        this.searchText.textContent = 'Buscando oponente...';
        
        try {
            const response = await fetch(`http://localhost:8080/api/match?action=findGame&playerId=${this.playerId}`);
            const data = await response.json();
            
            if (data.success) {
                if (data.waiting) {
                    this.searchText.textContent = 'Esperando a otro jugador...';
                    this.startPolling();
                } else {
                    this.currentRoom = data.gameId;
                    this.currentPlayer = data.player;
                    this.showGameScreen();
                    this.startPolling();
                }
            }
        } catch (error) {
            console.error('Error finding game:', error);
            this.searchText.textContent = 'Error al buscar partida';
        }
    }
    
    cancelSearch() {
        this.stopPolling();
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
    
    async makeChoice(choice) {
        if (this.hasChosen) return;
        
        this.hasChosen = true;
        
        try {
            const response = await fetch(`http://localhost:8080/api/match?action=makeChoice&gameId=${this.currentRoom}&playerId=${this.playerId}&choice=${choice}`);
            const data = await response.json();
            
            if (data.success) {
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
                
                if (data.gameStatus === 'waiting_for_opponent') {
                    this.gameStatus.textContent = 'Esperando la elección del oponente...';
                } else if (data.gameStatus === 'finished') {
                    this.showResult(data.result);
                }
            }
        } catch (error) {
            console.error('Error making choice:', error);
        }
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
    
    async playAgain() {
        try {
            const response = await fetch(`http://localhost:8080/api/match?action=playAgain&gameId=${this.currentRoom}&playerId=${this.playerId}`);
            const data = await response.json();
            
            if (data.success) {
                this.showGameScreen();
            }
        } catch (error) {
            console.error('Error playing again:', error);
        }
    }
    
    newGame() {
        this.stopPolling();
        this.currentRoom = null;
        this.currentPlayer = null;
        this.hasChosen = false;
        this.showScreen(this.mainScreen);
    }
    
    startPolling() {
        this.stopPolling();
        this.pollingInterval = setInterval(async () => {
            try {
                const response = await fetch(`http://localhost:8080/api/match?action=checkGame&gameId=${this.currentRoom}`);
                const data = await response.json();
                
                if (data.success) {
                    const game = data.game;
                    
                    if (game.status === 'finished' && !this.hasChosen) {
                        // Game finished without our choice, show result
                        this.showResult({
                            player1Choice: game.player1Choice,
                            player2Choice: game.player2Choice,
                            winner: game.winner
                        });
                    }
                }
            } catch (error) {
                console.error('Polling error:', error);
            }
        }, 1000);
    }
    
    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }
    
    showScreen(screen) {
        [this.mainScreen, this.searchScreen, this.gameScreen, this.resultScreen].forEach(s => {
            s.classList.add('hidden');
        });
        screen.classList.remove('hidden');
    }
    
    updateConnectionStatus(connected) {
        if (connected) {
            this.statusIndicator.classList.add('connected');
            this.statusText.textContent = 'Conectado';
        } else {
            this.statusIndicator.classList.remove('connected');
            this.statusText.textContent = 'Modo HTTP';
        }
    }
}
