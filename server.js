const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const rooms = new Map();
const waitingPlayers = [];

function determineWinner(choice1, choice2) {
    if (choice1 === choice2) return 'tie';
    
    const winConditions = {
        'rock': 'scissors',
        'paper': 'rock',
        'scissors': 'paper'
    };
    
    return winConditions[choice1] === choice2 ? 'player1' : 'player2';
}

io.on('connection', (socket) => {
    console.log('Jugador conectado:', socket.id);
    
    socket.on('findGame', () => {
        if (waitingPlayers.length > 0) {
            const opponent = waitingPlayers.shift();
            const roomId = `room_${Date.now()}`;
            
            socket.join(roomId);
            opponent.join(roomId);
            
            const room = {
                id: roomId,
                players: {
                    player1: { id: socket.id, choice: null },
                    player2: { id: opponent.id, choice: null }
                },
                gameState: 'waiting'
            };
            
            rooms.set(roomId, room);
            
            socket.emit('gameFound', { roomId, player: 'player1' });
            opponent.emit('gameFound', { roomId, player: 'player2' });
            
            io.to(roomId).emit('gameStart');
        } else {
            waitingPlayers.push(socket);
            socket.emit('waiting');
        }
    });
    
    socket.on('makeChoice', ({ roomId, choice }) => {
        const room = rooms.get(roomId);
        if (!room) return;
        
        const player = room.players.player1.id === socket.id ? 'player1' : 'player2';
        room.players[player].choice = choice;
        
        socket.emit('choiceMade', { choice });
        
        if (room.players.player1.choice && room.players.player2.choice) {
            const winner = determineWinner(
                room.players.player1.choice,
                room.players.player2.choice
            );
            
            const result = {
                player1Choice: room.players.player1.choice,
                player2Choice: room.players.player2.choice,
                winner: winner
            };
            
            io.to(roomId).emit('gameResult', result);
            room.gameState = 'finished';
        }
    });
    
    socket.on('playAgain', ({ roomId }) => {
        const room = rooms.get(roomId);
        if (!room) return;
        
        const player = room.players.player1.id === socket.id ? 'player1' : 'player2';
        room.players[player].choice = null;
        
        socket.emit('choiceMade', { choice: null });
        
        if (!room.players.player1.choice && !room.players.player2.choice) {
            room.gameState = 'waiting';
            io.to(roomId).emit('gameStart');
        }
    });
    
    socket.on('disconnect', () => {
        console.log('Jugador desconectado:', socket.id);
        
        const index = waitingPlayers.findIndex(p => p.id === socket.id);
        if (index !== -1) {
            waitingPlayers.splice(index, 1);
        }
        
        for (const [roomId, room] of rooms.entries()) {
            if (room.players.player1.id === socket.id || room.players.player2.id === socket.id) {
                io.to(roomId).emit('opponentDisconnected');
                rooms.delete(roomId);
                break;
            }
        }
    });
});

server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
