// Mock API responses for Vercel deployment
class MockAPI {
    constructor() {
        this.waitingPlayers = [];
        this.activeGames = new Map();
    }
    
    determineWinner(choice1, choice2) {
        if (choice1 === choice2) return 'tie';
        
        const winConditions = {
            'rock': 'scissors',
            'paper': 'rock',
            'scissors': 'paper'
        };
        
        return winConditions[choice1] === choice2 ? 'player1' : 'player2';
    }
    
    async findGame(playerId) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (this.waitingPlayers.length > 0) {
            const opponent = this.waitingPlayers.shift();
            const newGameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            const game = {
                id: newGameId,
                player1: opponent,
                player2: playerId,
                player1Choice: null,
                player2Choice: null,
                status: 'waiting',
                createdAt: Date.now()
            };
            
            this.activeGames.set(newGameId, game);
            
            return {
                success: true,
                gameId: newGameId,
                player: 'player2',
                opponent: opponent
            };
        } else {
            // Add to waiting list
            this.waitingPlayers.push(playerId);
            
            return {
                success: true,
                waiting: true
            };
        }
    }
    
    async checkGame(gameId) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const game = this.activeGames.get(gameId);
        if (!game) {
            return { success: false, error: 'Game not found' };
        }
        
        return {
            success: true,
            game: {
                id: game.id,
                status: game.status,
                player1Choice: game.player1Choice,
                player2Choice: game.player2Choice,
                winner: game.winner
            }
        };
    }
    
    async makeChoice(gameId, playerId, choice) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const game = this.activeGames.get(gameId);
        if (!game) {
            return { success: false, error: 'Game not found' };
        }
        
        const player = game.player1 === playerId ? 'player1' : 'player2';
        game[`${player}Choice`] = choice;
        
        // Check if both players have made choices
        if (game.player1Choice && game.player2Choice) {
            const winner = this.determineWinner(game.player1Choice, game.player2Choice);
            game.winner = winner;
            game.status = 'finished';
            
            return {
                success: true,
                gameStatus: 'finished',
                result: {
                    player1Choice: game.player1Choice,
                    player2Choice: game.player2Choice,
                    winner: winner
                }
            };
        }
        
        return {
            success: true,
            gameStatus: 'waiting_for_opponent'
        };
    }
    
    async playAgain(gameId, playerId) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const game = this.activeGames.get(gameId);
        if (!game) {
            return { success: false, error: 'Game not found' };
        }
        
        const player = game.player1 === playerId ? 'player1' : 'player2';
        game[`${player}Choice`] = null;
        
        if (game.player1Choice === null && game.player2Choice === null) {
            game.status = 'waiting';
            game.winner = null;
        }
        
        return {
            success: true,
            gameStatus: game.status
        };
    }
}

// Create global mock API instance
window.mockAPI = new MockAPI();
