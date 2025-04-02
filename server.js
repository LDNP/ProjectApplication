const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const https = require('https');

// Initialize Express app
const app = express();

// Enable CORS to allow communication with frontend (React)
app.use(cors());
app.use(bodyParser.json()); // Parse JSON request bodies

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
app.get('/', (_, res) => {
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

// Serve static files from React's build folder
app.use(express.static(path.join(__dirname, 'build')));

// Serve React index.html for unknown routes (for React Router)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// SSL/TLS options from certs folder
const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, 'certs', 'privatekey.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'certs', 'server.crt')),
};

// Start HTTPS server on port 8443, binding to all network interfaces
const httpsPort = process.env.HTTPS_PORT || 8443;
https.createServer(httpsOptions, app).listen(httpsPort, '0.0.0.0', () => {
  console.log(`HTTPS server running on port ${httpsPort}`);
});

module.exports = { app };