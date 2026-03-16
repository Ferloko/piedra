const express = require('express');
const path = require('path');

const app = express();
const PORT = 8081;

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Import and use the SSE handler
app.use('/api/sse', require('./api/sse.js'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'multiplayer.html'));
});

app.listen(PORT, () => {
    console.log(`SSE Development server running on http://localhost:${PORT}`);
    console.log('Open your browser and go to: http://localhost:8081');
});
