// File: server.js
const express = require('express');
const app = express();

// Serve static files from the public folder.
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
