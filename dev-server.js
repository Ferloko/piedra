const express = require('express');
const path = require('path');

const app = express();
const PORT = 8080;

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve the API routes
app.use('/api/match', require('./api/match.js'));

// Default route to serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Development server running on http://localhost:${PORT}`);
    console.log('This server uses HTTP polling (no Socket.IO)');
    console.log('For Socket.IO testing, use: npm start');
});
