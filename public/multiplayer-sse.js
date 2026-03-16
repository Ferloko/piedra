// Real multiplayer using Server-Sent Events (SSE)
class MultiplayerSSE {
    constructor() {
        this.currentRoom = null;
        this.currentPlayer = null;
        this.hasChosen = false;
        this.playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.eventSource = null;
        
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
        if (this.findGameBtn) {
            this.findGameBtn.addEventListener('click', () => this.findGame());
        }
        if (this.cancelSearchBtn) {
            this.cancelSearchBtn.addEventListener('click', () => this.cancelSearch());
        }
        if (this.playAgainBtn) {
            this.playAgainBtn.addEventListener('click', () => this.playAgain());
        }
        if (this.newGameBtn) {
            this.newGameBtn.addEventListener('click', () => this.newGame());
        }
        
        if (this.choiceButtons) {
            this.choiceButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const choice = btn.dataset.choice;
                    this.makeChoice(choice);
                });
            });
        } else {
            console.error('Choice buttons not found');
        }
    }
    
    connectSSE() {
        if (this.eventSource) {
            this.eventSource.close();
        }
        
        const baseUrl = window.location.origin;
        const url = `${baseUrl}/api/sse?playerId=${this.playerId}`;
        
        console.log('Connecting to SSE:', url);
        
        this.eventSource = new EventSource(url);
        
        this.eventSource.onopen = () => {
            console.log('SSE Connected');
            this.updateConnectionStatus(true);
        };
        
        this.eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleServerMessage(data);
            } catch (error) {
                console.error('Error parsing SSE message:', error);
            }
        };
        
        this.eventSource.onerror = (error) => {
            console.error('SSE Error:', error);
            this.updateConnectionStatus(false);
        };
        
        this.eventSource.onclose = () => {
            console.log('SSE Connection closed');
            this.updateConnectionStatus(false);
        };
    }
    
    handleServerMessage(data) {
        console.log('Received SSE message:', data.type);
        
        switch (data.type) {
            case 'connected':
                console.log('Successfully connected to multiplayer');
                break;
                
            case 'waiting':
                this.searchText.textContent = 'Esperando a otro jugador...';
                break;
                
            case 'gameFound':
                this.currentRoom = data.gameId;
                this.currentPlayer = data.player;
                this.showGameScreen();
                break;
                
            case 'gameStart':
                this.resetGame();
                this.gameStatus.textContent = '¡Elige tu movimiento!';
                break;
                
            case 'choiceMade':
                if (data.choice) {
                    this.gameStatus.textContent = 'Esperando la elección del oponente...';
                }
                break;
                
            case 'gameResult':
                this.showResult(data.result);
                break;
                
            case 'opponentDisconnected':
                this.showOpponentDisconnected();
                break;
                
            case 'ping':
                // Keep-alive, ignore
                break;
        }
    }
    
    async findGame() {
        this.showScreen(this.searchScreen);
        this.searchText.textContent = 'Buscando oponente...';
        
        // Connect to SSE
        this.connectSSE();
        
        // Send findGame request
        try {
            const response = await fetch(`${window.location.origin}/api/sse?action=findGame&playerId=${this.playerId}`);
            console.log('Find game response:', await response.text());
        } catch (error) {
            console.error('Error finding game:', error);
            this.searchText.textContent = 'Error al buscar partida';
        }
    }
    
    cancelSearch() {
        if (this.eventSource) {
            this.eventSource.close();
        }
        this.showScreen(this.mainScreen);
    }
    
    showGameScreen() {
        if (this.gameScreen) {
            this.showScreen(this.gameScreen);
            this.resetGame();
        }
    }
    
    resetGame() {
        this.hasChosen = false;
        if (this.playerChoice) {
            this.playerChoice.innerHTML = '<span class="choice-emoji">❓</span>';
        }
        if (this.opponentChoice) {
            this.opponentChoice.innerHTML = '<span class="choice-emoji">❓</span>';
        }
        if (this.gameStatus) {
            this.gameStatus.textContent = '¡Elige tu movimiento!';
        }
        
        if (this.choiceButtons) {
            this.choiceButtons.forEach(btn => {
                btn.disabled = false;
                btn.classList.remove('selected');
            });
        }
    }
    
    async makeChoice(choice) {
        if (this.hasChosen) return;
        
        this.hasChosen = true;
        
        // Send choice to server
        try {
            const response = await fetch(`${window.location.origin}/api/sse?action=makeChoice&gameId=${this.currentRoom}&playerId=${this.playerId}&choice=${choice}`);
            console.log('Make choice response:', await response.text());
            
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
            const response = await fetch(`${window.location.origin}/api/sse?action=playAgain&gameId=${this.currentRoom}&playerId=${this.playerId}`);
            console.log('Play again response:', await response.text());
            
            this.showGameScreen();
        } catch (error) {
            console.error('Error playing again:', error);
        }
    }
    
    newGame() {
        if (this.eventSource) {
            this.eventSource.close();
        }
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
    
    showScreen(screen) {
        if (screen) {
            [this.mainScreen, this.searchScreen, this.gameScreen, this.resultScreen].forEach(s => {
                if (s) s.classList.add('hidden');
            });
            screen.classList.remove('hidden');
        }
    }
    
    updateConnectionStatus(connected) {
        if (this.statusIndicator && this.statusText) {
            if (connected) {
                this.statusIndicator.classList.add('connected');
                this.statusText.textContent = 'Conectado (SSE)';
            } else {
                this.statusIndicator.classList.remove('connected');
                this.statusText.textContent = 'Desconectado';
            }
        }
    }
}

// Initialize SSE multiplayer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Loading SSE Multiplayer Mode');
    new MultiplayerSSE();
});
