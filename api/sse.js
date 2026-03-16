// Server-Sent Events for real-time multiplayer on Vercel
let waitingPlayers = [];
let activeGames = new Map();
let connections = new Map();

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
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    const { method, query } = req;
    
    if (method === 'GET') {
        const { action, playerId, gameId, choice } = query;
        
        if (action === 'findGame') {
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
                
                // Notify both players
                const players = [opponent, playerId];
                players.forEach(playerId => {
                    const connection = connections.get(playerId);
                    if (connection) {
                        connection.write(`data: ${JSON.stringify({
                            type: 'gameFound',
                            gameId: newGameId,
                            player: playerId === opponent ? 'player1' : 'player2'
                        })}\n\n`);
                    }
                });
                
                return;
            } else {
                waitingPlayers.push(playerId);
                
                const connection = connections.get(playerId);
                if (connection) {
                    connection.write(`data: ${JSON.stringify({
                        type: 'waiting'
                    })}\n\n`);
                }
                return;
            }
        }
        
        if (action === 'makeChoice') {
            const game = activeGames.get(gameId);
            if (!game) return;
            
            const player = game.player1 === playerId ? 'player1' : 'player2';
            game[`${player}Choice`] = choice;
            
            // Notify both players
            const players = [game.player1, game.player2];
            players.forEach(pid => {
                const connection = connections.get(pid);
                if (connection) {
                    connection.write(`data: ${JSON.stringify({
                        type: 'choiceMade',
                        choice: player === 'player1' ? game.player1Choice : game.player2Choice
                    })}\n\n`);
                }
            });
            
            // Check if both players have made choices
            if (game.player1Choice && game.player2Choice) {
                const winner = determineWinner(game.player1Choice, game.player2Choice);
                game.winner = winner;
                game.status = 'finished';
                
                // Notify both players of result
                players.forEach(pid => {
                    const connection = connections.get(pid);
                    if (connection) {
                        connection.write(`data: ${JSON.stringify({
                            type: 'gameResult',
                            result: {
                                player1Choice: game.player1Choice,
                                player2Choice: game.player2Choice,
                                winner: winner
                            }
                        })}\n\n`);
                    }
                });
            }
            return;
        }
        
        if (action === 'playAgain') {
            const game = activeGames.get(gameId);
            if (!game) return;
            
            const player = game.player1 === playerId ? 'player1' : 'player2';
            game[`${player}Choice`] = null;
            
            if (game.player1Choice === null && game.player2Choice === null) {
                game.status = 'waiting';
                game.winner = null;
                
                // Notify both players
                const players = [game.player1, game.player2];
                players.forEach(pid => {
                    const connection = connections.get(pid);
                    if (connection) {
                        connection.write(`data: ${JSON.stringify({
                            type: 'gameStart'
                        })}\n\n`);
                    }
                });
            }
            return;
        }
    }
    
    // Handle SSE connection
    res.on('error', (err) => {
        console.error('SSE Error:', err);
    });
    
    res.on('close', () => {
        // Remove from waiting players and games
        const index = waitingPlayers.indexOf(query.playerId);
        if (index > -1) {
            waitingPlayers.splice(index, 1);
        }
        
        // Remove from active games
        for (const [gameId, game] of activeGames.entries()) {
            if (game.player1 === query.playerId || game.player2 === query.playerId) {
                activeGames.delete(gameId);
                
                // Notify opponent
                const opponentId = game.player1 === query.playerId ? game.player2 : game.player1;
                const opponentConnection = connections.get(opponentId);
                if (opponentConnection) {
                    opponentConnection.write(`data: ${JSON.stringify({
                        type: 'opponentDisconnected'
                    })}\n\n`);
                }
                break;
            }
        }
        
        connections.delete(query.playerId);
    });
    
    // Store connection
    connections.set(query.playerId, res);
    
    // Send initial connection message
    res.write(`data: ${JSON.stringify({
        type: 'connected'
    })}\n\n`);
    
    // Keep connection alive
    const keepAlive = setInterval(() => {
        res.write(`data: ${JSON.stringify({
            type: 'ping'
        })}\n\n`);
    }, 30000);
    
    res.on('close', () => {
        clearInterval(keepAlive);
    });
};
