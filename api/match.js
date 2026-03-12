// Simple matchmaking API for Vercel
let waitingPlayers = [];
let activeGames = new Map();

function determineWinner(choice1, choice2) {
    if (choice1 === choice2) return 'tie';
    
    const winConditions = {
        'rock': 'scissors',
        'paper': 'rock',
        'scissors': 'paper'
    };
    
    return winConditions[choice1] === choice2 ? 'player1' : 'player2';
}

module.exports = async function handler(req, res) {
    const { method, query } = req;
    
    if (method === 'GET') {
        const { action, playerId, gameId, choice } = query;
        
        if (action === 'findGame') {
            // Check if there's a waiting player
            if (waitingPlayers.length > 0) {
                const opponent = waitingPlayers.shift();
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
                
                activeGames.set(newGameId, game);
                
                return res.status(200).json({
                    success: true,
                    gameId: newGameId,
                    player: 'player2',
                    opponent: opponent
                });
            } else {
                // Add to waiting list
                waitingPlayers.push(playerId);
                
                return res.status(200).json({
                    success: true,
                    waiting: true
                });
            }
        }
        
        if (action === 'checkGame') {
            const game = activeGames.get(gameId);
            if (!game) {
                return res.status(404).json({ success: false, error: 'Game not found' });
            }
            
            return res.status(200).json({
                success: true,
                game: {
                    id: game.id,
                    status: game.status,
                    player1Choice: game.player1Choice,
                    player2Choice: game.player2Choice,
                    winner: game.winner
                }
            });
        }
        
        if (action === 'makeChoice') {
            const game = activeGames.get(gameId);
            if (!game) {
                return res.status(404).json({ success: false, error: 'Game not found' });
            }
            
            const player = game.player1 === playerId ? 'player1' : 'player2';
            game[`${player}Choice`] = choice;
            
            // Check if both players have made choices
            if (game.player1Choice && game.player2Choice) {
                const winner = determineWinner(game.player1Choice, game.player2Choice);
                game.winner = winner;
                game.status = 'finished';
                
                return res.status(200).json({
                    success: true,
                    gameStatus: 'finished',
                    result: {
                        player1Choice: game.player1Choice,
                        player2Choice: game.player2Choice,
                        winner: winner
                    }
                });
            }
            
            return res.status(200).json({
                success: true,
                gameStatus: 'waiting_for_opponent'
            });
        }
        
        if (action === 'playAgain') {
            const game = activeGames.get(gameId);
            if (!game) {
                return res.status(404).json({ success: false, error: 'Game not found' });
            }
            
            const player = game.player1 === playerId ? 'player1' : 'player2';
            game[`${player}Choice`] = null;
            
            if (game.player1Choice === null && game.player2Choice === null) {
                game.status = 'waiting';
                game.winner = null;
            }
            
            return res.status(200).json({
                success: true,
                gameStatus: game.status
            });
        }
    }
    
    res.status(400).json({ success: false, error: 'Invalid request' });
}
