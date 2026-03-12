const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 8080;

// Enable CORS for all routes
app.use(cors());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve the API routes
app.use('/api/match', require('./api/match.js'));

app.get('/', (req, res) => {
    // Read the template and replace placeholder with empty string (no Socket.IO)
    const template = fs.readFileSync(path.join(__dirname, 'server-template.html'), 'utf8');
    const htmlWithoutSocketIO = template.replace('{{SOCKET_IO_SCRIPT}}', '');
    res.send(htmlWithoutSocketIO);
});

app.listen(PORT, () => {
    console.log(`Development server running on http://localhost:${PORT}`);
    console.log('This server uses HTTP polling (no Socket.IO)');
    console.log('For Socket.IO testing, use: npm start');
});
