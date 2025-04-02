const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const morgan = require('morgan');

// Initialize Express app
const app = express();

// Logging middleware
app.use(morgan('combined'));

// Enable CORS to allow communication with frontend (React)
app.use(cors());
app.use(bodyParser.json()); // Parse JSON request bodies

// Serve static files from React's build folder - MOVED BEFORE API ROUTES
const buildPath = path.join(__dirname, 'build');
console.log('Serving static files from:', buildPath);

// Verify build folder exists
if (!fs.existsSync(buildPath)) {
  console.error('Build folder does not exist at:', buildPath);
}
app.use(express.static(buildPath));

// Initialize SQLite database
const db = new sqlite3.Database('./books.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Create 'books' table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL
  )
`);

// API Routes
app.get('/api', (_, res) => {
  res.send('Hello from the backend!');
});

app.get('/books', (_, res) => {
  db.all('SELECT * FROM books', (err, rows) => {
    if (err) {
      res.status(500).json({ message: 'Error fetching books' });
    } else {
      res.json(rows);
    }
  });
});

app.post('/books', (req, res) => {
  const { title, author } = req.body;
  const query = 'INSERT INTO books (title, author) VALUES (?, ?)';
  
  db.run(query, [title, author], function(err) {
    if (err) {
      res.status(500).json({ message: 'Error adding book' });
    } else {
      res.status(200).json({ id: this.lastID, title, author });
    }
  });
});

app.put('/books/:id', (req, res) => {
  const { title, author } = req.body;
  const { id } = req.params;
  const query = 'UPDATE books SET title = ?, author = ? WHERE id = ?';
  
  db.run(query, [title, author, id], function(err) {
    if (err) {
      res.status(500).json({ message: 'Error updating book' });
    } else if (this.changes === 0) {
      res.status(404).json({ message: 'Book not found' });
    } else {
      res.status(200).json({ id, title, author });
    }
  });
});

app.delete('/books/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM books WHERE id = ?';
  
  db.run(query, [id], function(err) {
    if (err) {
      res.status(500).json({ message: 'Error deleting book' });
    } else if (this.changes === 0) {
      res.status(404).json({ message: 'Book not found' });
    } else {
      res.status(204).send();
    }
  });
});

// Serve React index.html for unknown routes (for React Router)
app.get('*', (req, res) => {
  console.log('Serving React app for route:', req.url);
  res.sendFile(path.join(buildPath, 'index.html'));
});

// HTTP Server
const httpPort = process.env.HTTP_PORT || 3000;
const httpServer = http.createServer(app);

httpServer.listen(httpPort, '0.0.0.0', () => {
  console.log(`HTTP server running on port ${httpPort}`);
});

// SSL/TLS options from certs folder
const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, 'certs', 'privatekey.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'certs', 'server.crt')),
};

// HTTPS Server
const httpsPort = process.env.HTTPS_PORT || 8443;
const httpsServer = https.createServer(httpsOptions, app);

httpsServer.on('error', (err) => {
  console.error('HTTPS server error:', err);
});

httpsServer.listen(httpsPort, '0.0.0.0', () => {
  console.log(`HTTPS server running on port ${httpsPort}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Closing database connection...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    }
    console.log('Database connection closed.');
    process.exit(0);
  });
});

module.exports = { app, httpServer, httpsServer };